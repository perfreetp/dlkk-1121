import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Home, ChevronRight, Heart, Share2, Flag, Copy, Check, CheckCircle,
  Download, Package, Calendar, Hash, ChevronDown, ChevronUp,
  Monitor, HardDrive, AlertTriangle, ThumbsUp, ThumbsDown, Zap, Shield, Cpu
} from 'lucide-react';
import type { Driver, GpuModel } from '@/types';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/appStore';
import { formatDate, formatDownloadCount, truncateHash, copyToClipboard, cn } from '@/utils/format';
import Badge from '@/components/Badge';
import StarRating from '@/components/StarRating';
import MirrorSelector from '@/components/MirrorSelector';
import DownloadButton from '@/components/DownloadButton';
import { OS_OPTIONS, BRAND_OPTIONS } from '@/types';

const mockReviews = [
  { id: '1', author: 'TechEnthusiast', avatar: 'TE', rating: 5, content: '驱动非常稳定，游戏性能提升明显，推荐安装。', date: '2024-01-15' },
  { id: '2', author: 'GamerPro', avatar: 'GP', rating: 4, content: '整体不错，个别老游戏偶尔有闪烁，但不影响使用。', date: '2024-01-10' },
  { id: '3', author: 'DevOps_Andy', avatar: 'DA', rating: 4, content: '安装顺利，CUDA 运行正常，适合开发环境使用。', date: '2024-01-05' },
];

type CompatLevel = 'excellent' | 'good' | 'warning' | 'incompatible';

interface CompatResult {
  level: CompatLevel;
  title: string;
  reasons: string[];
  suggestions: string[];
}

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [historyDrivers, setHistoryDrivers] = useState<Driver[]>([]);
  const [allGpus, setAllGpus] = useState<GpuModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMirror, setSelectedMirror] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'failed'>('idle');
  const [expandedSha, setExpandedSha] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);

  const [compatOs, setCompatOs] = useState('');
  const [compatGpuId, setCompatGpuId] = useState('');
  const [compatResult, setCompatResult] = useState<CompatResult | null>(null);

  const { favorites, toggleFavorite, startDownload, toggleDriverSelection, selectedDriverIds } = useAppStore();
  const isFavorite = favorites.some((f) => f.id === id);
  const isSelected = selectedDriverIds.includes(id || '');

  useEffect(() => {
    Promise.all([
      api.gpus.list(),
      id ? api.drivers.get(id) : Promise.resolve(null),
    ]).then(async ([gpusData, driverRaw]) => {
      setAllGpus(gpusData as GpuModel[]);
      if (driverRaw) {
        const driverData = driverRaw as Driver;
        setDriver(driverData);
        const m = driverData.mirrors.filter((x) => x.enabled);
        if (m.length > 0) setSelectedMirror(m[0].id);
        if (driverData.gpuIds.length > 0) {
          const history = await api.drivers.byGpu(driverData.gpuIds[0]) as Driver[];
          const sortedHistory = history
            .filter(h => h.status === 'approved')
            .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
          setHistoryDrivers(sortedHistory);
        }
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const runCompatCheck = () => {
    if (!driver || !compatOs || !compatGpuId) {
      setCompatResult(null);
      return;
    }
    const reasons: string[] = [];
    const suggestions: string[] = [];
    let level: CompatLevel = 'excellent';
    const gpu = allGpus.find(g => g.id === compatGpuId);
    const gpuSupported = driver.gpuIds.includes(compatGpuId);
    const osSupported = driver.osSupport.includes(compatOs);
    const osPartial = !osSupported && driver.osSupport.some(s => {
      const v1 = compatOs.match(/Windows\s+(\d+)/)?.[1];
      const v2 = s.match(/Windows\s+(\d+)/)?.[1];
      return v1 && v2 && v1 === v2;
    });

    if (!gpuSupported) {
      level = 'incompatible';
      reasons.push(`[显卡不兼容] ${gpu?.name || '该显卡'} 不在此驱动适配列表中`);
      suggestions.push('请确认显卡型号是否正确，或返回型号库查找对应驱动');
    }
    if (!osSupported) {
      if (osPartial) {
        if (level !== 'incompatible') level = 'warning';
        reasons.push(`[系统版本不匹配] ${compatOs} 不在支持列表，此驱动仅支持：${driver.osSupport.join('、')}`);
        suggestions.push('此系统版本与驱动不匹配，强行安装可能导致蓝屏或功能异常');
        suggestions.push('建议选择支持当前系统的驱动版本');
      } else {
        if (level !== 'incompatible') level = 'incompatible';
        reasons.push(`[系统不支持] ${compatOs} 与此驱动完全不兼容，此驱动仅支持：${driver.osSupport.join('、')}`);
        suggestions.push('当前系统无法安装此驱动，请选择支持当前系统的版本');
      }
    }
    if (!driver.isWHQL) {
      if (level === 'excellent') level = 'warning';
      reasons.push('[Beta 风险] 此版本为 Beta 测试版，未经 WHQL 认证，可能存在蓝屏、卡顿等稳定性问题');
      suggestions.push('如遇问题可进入安全模式卸载，或回退到上一版 WHQL 正式版驱动');
      suggestions.push('不建议在生产环境或主力机型上安装 Beta 驱动');
    }

    if (gpuSupported && osSupported) {
      if (driver.isWHQL) {
        reasons.push(`[显卡兼容] ${gpu?.name || ''} 在官方适配列表中，可正常使用`);
        reasons.push(`[系统兼容] ${compatOs} 在支持列表中，完全兼容`);
        reasons.push('[WHQL 认证] 已通过微软 WHQL 认证，稳定性和兼容性有保障');
      } else {
        reasons.push(`[显卡兼容] ${gpu?.name || ''} 在适配列表中`);
        reasons.push(`[系统兼容] ${compatOs} 在支持列表中`);
      }
      if (driver.rating >= 4.5) {
        reasons.push(`[用户口碑] 评分 ${driver.rating.toFixed(1)} 分（${driver.ratingCount} 人评价），口碑极佳`);
      } else if (driver.rating >= 4.0) {
        reasons.push(`[用户口碑] 评分 ${driver.rating.toFixed(1)} 分，整体评价良好`);
      } else {
        if (level === 'excellent') level = 'good';
        reasons.push(`[用户口碑] 评分 ${driver.rating.toFixed(1)} 分偏低，建议安装前查看用户评论`);
        suggestions.push('先查看页面下方的用户评论，了解实际使用反馈');
      }
      if (historyDrivers.length > 1 && historyDrivers[0]?.id === driver.id) {
        reasons.push('[最新版本] 此为当前显卡的最新版驱动，包含最新功能与性能优化');
      }
    }

    const titles: Record<CompatLevel, string> = {
      excellent: '强烈推荐安装',
      good: '推荐安装',
      warning: '谨慎安装，存在风险',
      incompatible: '不建议安装，存在兼容性问题',
    };
    if (suggestions.length === 0 && gpuSupported && osSupported) {
      suggestions.push('安装前建议先备份旧驱动，以便需要时回退');
      suggestions.push('使用 DDU（Display Driver Uninstaller）清理旧驱动后安装更稳定');
    }
    setCompatResult({ level, title: titles[level], reasons, suggestions });
  };

  const handleCopy = async (text: string, field: string) => {
    if (await copyToClipboard(text)) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleDownload = () => {
    if (!driver || !selectedMirror) return;
    setDownloadStatus('downloading');
    setDownloadProgress(0);
    startDownload(driver, selectedMirror);
    const simulate = () => {
      setDownloadProgress((p) => {
        const next = Math.min(p + Math.random() * 12 + 5, 100);
        if (next >= 100) { setDownloadStatus('completed'); return 100; }
        setTimeout(simulate, 1200);
        return Math.round(next);
      });
    };
    setTimeout(simulate, 1000);
  };

  const handleRating = async (rating: number) => {
    if (!id) return;
    try {
      await api.drivers.rate(id, rating);
      setUserRating(rating);
      setShowRatingSuccess(true);
      setTimeout(() => setShowRatingSuccess(false), 2000);
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    if (driver) await copyToClipboard(window.location.href);
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-bg-700 rounded w-1/3" />
          <div className="h-64 bg-bg-700 rounded-xl" />
          <div className="h-48 bg-bg-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!driver) {
    return <div className="container py-20 text-center"><p className="text-slate-400">驱动不存在</p></div>;
  }

  const enabledMirrors = driver.mirrors.filter((m) => m.enabled);
  const copyBtn = (text: string, field: string) => (
    <button onClick={() => handleCopy(text, field)} className="btn-ghost px-3 py-2">
      {copiedField === field ? <Check className="w-4 h-4 text-whql" /> : <Copy className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="container py-6">
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/" className="hover:text-neon-cyan transition-colors flex items-center gap-1"><Home className="w-4 h-4" /> 首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/gpus" className="hover:text-neon-cyan transition-colors">显卡型号库</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{driver.version}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display font-bold text-white">{driver.version}</h1>
          {driver.isWHQL && <Badge variant="whql">WHQL 认证</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => id && toggleFavorite(id)} className={cn('btn-ghost', isFavorite && 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10')}>
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-neon-cyan')} /> {isFavorite ? '已收藏' : '收藏'}
          </button>
          <button onClick={handleShare} className="btn-ghost"><Share2 className="w-4 h-4" /> 分享</button>
          <button className="btn-danger"><Flag className="w-4 h-4" /> 失效上报</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-neon-cyan" /> 文件信息</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><div className="text-xs text-slate-500 mb-1">版本号</div><div className="text-white font-mono">{driver.version}</div></div>
            <div><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> 发布日期</div><div className="text-white">{formatDate(driver.releaseDate)}</div></div>
            <div><div className="text-xs text-slate-500 mb-1">文件大小</div><div className="text-white">{driver.fileSize}</div></div>
            <div><div className="text-xs text-slate-500 mb-1">下载量</div><div className="text-white font-mono">{formatDownloadCount(driver.downloadCount)}</div></div>
            <div>
              <div className="text-xs text-slate-500 mb-1">评分</div>
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(driver.rating)} readOnly size="sm" />
                <span className="text-white font-mono text-sm">{driver.rating.toFixed(1)} ({driver.ratingCount})</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">支持系统</div>
              <div className="flex flex-wrap gap-1">{driver.osSupport.map((os) => <Badge key={os} variant="info" className="text-[10px]">{os}</Badge>)}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> MD5</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-300 bg-bg-900/50 px-3 py-2 rounded border border-white/5">{driver.md5}</code>
                {copyBtn(driver.md5, 'md5')}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> SHA256</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-300 bg-bg-900/50 px-3 py-2 rounded border border-white/5 break-all">
                  {expandedSha ? driver.sha256 : truncateHash(driver.sha256, 12, 12)}
                </code>
                <button onClick={() => setExpandedSha(!expandedSha)} className="btn-ghost px-3 py-2">
                  {expandedSha ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {copyBtn(driver.sha256, 'sha256')}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <MirrorSelector mirrors={driver.mirrors} value={selectedMirror} onChange={setSelectedMirror} />
          <div className="card p-4 space-y-3">
            <DownloadButton progress={downloadProgress} status={downloadStatus} onClick={handleDownload} disabled={enabledMirrors.length === 0} />
            <button onClick={() => id && toggleDriverSelection(id)} className={cn('w-full btn-ghost', isSelected && 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10')}>
              <Download className="w-4 h-4" /> {isSelected ? '已加入批量下载' : '加入批量下载'}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">更新说明</h2>
        <ol className="space-y-3">
          {driver.changelog.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/15 text-neon-cyan flex items-center justify-center text-xs font-mono font-bold border border-neon-cyan/30">{idx + 1}</span>
              <div className="flex items-start gap-2 flex-1">
                <CheckCircle className="w-4 h-4 text-whql flex-shrink-0 mt-0.5" />
                <span className="text-slate-200">{item}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">适配显卡 ({driver.gpuIds.length})</h2>
        <div className="flex flex-wrap gap-2">
          {driver.gpuNames?.map((name, idx) => (
            <Link key={idx} to={`/gpus?search=${encodeURIComponent(name)}`} className="px-3 py-1.5 rounded-lg bg-bg-700/50 border border-white/5 text-sm text-slate-200 hover:border-neon-cyan/30 hover:text-neon-cyan hover:bg-neon-cyan/5 transition-colors">
              {name}
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-neon-cyan" />
          适配性检查
          <span className="text-xs text-slate-500 font-normal">选择你的系统和显卡，快速判断能否安装</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Monitor className="w-3 h-3" /> 系统版本
            </label>
            <select
              value={compatOs}
              onChange={(e) => { setCompatOs(e.target.value); setCompatResult(null); }}
              className="input-base text-sm"
            >
              <option value="">请选择系统版本</option>
              {OS_OPTIONS.map(os => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> 显卡型号
            </label>
            <select
              value={compatGpuId}
              onChange={(e) => { setCompatGpuId(e.target.value); setCompatResult(null); }}
              className="input-base text-sm"
            >
              <option value="">请选择显卡型号</option>
              {allGpus.map(g => (
                <option key={g.id} value={g.id}>
                  {BRAND_OPTIONS.find(b => b.value === g.brand)?.label} {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={runCompatCheck}
              disabled={!compatOs || !compatGpuId}
              className="btn-primary w-full md:w-auto text-sm !py-2.5"
            >
              <Zap className="w-4 h-4" />
              开始检查
            </button>
          </div>
        </div>

        {compatResult && (
          <div className={cn(
            'p-4 rounded-lg border',
            compatResult.level === 'excellent' && 'bg-whql/10 border-whql/30',
            compatResult.level === 'good' && 'bg-neon-cyan/10 border-neon-cyan/30',
            compatResult.level === 'warning' && 'bg-warn/10 border-warn/30',
            compatResult.level === 'incompatible' && 'bg-danger/10 border-danger/30',
          )}>
            <div className="flex items-start gap-3 mb-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                (compatResult.level === 'excellent' || compatResult.level === 'good')
                  ? 'bg-whql/20'
                  : compatResult.level === 'warning' ? 'bg-warn/20' : 'bg-danger/20'
              )}>
                {(compatResult.level === 'excellent' || compatResult.level === 'good') ? (
                  <ThumbsUp className={cn(
                    'w-5 h-5',
                    compatResult.level === 'excellent' ? 'text-whql' : 'text-neon-cyan'
                  )} />
                ) : compatResult.level === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-warn" />
                ) : (
                  <ThumbsDown className="w-5 h-5 text-danger" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  'text-lg font-semibold mb-1',
                  (compatResult.level === 'excellent') && 'text-whql',
                  compatResult.level === 'good' && 'text-neon-cyan',
                  compatResult.level === 'warning' && 'text-warn',
                  compatResult.level === 'incompatible' && 'text-danger',
                )}>
                  {compatResult.title}
                </h3>
                <div className="space-y-1.5 mb-3">
                  {compatResult.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className={cn(
                        'w-4 h-4 mt-0.5 flex-shrink-0',
                        compatResult.level === 'incompatible' ? 'text-danger/60' : 'text-whql/60'
                      )} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
                {compatResult.suggestions.length > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs text-slate-500 mb-2">💡 建议</div>
                    <ul className="space-y-1">
                      {compatResult.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-slate-400">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">历史版本 ({historyDrivers.length})</h2>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
          <div className="space-y-4">
            {historyDrivers.map((d) => {
              const isCurrent = d.id === driver?.id;
              return (
                <div key={d.id} className="relative pl-10">
                  <div className={cn('absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center', d.isWHQL ? 'bg-whql/20 border-whql shadow-glow-green' : 'bg-bg-700 border-slate-500', isCurrent && 'ring-2 ring-neon-cyan/50')}>
                    <div className={cn('w-2 h-2 rounded-full', d.isWHQL ? 'bg-whql' : 'bg-slate-500')} />
                  </div>
                  <div className={cn('p-4 rounded-lg border transition-colors', isCurrent ? 'bg-neon-cyan/5 border-neon-cyan/30' : 'bg-bg-700/30 border-white/5 hover:border-neon-cyan/20')}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-semibold">{d.version}</span>
                        {d.isWHQL ? <Badge variant="whql" className="text-[10px]">WHQL</Badge> : <Badge variant="warn" className="text-[10px]">Beta</Badge>}
                        {isCurrent && <Badge variant="cyan" className="text-[10px]">当前</Badge>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{formatDate(d.releaseDate)}</span>
                        {isCurrent ? (
                          <span className="text-xs text-neon-cyan">本页</span>
                        ) : (
                          <Link to={`/driver/${d.id}`} className="btn-ghost px-3 py-1 text-xs hover:!border-neon-cyan/30 hover:!bg-neon-cyan/5">
                            <Download className="w-3 h-3" /> 查看
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">{d.fileSize} · {formatDownloadCount(d.downloadCount)} 次下载</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">用户评分与评论</h2>
        <div className="mb-6 p-4 rounded-lg bg-bg-700/30 border border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">您的评分</div>
              <StarRating value={userRating} onChange={handleRating} size="lg" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-bold text-neon-cyan">{driver.rating.toFixed(1)}</div>
              <div className="flex items-center gap-1 justify-end">
                <StarRating value={Math.round(driver.rating)} readOnly size="sm" />
                <span className="text-xs text-slate-500 ml-1">({driver.ratingCount} 评价)</span>
              </div>
            </div>
          </div>
          {showRatingSuccess && <div className="mt-3 text-sm text-whql flex items-center gap-1"><CheckCircle className="w-4 h-4" /> 评分提交成功，感谢您的反馈！</div>}
        </div>
        <div className="space-y-4">
          {mockReviews.map((review) => (
            <div key={review.id} className="flex gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/30 to-bg-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border border-neon-cyan/20">{review.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-white">{review.author}</span>
                  <StarRating value={review.rating} readOnly size="sm" />
                  <span className="text-xs text-slate-500 ml-auto">{review.date}</span>
                </div>
                <p className="text-sm text-slate-300">{review.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

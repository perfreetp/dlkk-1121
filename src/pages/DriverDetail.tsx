import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Home, ChevronRight, Heart, Share2, Flag, Copy, Check, CheckCircle,
  Download, Package, Calendar, Hash, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Driver } from '@/types';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/appStore';
import { formatDate, formatDownloadCount, truncateHash, copyToClipboard, cn } from '@/utils/format';
import Badge from '@/components/Badge';
import StarRating from '@/components/StarRating';
import MirrorSelector from '@/components/MirrorSelector';
import DownloadButton from '@/components/DownloadButton';

const mockReviews = [
  { id: '1', author: 'TechEnthusiast', avatar: 'TE', rating: 5, content: '驱动非常稳定，游戏性能提升明显，推荐安装。', date: '2024-01-15' },
  { id: '2', author: 'GamerPro', avatar: 'GP', rating: 4, content: '整体不错，个别老游戏偶尔有闪烁，但不影响使用。', date: '2024-01-10' },
  { id: '3', author: 'DevOps_Andy', avatar: 'DA', rating: 4, content: '安装顺利，CUDA 运行正常，适合开发环境使用。', date: '2024-01-05' },
];

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [historyDrivers, setHistoryDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMirror, setSelectedMirror] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'failed'>('idle');
  const [expandedSha, setExpandedSha] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);

  const { favorites, toggleFavorite, startDownload, toggleDriverSelection, selectedDriverIds } = useAppStore();
  const isFavorite = favorites.some((f) => f.id === id);
  const isSelected = selectedDriverIds.includes(id || '');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.drivers.get(id).then(async (d) => {
      const driverData = d as Driver;
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
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

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

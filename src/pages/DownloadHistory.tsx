import { useEffect, useState, useMemo } from 'react';
import {
  Download, Inbox, Play, RotateCcw, Trash2, Home, AlertTriangle, Clock,
  CheckCircle2, XCircle, Pause, ChevronDown, ChevronUp, ExternalLink,
  Hash, HardDrive, Monitor, AlertCircle, Copy, Check, Server,
  ArrowUpToLine, ArrowDownToLine, ListOrdered, Shield, RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/utils/api';
import { formatDateTime, cn, copyToClipboard, truncateHash } from '@/utils/format';
import { DOWNLOAD_STATUS_MAP, OS_OPTIONS } from '@/types';
import type { DownloadStatus, DownloadRecord } from '@/types';
import Badge from '@/components/Badge';

type FilterTab = 'all' | DownloadStatus;
type ViewMode = 'list' | 'queue';

const FILTER_TABS: { key: FilterTab; label: string; icon: any }[] = [
  { key: 'all', label: '全部', icon: Download },
  { key: 'downloading', label: '下载中', icon: Clock },
  { key: 'paused', label: '已暂停', icon: Pause },
  { key: 'completed', label: '已完成', icon: CheckCircle2 },
  { key: 'failed', label: '失败', icon: XCircle },
  { key: 'canceled', label: '已取消', icon: XCircle },
];

const QUEUE_STATUS_ORDER: Record<string, number> = {
  downloading: 0,
  paused: 1,
  failed: 2,
  canceled: 3,
  completed: 4,
};

export default function DownloadHistory() {
  const {
    downloads, fetchDownloads, enrichDownloads, updateDownloadProgress,
    pauseDownload, resumeDownload, cancelDownload, retryDownload, verifyDownload,
    moveDownloadTop, moveDownloadBottom,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchDownloads().then(function() { enrichDownloads(); });
  }, [fetchDownloads]);

  useEffect(() => {
    const resumed = downloads.filter(d => d.status === 'downloading');
    resumed.forEach(d => {
      const simulate = (rid: string, base: number) => {
        const cur = downloads.find(x => x.id === rid);
        if (!cur || cur.status !== 'downloading') return;
        const nextProgress = Math.min(base + Math.random() * 12 + 5, 100);
        if (nextProgress >= 100) {
          updateDownloadProgress(rid, 100, 'completed');
        } else {
          const rounded = Math.round(nextProgress);
          updateDownloadProgress(rid, rounded);
          setTimeout(() => simulate(rid, rounded), 1200);
        }
      };
      setTimeout(() => simulate(d.id, d.progress), 1500);
    });
  }, []);

  const queueItems = useMemo(() => {
    return [...downloads]
      .filter(d => d.status !== 'completed')
      .sort((a, b) => (QUEUE_STATUS_ORDER[a.status] || 9) - (QUEUE_STATUS_ORDER[b.status] || 9));
  }, [downloads]);

  const filteredDownloads = useMemo(() => {
    if (activeTab === 'all') return viewMode === 'queue' ? queueItems : downloads;
    const source = viewMode === 'queue' ? queueItems : downloads;
    return source.filter(d => d.status === activeTab);
  }, [downloads, activeTab, viewMode, queueItems]);

  const pendingCount = useMemo(
    () => downloads.filter(d => d.status === 'downloading' || d.status === 'failed' || d.status === 'paused').length,
    [downloads]
  );

  const stats = useMemo(() => ({
    total: downloads.length,
    completed: downloads.filter(d => d.status === 'completed').length,
    downloading: downloads.filter(d => d.status === 'downloading').length,
    paused: downloads.filter(d => d.status === 'paused').length,
    failed: downloads.filter(d => d.status === 'failed').length,
    canceled: downloads.filter(d => d.status === 'canceled').length,
  }), [downloads]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedIds(next);
  };

  const handleCopy = async (text: string, key: string) => {
    if (await copyToClipboard(text)) {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleResumeAll = () => {
    const items = viewMode === 'queue' ? queueItems : downloads;
    items
      .filter(d => d.status === 'paused' || d.status === 'failed')
      .forEach(d => d.status === 'failed' ? retryDownload(d.id) : resumeDownload(d.id));
  };

  const handlePauseAll = () => {
    downloads.filter(d => d.status === 'downloading').forEach(d => pauseDownload(d.id));
  };

  const handleDelete = async (id: string) => {
    try {
      await api.downloads.delete(id);
      await fetchDownloads();
      const next = new Set(expandedIds);
      next.delete(id);
      setExpandedIds(next);
    } catch (e) {
      console.error(e);
    }
  };

  const renderDetailPanel = (item: DownloadRecord) => {
    const mirrorName = item.mirrorName || '—';
    const mirrorUrl = item.mirrorUrl;
    const gpuNames = item.gpuNames || [];
    const osSupport = item.osSupport || [];
    const md5 = item.md5;
    const sha256 = item.sha256;
    const installNotes = item.installNotes || [];

    return (
      <div className="border-t border-white/5 p-4 bg-bg-800/30 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Server className="w-3 h-3" /> 来源镜像
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="cyan">{mirrorName}</Badge>
                {mirrorUrl && (
                  <a href={mirrorUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-neon-cyan truncate max-w-xs inline-flex items-center gap-1">
                    {truncateHash(mirrorUrl, 20, 20)}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {osSupport.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Monitor className="w-3 h-3" /> 支持系统
                </div>
                <div className="flex flex-wrap gap-1">
                  {osSupport.map(os => (
                    <Badge key={os} variant="info" className="text-[10px]">{os}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> 适配显卡 ({gpuNames.length || '—'})
              </div>
              {gpuNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {gpuNames.map((name, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-bg-700 text-slate-300 border border-white/5">
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">暂无数据</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {md5 && (
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> MD5 校验码
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-slate-300 bg-bg-900/50 px-3 py-1.5 rounded border border-white/5 truncate">
                    {md5}
                  </code>
                  <button onClick={() => handleCopy(md5, `${item.id}-md5`)} className="btn-ghost !py-1 !px-2">
                    {copied === `${item.id}-md5` ? <Check className="w-3 h-3 text-whql" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}

            {sha256 && (
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> SHA256 校验码
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-slate-300 bg-bg-900/50 px-3 py-1.5 rounded border border-white/5 truncate">
                    {truncateHash(sha256, 16, 16)}
                  </code>
                  <button onClick={() => handleCopy(sha256, `${item.id}-sha256`)} className="btn-ghost !py-1 !px-2">
                    {copied === `${item.id}-sha256` ? <Check className="w-3 h-3 text-whql" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}

            {item.status === 'completed' && item.verifyStatus && item.verifyStatus !== 'skipped' && (
              <div>
                <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> 文件校验
                </div>
                <div className={cn(
                  'flex items-center gap-2 p-2.5 rounded-lg border',
                  item.verifyStatus === 'passed' && 'bg-whql/5 border-whql/30',
                  item.verifyStatus === 'failed' && 'bg-danger/5 border-danger/30',
                  item.verifyStatus === 'verifying' && 'bg-neon-cyan/5 border-neon-cyan/30',
                  item.verifyStatus === 'pending' && 'bg-bg-700/50 border-white/10'
                )}>
                  {item.verifyStatus === 'passed' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-whql flex-shrink-0" />
                      <span className="text-sm text-whql font-medium">校验通过</span>
                      <span className="text-xs text-slate-500 ml-auto">MD5 · SHA256 均匹配</span>
                    </>
                  )}
                  {item.verifyStatus === 'failed' && (
                    <>
                      <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                      <div>
                        <span className="text-sm text-danger font-medium">校验失败</span>
                        <p className="text-xs text-slate-500 mt-0.5">{item.verifyError || '文件完整性校验未通过'}</p>
                      </div>
                      <button onClick={() => retryDownload(item.id)} className="ml-auto btn-primary !py-1 !px-2 text-xs">
                        <RotateCcw className="w-3 h-3" />重新下载
                      </button>
                    </>
                  )}
                  {item.verifyStatus === 'verifying' && (
                    <>
                      <RefreshCw className="w-4 h-4 text-neon-cyan animate-spin flex-shrink-0" />
                      <span className="text-sm text-neon-cyan font-medium">校验中...</span>
                      <span className="text-xs text-slate-500 ml-auto">正在计算文件哈希</span>
                    </>
                  )}
                  {item.verifyStatus === 'pending' && (
                    <>
                      <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-400">等待校验</span>
                      <button onClick={() => verifyDownload(item.id)} className="ml-auto btn-ghost !py-1 !px-2 text-xs">
                        <RefreshCw className="w-3 h-3" />立即校验
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {item.status === 'failed' && item.failReason && (
              <div>
                <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 失败原因
                </div>
                <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/30">
                  <p className="text-sm text-danger">{item.failReason}</p>
                </div>
              </div>
            )}

            {installNotes.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 安装提示
                </div>
                <ol className="space-y-1.5">
                  {installNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="flex-shrink-0 w-4 h-4 rounded bg-warn/20 text-warn flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (downloads.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="card p-12 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-bg-700 flex items-center justify-center">
            <Inbox className="w-10 h-10 text-neon-cyan" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">暂无下载记录</h2>
          <p className="text-slate-400 mb-6">去驱动库选择合适的驱动开始下载吧</p>
          <button className="btn-primary">
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/15 flex items-center justify-center">
              <Download className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">下载记录</h1>
              <p className="text-sm text-slate-400">管理你的所有驱动下载任务</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex bg-bg-700/50 rounded-lg border border-white/10 p-0.5">
              <button onClick={() => setViewMode('list')} className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1',
                viewMode === 'list' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-slate-400 hover:text-white'
              )}>
                <Download className="w-3.5 h-3.5" /> 列表
              </button>
              <button onClick={() => setViewMode('queue')} className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1',
                viewMode === 'queue' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-slate-400 hover:text-white'
              )}>
                <ListOrdered className="w-3.5 h-3.5" /> 队列
              </button>
            </div>
            {stats.downloading > 0 && (
              <button onClick={handlePauseAll} className="btn-ghost text-sm">
                <Pause className="w-4 h-4" /> 全部暂停
              </button>
            )}
            {(stats.paused > 0 || stats.failed > 0) && (
              <button onClick={handleResumeAll} className="btn-primary text-sm">
                <Play className="w-4 h-4" /> 全部继续
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === 'all'
              ? (viewMode === 'queue' ? queueItems.length : downloads.length)
              : downloads.filter(d => d.status === tab.key).length;
            if (tab.key !== 'all' && count === 0) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === tab.key
                    ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 shadow-glow-cyan'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-xs',
                  activeTab === tab.key ? 'bg-neon-cyan/20' : 'bg-white/10'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {pendingCount > 0 && (
          <div className="card p-4 border-warn/30 bg-warn/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warn" />
                <div>
                  <p className="font-medium text-warn">检测到 {pendingCount} 个未完成的下载</p>
                  <p className="text-sm text-slate-400">点击继续下载以恢复中断的任务</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredDownloads.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-400">当前分类下暂无下载记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDownloads.map((item, index) => {
              const statusInfo = DOWNLOAD_STATUS_MAP[item.status];
              const speed = item.status === 'downloading'
                ? `${(Math.random() * 5 + 1).toFixed(1)} MB/s`
                : '-';
              const isExpanded = expandedIds.has(item.id);
              const isQueued = viewMode === 'queue' && item.status !== 'completed';
              return (
                <div key={item.id} className={cn('card card-hover overflow-hidden', isExpanded && 'ring-1 ring-neon-cyan/30')}>
                  <div className="p-4">
                    <div className="flex items-start gap-4 flex-col md:flex-row md:items-center">
                      {isQueued && (
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-neon-cyan/10 text-neon-cyan flex items-center justify-center text-xs font-bold border border-neon-cyan/30">
                          {index + 1}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{item.driverName}</h3>
                          <span className="text-sm text-slate-400">v{item.version}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{formatDateTime(item.startTime)}</span>
                          <span>{item.size}</span>
                        </div>
                      </div>

                      <div className="flex-1 w-full md:w-auto">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={cn('badge', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                          {item.status === 'completed' && item.verifyStatus === 'passed' && (
                            <span className="badge !bg-whql/15 !text-whql !border-whql/30 inline-flex items-center gap-1" title="文件校验通过">
                              <CheckCircle2 className="w-3 h-3" /> 校验通过
                            </span>
                          )}
                          {item.status === 'completed' && item.verifyStatus === 'failed' && (
                            <span className="badge !bg-danger/15 !text-danger !border-danger/30 inline-flex items-center gap-1" title="文件校验失败">
                              <XCircle className="w-3 h-3" /> 校验失败
                            </span>
                          )}
                          {item.status === 'completed' && item.verifyStatus === 'verifying' && (
                            <span className="badge !bg-neon-cyan/15 !text-neon-cyan !border-neon-cyan/30 inline-flex items-center gap-1" title="正在校验文件">
                              <RefreshCw className="w-3 h-3 animate-spin" /> 校验中
                            </span>
                          )}
                          {item.status === 'downloading' && (
                            <span className="text-sm text-neon-cyan font-mono">{speed}</span>
                          )}
                        </div>
                        <div className="w-full h-2 bg-bg-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              item.status === 'completed' ? 'bg-whql' :
                              item.status === 'failed' ? 'bg-danger' :
                              item.status === 'paused' ? 'bg-warn' :
                              item.status === 'canceled' ? 'bg-slate-500' :
                              'bg-neon-cyan shadow-glow-cyan'
                            )}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>{item.progress}%</span>
                          <span>
                            {item.status === 'completed' ? `已完成 · ${formatDateTime(item.completedTime || '')}` :
                             item.status === 'failed' ? '下载失败' :
                             item.status === 'canceled' ? '已取消' :
                             item.status === 'paused' ? `已暂停 · ${item.progress}%` :
                             `${Math.round(item.progress * (parseFloat(item.size) || 1) / 100)} MB / ${item.size}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.status === 'downloading' && (
                          <>
                            <button onClick={() => pauseDownload(item.id)} className="btn-ghost text-sm px-3 py-1.5" title="暂停">
                              <Pause className="w-4 h-4" />暂停
                            </button>
                            <button onClick={() => cancelDownload(item.id)} className="btn-danger text-sm px-3 py-1.5" title="取消">
                              <XCircle className="w-4 h-4" />取消
                            </button>
                          </>
                        )}
                        {item.status === 'paused' && (
                          <>
                            <button onClick={() => resumeDownload(item.id)} className="btn-primary text-sm px-3 py-1.5" title="继续">
                              <Play className="w-4 h-4" />继续
                            </button>
                            <button onClick={() => cancelDownload(item.id)} className="btn-danger text-sm px-3 py-1.5" title="取消">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === 'failed' && (
                          <button onClick={() => retryDownload(item.id)} className="btn-primary text-sm px-3 py-1.5" title="重试">
                            <RotateCcw className="w-4 h-4" />重试
                          </button>
                        )}
                        {item.status === 'canceled' && (
                          <button onClick={() => retryDownload(item.id)} className="btn-ghost text-sm px-3 py-1.5" title="重新下载">
                            <RotateCcw className="w-4 h-4" />重新下载
                          </button>
                        )}
                        {isQueued && (item.status === 'downloading' || item.status === 'paused' || item.status === 'failed') && (
                          <>
                            <button onClick={() => moveDownloadTop(item.id)} className="btn-ghost text-sm !px-2 !py-1.5" title="置顶">
                              <ArrowUpToLine className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => moveDownloadBottom(item.id)} className="btn-ghost text-sm !px-2 !py-1.5" title="移到底部">
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => toggleExpand(item.id)} className="btn-ghost text-sm px-3 py-1.5" title="详情">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          详情
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="btn-danger text-sm px-3 py-1.5" title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {isExpanded && renderDetailPanel(item)}
                </div>
              );
            })}
          </div>
        )}

        <div className="card p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-white font-display">{stats.total}</p>
              <p className="text-sm text-slate-400">总记录数</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-whql font-display">{stats.completed}</p>
              <p className="text-sm text-slate-400">已完成</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-neon-cyan font-display">{stats.downloading}</p>
              <p className="text-sm text-slate-400">下载中</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-warn font-display">{stats.paused}</p>
              <p className="text-sm text-slate-400">已暂停</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-danger font-display">{stats.failed + stats.canceled}</p>
              <p className="text-sm text-slate-400">失败/取消</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

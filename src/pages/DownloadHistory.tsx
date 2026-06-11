import { useEffect, useState, useMemo } from 'react';
import { Download, Inbox, Play, RotateCcw, Trash2, Home, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/utils/api';
import { formatDateTime, cn } from '@/utils/format';
import { DOWNLOAD_STATUS_MAP } from '@/types';
import type { DownloadStatus } from '@/types';

type FilterTab = 'all' | DownloadStatus;

const FILTER_TABS: { key: FilterTab; label: string; icon: any }[] = [
  { key: 'all', label: '全部', icon: Download },
  { key: 'downloading', label: '下载中', icon: Clock },
  { key: 'completed', label: '已完成', icon: CheckCircle },
  { key: 'failed', label: '失败', icon: XCircle },
];

export default function DownloadHistory() {
  const { downloads, fetchDownloads, updateDownloadProgress } = useAppStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const filteredDownloads = useMemo(() => {
    if (activeTab === 'all') return downloads;
    return downloads.filter(d => d.status === activeTab);
  }, [downloads, activeTab]);

  const pendingCount = useMemo(
    () => downloads.filter(d => d.status === 'downloading' || d.status === 'failed').length,
    [downloads]
  );

  const stats = useMemo(() => ({
    total: downloads.length,
    completed: downloads.filter(d => d.status === 'completed').length,
    downloading: downloads.filter(d => d.status === 'downloading').length,
    failed: downloads.filter(d => d.status === 'failed').length,
  }), [downloads]);

  const handleResume = (id: string) => {
    updateDownloadProgress(id, 0, 'downloading');
  };

  const handleRetry = (id: string) => {
    updateDownloadProgress(id, 0, 'downloading');
  };

  const handleDelete = async (id: string) => {
    try {
      await api.downloads.delete(id);
      await fetchDownloads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResumeAll = () => {
    downloads
      .filter(d => d.status === 'downloading' || d.status === 'failed')
      .forEach(d => updateDownloadProgress(d.id, d.status === 'failed' ? 0 : d.progress, 'downloading'));
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/15 flex items-center justify-center">
              <Download className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">下载记录</h1>
              <p className="text-sm text-slate-400">管理你的所有驱动下载任务</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === 'all'
              ? downloads.length
              : downloads.filter(d => d.status === tab.key).length;
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
              <button onClick={handleResumeAll} className="btn-primary text-sm">
                <Play className="w-4 h-4" />
                全部继续
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredDownloads.map(item => {
            const statusInfo = DOWNLOAD_STATUS_MAP[item.status];
            const speed = item.status === 'downloading'
              ? `${(Math.random() * 5 + 1).toFixed(1)} MB/s`
              : '-';
            return (
              <div key={item.id} className="card p-4 card-hover">
                <div className="flex items-start gap-4 flex-col md:flex-row md:items-center">
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
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn('badge', statusInfo.color)}>
                        {statusInfo.label}
                      </span>
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
                          'bg-neon-cyan shadow-glow-cyan'
                        )}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>{item.progress}%</span>
                      <span>{item.status === 'completed' ? '已完成' : item.status === 'failed' ? '下载失败' : `${Math.round(item.progress * parseFloat(item.size) / 100)} MB / ${item.size}`}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'downloading' && (
                      <button onClick={() => handleResume(item.id)} className="btn-ghost text-sm px-3 py-1.5">
                        <Play className="w-4 h-4" />
                        继续
                      </button>
                    )}
                    {item.status === 'failed' && (
                      <button onClick={() => handleRetry(item.id)} className="btn-ghost text-sm px-3 py-1.5">
                        <RotateCcw className="w-4 h-4" />
                        重试
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="btn-danger text-sm px-3 py-1.5">
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
              <p className="text-3xl font-bold text-danger font-display">{stats.failed}</p>
              <p className="text-sm text-slate-400">失败</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  Settings, Database, CheckCircle2, Clock, XCircle, HardDrive, MessageSquare,
  Link as LinkIcon, Power, Eye, X,
} from 'lucide-react';
import Badge from '@/components/Badge';
import DataTable, { DataColumn } from '@/components/DataTable';
import { api } from '@/utils/api';
import { formatDateTime, cn } from '@/utils/format';
import { FEEDBACK_TYPES, FEEDBACK_STATUS_MAP } from '@/types';
import type { Feedback, Driver } from '@/types';

type TabKey = 'pending_drivers' | 'feedback' | 'mirrors';
interface Stats { total: number; approved: number; pending: number; rejected: number; }
interface MirrorRow { id: string; driverId: string; driverName: string; mirrorName: string; url: string; speed?: number; enabled: boolean; }

export default function AdminReview() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending_drivers');
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [mirrors, setMirrors] = useState<MirrorRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailModal, setDetailModal] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'processing' | 'resolved'>('processing');

  const reload = () => {
    api.admin.stats().then((d) => setStats(d as Stats)).catch(console.error);
    api.admin.pendingDrivers().then((d) => setPendingDrivers(d as Driver[])).catch(console.error);
    api.feedback.list().then((d) => setFeedbackList(d as Feedback[])).catch(console.error);
    api.drivers.list().then((data) => {
      const rows: MirrorRow[] = [];
      (data as Driver[]).forEach((d) => d.mirrors.forEach((m) => rows.push({
        id: `${d.id}-${m.id}`, driverId: d.id,
        driverName: `${d.version} - ${d.gpuNames?.[0] || d.id}`,
        mirrorName: m.name, url: m.url, speed: m.speed, enabled: m.enabled,
      })));
      setMirrors(rows);
    }).catch(console.error);
  };

  useEffect(() => { reload(); }, []);

  const handleApprove = async (id: string) => { await api.admin.approve(id); reload(); };
  const handleBatchApprove = async () => { await Promise.all(selectedIds.map((id) => api.admin.approve(id))); setSelectedIds([]); reload(); };
  const handleReject = async () => { if (!rejectModal || !rejectReason) return; await api.admin.reject(rejectModal); setRejectModal(null); setRejectReason(''); reload(); };
  const handleToggleMirror = async (driverId: string, mirrorId: string, enabled: boolean) => { await api.admin.toggleMirror(driverId, mirrorId, !enabled); reload(); };
  const handleReplySubmit = async () => { if (!detailModal || !replyText) return; await api.feedback.update(detailModal.id, { status: replyStatus, reply: replyText }); setDetailModal(null); setReplyText(''); reload(); };

  const formatSpeed = (s?: number) => !s ? '—' : s >= 1024 ? `${(s / 1024).toFixed(1)} MB/s` : `${s.toFixed(0)} KB/s`;
  const feedbackBadge = (s: Feedback['status']) => {
    const cfg = FEEDBACK_STATUS_MAP[s];
    const v = s === 'pending' ? 'warn' : s === 'processing' ? 'info' : 'whql';
    return <Badge variant={v}>{cfg.label}</Badge>;
  };

  const statCards = [
    { label: '总驱动数', value: stats.total, icon: Database, color: 'cyan' },
    { label: '已通过', value: stats.approved, icon: CheckCircle2, color: 'whql' },
    { label: '待审核', value: stats.pending, icon: Clock, color: 'warn' },
    { label: '已驳回', value: stats.rejected, icon: XCircle, color: 'danger' },
  ];

  const driverColumns: DataColumn<Driver>[] = [
    { key: 'submitter', title: '提交者', width: '120px', render: (r) => r.submitter || '—' },
    { key: 'version', title: '驱动版本', width: '120px' },
    { key: 'gpuNames', title: 'GPU 型号', render: (r) => r.gpuNames?.join(', ') || '—' },
    { key: 'releaseDate', title: '提交时间', width: '150px', render: (r) => formatDateTime(r.releaseDate) },
    { key: 'submitReason', title: '提交原因', render: (r) => <span className="text-slate-400 line-clamp-1">{r.submitReason || '—'}</span> },
    { key: 'actions', title: '操作', width: '180px', align: 'right', render: (r) => (
      <div className="flex justify-end gap-2">
        <button onClick={() => handleApprove(r.id)} className="btn-ghost !px-3 !py-1.5 text-xs text-whql hover:!border-whql/30">
          <CheckCircle2 className="w-3.5 h-3.5" />通过
        </button>
        <button onClick={() => setRejectModal(r.id)} className="btn-danger !px-3 !py-1.5 text-xs">
          <XCircle className="w-3.5 h-3.5" />驳回
        </button>
      </div>
    )},
  ];

  const feedbackColumns: DataColumn<Feedback>[] = [
    { key: 'type', title: '反馈类型', width: '110px', render: (r) => FEEDBACK_TYPES.find((t) => t.value === r.type)?.label || r.type },
    { key: 'driverName', title: '驱动', render: (r) => r.driverName || '—' },
    { key: 'contact', title: '用户', width: '120px', render: (r) => r.contact || '匿名' },
    { key: 'status', title: '状态', width: '90px', render: (r) => feedbackBadge(r.status) },
    { key: 'createdAt', title: '提交时间', width: '150px', render: (r) => formatDateTime(r.createdAt) },
    { key: 'actions', title: '操作', width: '100px', align: 'right', render: (r) => (
      <div className="flex justify-end">
        <button onClick={() => { setDetailModal(r); setReplyText(r.reply || ''); setReplyStatus(r.status === 'resolved' ? 'resolved' : 'processing'); }} className="btn-ghost !px-3 !py-1.5 text-xs">
          <Eye className="w-3.5 h-3.5" />查看
        </button>
      </div>
    )},
  ];

  const mirrorColumns: DataColumn<MirrorRow>[] = [
    { key: 'driverName', title: '驱动' },
    { key: 'mirrorName', title: '镜像名', width: '120px' },
    { key: 'url', title: 'URL', render: (r) => <span className="text-slate-400 font-mono text-xs">{r.url}</span> },
    { key: 'speed', title: '速度', width: '100px', render: (r) => formatSpeed(r.speed) },
    { key: 'enabled', title: '状态', width: '90px', render: (r) => r.enabled ? <Badge variant="whql">启用</Badge> : <Badge variant="danger">禁用</Badge> },
    { key: 'actions', title: '操作', width: '100px', align: 'right', render: (r) => (
      <div className="flex justify-end">
        <button onClick={() => handleToggleMirror(r.driverId, r.id.split('-')[1], r.enabled)} className={cn(
          '!px-3 !py-1.5 text-xs btn-ghost', r.enabled ? 'text-warn hover:!border-warn/30' : 'text-whql hover:!border-whql/30'
        )}>
          <Power className="w-3.5 h-3.5" />{r.enabled ? '禁用' : '启用'}
        </button>
      </div>
    )},
  ];

  const tabs = [
    { key: 'pending_drivers' as TabKey, label: '待审核驱动', icon: HardDrive },
    { key: 'feedback' as TabKey, label: '反馈处理', icon: MessageSquare },
    { key: 'mirrors' as TabKey, label: '链接管理', icon: LinkIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><Settings className="w-7 h-7 text-neon-cyan" />管理员控制台</h1>
        <p className="section-subtitle">管理驱动审核、反馈处理和镜像链接</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-white font-display">{value}</p>
              </div>
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                color === 'cyan' && 'bg-neon-cyan/15 text-neon-cyan',
                color === 'whql' && 'bg-whql/15 text-whql',
                color === 'warn' && 'bg-warn/15 text-warn',
                color === 'danger' && 'bg-danger/15 text-danger'
              )}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-1 inline-flex gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === key ? 'bg-neon-cyan/15 text-neon-cyan shadow-glow-cyan' : 'text-slate-400 hover:text-white'
          )}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'pending_drivers' && (
        <div>
          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
              <span className="text-sm text-neon-cyan">已选择 {selectedIds.length} 项</span>
              <button onClick={handleBatchApprove} className="btn-ghost !px-3 !py-1.5 text-xs text-whql hover:!border-whql/30">
                <CheckCircle2 className="w-3.5 h-3.5" />批量通过
              </button>
            </div>
          )}
          <DataTable columns={driverColumns} data={pendingDrivers} selectable selectedIds={selectedIds} onSelect={setSelectedIds} rowKey="id" />
        </div>
      )}
      {activeTab === 'feedback' && <DataTable columns={feedbackColumns} data={feedbackList} rowKey="id" />}
      {activeTab === 'mirrors' && <DataTable columns={mirrorColumns} data={mirrors} rowKey="id" />}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">驳回驱动</h3>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
              placeholder="请输入驳回原因..." className="input-base resize-none mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-ghost">取消</button>
              <button onClick={handleReject} disabled={!rejectReason} className="btn-danger">确认驳回</button>
            </div>
          </div>
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">反馈详情</h3>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="cyan">{FEEDBACK_TYPES.find((t) => t.value === detailModal.type)?.label}</Badge>
                {feedbackBadge(detailModal.status)}
              </div>
              <p className="text-sm text-slate-400">驱动：{detailModal.driverName || '—'} · 用户：{detailModal.contact || '匿名'}</p>
              <p className="text-sm text-slate-400">时间：{formatDateTime(detailModal.createdAt)}</p>
              <div className="p-3 rounded-lg bg-bg-700/50">
                <p className="text-xs text-slate-500 mb-1">反馈内容：</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{detailModal.content}</p>
              </div>
              {detailModal.reply && (
                <div className="p-3 rounded-lg bg-whql/10 border border-whql/20">
                  <p className="text-xs text-whql mb-1">已有回复：</p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{detailModal.reply}</p>
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-white mb-2">回复内容</label>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3}
                placeholder="请输入回复内容..." className="input-base resize-none" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">标记状态</label>
              <div className="flex gap-2">
                {(['processing', 'resolved'] as const).map((s) => (
                  <label key={s} className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                    replyStatus === s ? 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan' : 'bg-bg-700/50 border-white/10 text-slate-300'
                  )}>
                    <input type="radio" name="status" value={s} checked={replyStatus === s} onChange={() => setReplyStatus(s)} className="sr-only" />
                    {FEEDBACK_STATUS_MAP[s].label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDetailModal(null)} className="btn-ghost">取消</button>
              <button onClick={handleReplySubmit} disabled={!replyText} className="btn-primary">提交回复</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

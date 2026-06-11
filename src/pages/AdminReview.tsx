import { useState, useEffect } from 'react';
import {
  Settings, Database, CheckCircle2, Clock, XCircle, HardDrive, MessageSquare,
  Link as LinkIcon, Power, Eye, X, Pencil, Plus, Trash2, Gauge, Link2Off,
} from 'lucide-react';
import Badge from '@/components/Badge';
import DataTable, { DataColumn } from '@/components/DataTable';
import { api } from '@/utils/api';
import { formatDateTime, cn } from '@/utils/format';
import { FEEDBACK_TYPES, FEEDBACK_STATUS_MAP } from '@/types';
import type { Feedback, Driver } from '@/types';

type TabKey = 'pending_drivers' | 'feedback' | 'mirrors';
interface Stats { total: number; approved: number; pending: number; rejected: number; }
interface MirrorRow {
  id: string; driverId: string; mirrorId: string; driverName: string;
  mirrorName: string; url: string; speed?: number; enabled: boolean;
  backupUrls?: string[];
}
interface MirrorEditData {
  id: string; driverId: string; mirrorId: string; driverName: string;
  mirrorName: string; url: string; speedStr: string; backupUrlStr: string;
}
interface MirrorAddData {
  driverId: string; mirrorName: string; url: string; speedStr: string; backupUrlStr: string;
}

export default function AdminReview() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending_drivers');
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [mirrors, setMirrors] = useState<MirrorRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailModal, setDetailModal] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'processing' | 'resolved'>('processing');
  const [editMirror, setEditMirror] = useState<MirrorEditData | null>(null);
  const [addMirror, setAddMirror] = useState<MirrorAddData | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setSaveMsg({ type, text });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const reload = () => {
    api.admin.stats().then((d) => setStats(d as Stats)).catch(console.error);
    api.admin.pendingDrivers().then((d) => setPendingDrivers(d as Driver[])).catch(console.error);
    api.feedback.list().then((d) => setFeedbackList(d as Feedback[])).catch(console.error);
    api.drivers.list().then((data) => {
      const driverList = data as Driver[];
      setAllDrivers(driverList);
      const rows: MirrorRow[] = [];
      driverList.forEach((d) => d.mirrors.forEach((m) => rows.push({
        id: `${d.id}-${m.id}`, driverId: d.id, mirrorId: m.id,
        driverName: `${d.version} - ${d.gpuNames?.[0] || d.id}`,
        mirrorName: m.name, url: m.url, speed: m.speed, enabled: m.enabled,
        backupUrls: m.backupUrls,
      })));
      setMirrors(rows);
    }).catch(console.error);
  };

  useEffect(() => { reload(); }, []);

  const handleApprove = async (id: string) => { await api.admin.approve(id); reload(); };
  const handleBatchApprove = async () => { await Promise.all(selectedIds.map((id) => api.admin.approve(id))); setSelectedIds([]); reload(); };
  const handleReject = async () => { if (!rejectModal || !rejectReason) return; await api.admin.reject(rejectModal); setRejectModal(null); setRejectReason(''); reload(); };
  const handleToggleMirror = async (driverId: string, mirrorId: string, enabled: boolean) => {
    await api.admin.toggleMirror(driverId, mirrorId, !enabled);
    reload();
  };
  const handleReplySubmit = async () => { if (!detailModal || !replyText) return; await api.feedback.update(detailModal.id, { status: replyStatus, reply: replyText }); setDetailModal(null); setReplyText(''); reload(); };

  const openEditMirror = (row: MirrorRow) => {
    setEditMirror({
      id: row.id, driverId: row.driverId, mirrorId: row.mirrorId,
      driverName: row.driverName,
      mirrorName: row.mirrorName, url: row.url,
      speedStr: row.speed !== undefined ? String(row.speed) : '',
      backupUrlStr: (row.backupUrls || []).join('\n'),
    });
  };

  const openAddMirror = () => {
    setAddMirror({
      driverId: allDrivers[0]?.id || '',
      mirrorName: '', url: '', speedStr: '', backupUrlStr: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editMirror) return;
    try {
      const speedVal = editMirror.speedStr.trim() === '' ? null : Number(editMirror.speedStr);
      if (editMirror.speedStr.trim() !== '' && isNaN(speedVal as number)) {
        showMsg('error', '测速结果必须是数字（单位 KB/s）');
        return;
      }
      const backupUrls = editMirror.backupUrlStr
        .split('\n').map(s => s.trim()).filter(Boolean);
      await api.admin.updateMirror(editMirror.driverId, editMirror.mirrorId, {
        name: editMirror.mirrorName,
        url: editMirror.url,
        speed: speedVal,
        backupUrls: backupUrls.length > 0 ? backupUrls : ([] as any),
      });
      showMsg('success', '镜像源已更新');
      setEditMirror(null);
      reload();
    } catch (e) {
      console.error(e);
      showMsg('error', '保存失败，请检查输入');
    }
  };

  const handleSaveAdd = async () => {
    if (!addMirror) return;
    if (!addMirror.driverId || !addMirror.mirrorName.trim() || !addMirror.url.trim()) {
      showMsg('error', '请填写驱动、镜像名、URL');
      return;
    }
    try {
      const speedVal = addMirror.speedStr.trim() === '' ? undefined : Number(addMirror.speedStr);
      if (addMirror.speedStr.trim() !== '' && isNaN(speedVal as number)) {
        showMsg('error', '测速结果必须是数字（单位 KB/s）');
        return;
      }
      const backupUrls = addMirror.backupUrlStr
        .split('\n').map(s => s.trim()).filter(Boolean);
      await api.admin.addMirror(addMirror.driverId, {
        name: addMirror.mirrorName.trim(),
        url: addMirror.url.trim(),
        speed: speedVal,
        backupUrls: backupUrls.length > 0 ? backupUrls : undefined,
      });
      showMsg('success', '新镜像源已添加');
      setAddMirror(null);
      reload();
    } catch (e) {
      console.error(e);
      showMsg('error', '添加失败，请检查输入');
    }
  };

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
    { key: 'driverName', title: '驱动', render: (r) => <span className="text-white text-sm">{r.driverName}</span> },
    { key: 'mirrorName', title: '镜像名', width: '120px', render: (r) => <Badge variant="cyan">{r.mirrorName}</Badge> },
    { key: 'url', title: '主地址', render: (r) => (
      <div>
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          className="text-slate-400 font-mono text-xs hover:text-neon-cyan break-all">
          {r.url}
        </a>
        {r.backupUrls && r.backupUrls.length > 0 && (
          <div className="mt-1 text-[10px] text-slate-500">+{r.backupUrls.length} 个备用</div>
        )}
      </div>
    )},
    { key: 'speed', title: '测速', width: '100px', render: (r) => (
      <div className="flex items-center gap-1">
        <Gauge className="w-3 h-3 text-slate-500" />
        <span className={cn('text-xs font-mono', r.speed && r.speed >= 1024 ? 'text-whql' : 'text-slate-400')}>
          {formatSpeed(r.speed)}
        </span>
      </div>
    )},
    { key: 'enabled', title: '状态', width: '90px', render: (r) => r.enabled ? <Badge variant="whql">启用</Badge> : <Badge variant="danger">禁用</Badge> },
    { key: 'actions', title: '操作', width: '180px', align: 'right', render: (r) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => openEditMirror(r)} className="btn-ghost !px-2.5 !py-1.5 text-xs" title="编辑">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleToggleMirror(r.driverId, r.mirrorId, r.enabled)} className={cn(
          '!px-2.5 !py-1.5 text-xs btn-ghost',
          r.enabled ? 'text-warn hover:!border-warn/30' : 'text-whql hover:!border-whql/30'
        )} title={r.enabled ? '禁用' : '启用'}>
          <Power className="w-3.5 h-3.5" />
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

      {saveMsg && (
        <div className={cn(
          'p-3 rounded-lg flex items-center gap-2',
          saveMsg.type === 'success' ? 'bg-whql/10 border border-whql/30 text-whql' : 'bg-danger/10 border border-danger/30 text-danger'
        )}>
          {saveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="text-sm">{saveMsg.text}</span>
        </div>
      )}

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
      {activeTab === 'mirrors' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">
              共 <span className="text-neon-cyan font-medium">{mirrors.length}</span> 个镜像源
              （{mirrors.filter(m => m.enabled).length} 启用 / {mirrors.filter(m => !m.enabled).length} 禁用）
            </div>
            <button onClick={openAddMirror} className="btn-primary !py-2 !px-3 text-sm">
              <Plus className="w-4 h-4" />新增镜像源
            </button>
          </div>
          <DataTable columns={mirrorColumns} data={mirrors} rowKey="id" />
        </div>
      )}

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

      {editMirror && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-neon-cyan" />编辑镜像源
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editMirror.driverName}</p>
              </div>
              <button onClick={() => setEditMirror(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">镜像名称</label>
                <input
                  type="text"
                  value={editMirror.mirrorName}
                  onChange={(e) => setEditMirror({ ...editMirror, mirrorName: e.target.value })}
                  placeholder="例：NVIDIA 官网"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" /> 主下载地址
                </label>
                <input
                  type="url"
                  value={editMirror.url}
                  onChange={(e) => setEditMirror({ ...editMirror, url: e.target.value })}
                  placeholder="https://..."
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" /> 测速结果（KB/s）
                </label>
                <input
                  type="number"
                  value={editMirror.speedStr}
                  onChange={(e) => setEditMirror({ ...editMirror, speedStr: e.target.value })}
                  placeholder="例：5120 = 5 MB/s"
                  className="input-base"
                />
                <p className="text-xs text-slate-500 mt-1">留空表示未测速。1024 KB/s = 1 MB/s</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5 flex items-center gap-1">
                  <Link2Off className="w-3.5 h-3.5 text-slate-500" /> 备用下载地址
                </label>
                <textarea
                  value={editMirror.backupUrlStr}
                  onChange={(e) => setEditMirror({ ...editMirror, backupUrlStr: e.target.value })}
                  placeholder="每行一个备用地址&#10;https://mirror1.example.com/file&#10;https://mirror2.example.com/file"
                  rows={4}
                  className="input-base resize-none font-mono text-xs"
                />
                <p className="text-xs text-slate-500 mt-1">每行填写一个备用 URL，留空表示无备用</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/5">
              <button onClick={() => setEditMirror(null)} className="btn-ghost">取消</button>
              <button onClick={handleSaveEdit} className="btn-primary">
                <CheckCircle2 className="w-4 h-4" />保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {addMirror && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-neon-cyan" />新增镜像源
                </h3>
              </div>
              <button onClick={() => setAddMirror(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">所属驱动</label>
                <select
                  value={addMirror.driverId}
                  onChange={(e) => setAddMirror({ ...addMirror, driverId: e.target.value })}
                  className="input-base"
                >
                  <option value="">请选择驱动</option>
                  {allDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.version} - {d.gpuNames?.[0] || d.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">镜像名称</label>
                <input
                  type="text"
                  value={addMirror.mirrorName}
                  onChange={(e) => setAddMirror({ ...addMirror, mirrorName: e.target.value })}
                  placeholder="例：百度云、阿里云、官网"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" /> 主下载地址
                </label>
                <input
                  type="url"
                  value={addMirror.url}
                  onChange={(e) => setAddMirror({ ...addMirror, url: e.target.value })}
                  placeholder="https://..."
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" /> 测速结果（KB/s）
                </label>
                <input
                  type="number"
                  value={addMirror.speedStr}
                  onChange={(e) => setAddMirror({ ...addMirror, speedStr: e.target.value })}
                  placeholder="例：5120 = 5 MB/s"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5 flex items-center gap-1">
                  <Link2Off className="w-3.5 h-3.5 text-slate-500" /> 备用下载地址
                </label>
                <textarea
                  value={addMirror.backupUrlStr}
                  onChange={(e) => setAddMirror({ ...addMirror, backupUrlStr: e.target.value })}
                  placeholder="每行一个备用地址&#10;https://mirror1.example.com/file&#10;https://mirror2.example.com/file"
                  rows={4}
                  className="input-base resize-none font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/5">
              <button onClick={() => setAddMirror(null)} className="btn-ghost">取消</button>
              <button onClick={handleSaveAdd} className="btn-primary">
                <Plus className="w-4 h-4" />添加镜像源
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

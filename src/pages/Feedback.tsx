import { useState, useEffect } from 'react';
import {
  MessageSquare, Link2, Bug, Send, CheckCircle2, Clock, ChevronDown,
} from 'lucide-react';
import Badge from '@/components/Badge';
import StarRating from '@/components/StarRating';
import DataTable, { DataColumn } from '@/components/DataTable';
import { api } from '@/utils/api';
import { formatDateTime, cn } from '@/utils/format';
import { FEEDBACK_TYPES, FEEDBACK_STATUS_MAP } from '@/types';
import type { Feedback, Driver } from '@/types';

type TabKey = 'broken_link' | 'driver_issue';

export default function Feedback() {
  const [activeTab, setActiveTab] = useState<TabKey>('broken_link');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [brokenLinkForm, setBrokenLinkForm] = useState({ driverId: '', mirrorId: '', content: '', contact: '' });
  const [driverIssueForm, setDriverIssueForm] = useState({ issueType: 'install_issue', driverId: '', rating: 0, content: '', steps: '', contact: '' });
  const selectedDriver = drivers.find((d) => d.id === brokenLinkForm.driverId);

  useEffect(() => {
    api.drivers.list().then((d) => setDrivers(d as Driver[])).catch(console.error);
    api.feedback.list().then((d) => setFeedbackList(d as Feedback[])).catch(console.error);
  }, []);

  const reload = () => {
    api.feedback.list().then((d) => setFeedbackList(d as Feedback[])).catch(console.error);
  };

  const successFlash = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleSubmitBrokenLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokenLinkForm.driverId || !brokenLinkForm.mirrorId || !brokenLinkForm.content) return;
    try {
      await api.feedback.create({ type: 'broken_link', ...brokenLinkForm });
      successFlash();
      setBrokenLinkForm({ driverId: '', mirrorId: '', content: '', contact: '' });
      reload();
    } catch (err) { console.error(err); }
  };

  const handleSubmitDriverIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverIssueForm.driverId || !driverIssueForm.content) return;
    try {
      const { issueType, driverId, rating, content, steps, contact } = driverIssueForm;
      await api.feedback.create({
        type: issueType, driverId, rating,
        content: content + (steps ? `\n\n重现步骤:\n${steps}` : ''), contact,
      });
      successFlash();
      setDriverIssueForm({ issueType: 'install_issue', driverId: '', rating: 0, content: '', steps: '', contact: '' });
      reload();
    } catch (err) { console.error(err); }
  };

  const feedbackColumns: DataColumn<Feedback>[] = [
    { key: 'type', title: '类型', width: '120px', render: (r) => FEEDBACK_TYPES.find((f) => f.value === r.type)?.label || r.type },
    { key: 'status', title: '状态', width: '100px', render: (r) => {
      const s = FEEDBACK_STATUS_MAP[r.status];
      const v = r.status === 'pending' ? 'warn' : r.status === 'processing' ? 'info' : 'whql';
      return <Badge variant={v}>{s.label}</Badge>;
    }},
    { key: 'driverName', title: '驱动', render: (r) => r.driverName || '—' },
    { key: 'content', title: '内容摘要', render: (r) => (
      <span className="text-slate-400 line-clamp-1">{r.content.slice(0, 60)}{r.content.length > 60 ? '...' : ''}</span>
    )},
    { key: 'createdAt', title: '提交时间', width: '160px', render: (r) => formatDateTime(r.createdAt) },
  ];

  const TabBtn = ({ tab, label, icon: Icon }: { tab: TabKey; label: string; icon: any }) => (
    <button onClick={() => setActiveTab(tab)} className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
      activeTab === tab ? 'bg-neon-cyan/15 text-neon-cyan shadow-glow-cyan' : 'text-slate-400 hover:text-white'
    )}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  const DriverSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-sm font-medium text-white mb-2">驱动选择</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base appearance-none pr-10">
          <option value="">请选择驱动</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.version} - {d.gpuNames?.[0] || d.id}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );

  const SubmitBtn = ({ disabled }: { disabled: boolean }) => (
    <button type="submit" disabled={disabled} className="btn-primary w-full relative overflow-hidden">
      {showSuccess ? (
        <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 animate-bounce" />提交成功</span>
      ) : (
        <span className="flex items-center gap-2"><Send className="w-4 h-4" />提交反馈</span>
      )}
      {showSuccess && <CheckCircle2 className="absolute inset-0 m-auto w-16 h-16 text-whql animate-ping opacity-0" />}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><MessageSquare className="w-7 h-7 text-neon-cyan" />问题反馈</h1>
        <p className="section-subtitle">帮助我们改进服务，您的反馈将被认真对待</p>
      </div>

      <div className="card p-1 inline-flex gap-1">
        <TabBtn tab="broken_link" label="失效链接上报" icon={Link2} />
        <TabBtn tab="driver_issue" label="驱动问题提交" icon={Bug} />
      </div>

      {activeTab === 'broken_link' ? (
        <form onSubmit={handleSubmitBrokenLink} className="card p-6 space-y-5">
          <DriverSelect value={brokenLinkForm.driverId} onChange={(v) => setBrokenLinkForm({ ...brokenLinkForm, driverId: v, mirrorId: '' })} />
          {selectedDriver && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">镜像源选择</label>
              <div className="grid gap-2">
                {selectedDriver.mirrors.map((m) => (
                  <label key={m.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    brokenLinkForm.mirrorId === m.id ? 'bg-neon-cyan/10 border-neon-cyan/50' : 'bg-bg-700/50 border-white/10 hover:border-neon-cyan/30'
                  )}>
                    <input type="radio" name="mirror" value={m.id} checked={brokenLinkForm.mirrorId === m.id}
                      onChange={(e) => setBrokenLinkForm({ ...brokenLinkForm, mirrorId: e.target.value })}
                      className="h-4 w-4 text-neon-cyan bg-bg-700 border-bg-600 focus:ring-neon-cyan/30" />
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.url}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-2">问题描述</label>
            <textarea value={brokenLinkForm.content} onChange={(e) => setBrokenLinkForm({ ...brokenLinkForm, content: e.target.value })}
              rows={4} placeholder="请详细描述链接失效的情况..." className="input-base resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">联系方式 <span className="text-slate-500 font-normal">(选填)</span></label>
            <input type="text" value={brokenLinkForm.contact} onChange={(e) => setBrokenLinkForm({ ...brokenLinkForm, contact: e.target.value })}
              placeholder="邮箱或 QQ，方便我们回复" className="input-base" />
          </div>
          <SubmitBtn disabled={!brokenLinkForm.driverId || !brokenLinkForm.mirrorId || !brokenLinkForm.content} />
        </form>
      ) : (
        <form onSubmit={handleSubmitDriverIssue} className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-white mb-2">问题类型</label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TYPES.filter((t) => t.value !== 'broken_link').map((t) => (
                <label key={t.value} className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                  driverIssueForm.issueType === t.value ? 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan' : 'bg-bg-700/50 border-white/10 text-slate-300 hover:border-neon-cyan/30'
                )}>
                  <input type="radio" name="issueType" value={t.value} checked={driverIssueForm.issueType === t.value}
                    onChange={(e) => setDriverIssueForm({ ...driverIssueForm, issueType: e.target.value })} className="sr-only" />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <DriverSelect value={driverIssueForm.driverId} onChange={(v) => setDriverIssueForm({ ...driverIssueForm, driverId: v })} />
          <div>
            <label className="block text-sm font-medium text-white mb-2">评分</label>
            <StarRating value={driverIssueForm.rating} onChange={(v) => setDriverIssueForm({ ...driverIssueForm, rating: v })} size="lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">问题详细描述</label>
            <textarea value={driverIssueForm.content} onChange={(e) => setDriverIssueForm({ ...driverIssueForm, content: e.target.value })}
              rows={4} placeholder="请详细描述遇到的问题..." className="input-base resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">重现步骤 <span className="text-slate-500 font-normal">(选填)</span></label>
            <textarea value={driverIssueForm.steps} onChange={(e) => setDriverIssueForm({ ...driverIssueForm, steps: e.target.value })}
              rows={3} placeholder="请列出重现该问题的步骤..." className="input-base resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">联系方式 <span className="text-slate-500 font-normal">(选填)</span></label>
            <input type="text" value={driverIssueForm.contact} onChange={(e) => setDriverIssueForm({ ...driverIssueForm, contact: e.target.value })}
              placeholder="邮箱或 QQ，方便我们回复" className="input-base" />
          </div>
          <SubmitBtn disabled={!driverIssueForm.driverId || !driverIssueForm.content} />
        </form>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400" />历史反馈</h2>
        <DataTable columns={feedbackColumns} data={feedbackList} rowKey="id" />
        {feedbackList.some((f) => f.status === 'resolved' && f.reply) && (
          <div className="mt-4 space-y-3">
            {feedbackList.filter((f) => f.status === 'resolved' && f.reply).map((f) => (
              <div key={f.id} className="card p-4 border-whql/30">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="whql">已回复</Badge>
                  <span className="text-xs text-slate-500">{formatDateTime(f.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-300 mb-2">您的反馈：{f.content.slice(0, 50)}...</p>
                <div className="bg-bg-700/50 rounded-lg p-3">
                  <p className="text-xs text-neon-cyan mb-1">官方回复：</p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{f.reply}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

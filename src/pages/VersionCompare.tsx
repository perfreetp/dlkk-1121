import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, CheckCircle, BarChart3, GitCompare } from 'lucide-react';
import type { Driver, GpuModel } from '@/types';
import { BRAND_OPTIONS } from '@/types';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/appStore';
import { formatDate, formatDownloadCount, cn, getBrandName } from '@/utils/format';
import Badge from '@/components/Badge';
import StarRating from '@/components/StarRating';

export default function VersionCompare() {
  const [brands] = useState(BRAND_OPTIONS);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [gpus, setGpus] = useState<GpuModel[]>([]);
  const [selectedGpu, setSelectedGpu] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [brandOpen, setBrandOpen] = useState(false);
  const [gpuOpen, setGpuOpen] = useState(false);
  const { startDownload } = useAppStore();

  useEffect(() => {
    if (!selectedBrand) { setGpus([]); return; }
    api.gpus.list({ brand: selectedBrand }).then((data) => setGpus(data as GpuModel[]));
  }, [selectedBrand]);

  useEffect(() => {
    if (!selectedGpu) { setDrivers([]); setSelectedDriverIds([]); return; }
    api.drivers.byGpu(selectedGpu).then((data) => setDrivers(data as Driver[]));
  }, [selectedGpu]);

  const selectedDrivers = useMemo(
    () => drivers.filter((d) => selectedDriverIds.includes(d.id)),
    [drivers, selectedDriverIds]
  );

  const toggleDriver = (id: string) => {
    setSelectedDriverIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const hasDiff = (key: keyof Driver, values: any[]) => {
    const strs = values.map((v) => JSON.stringify(v));
    return new Set(strs).size > 1;
  };

  const rows = [
    { label: 'WHQL 认证', key: 'isWHQL' as const, render: (d: Driver) => d.isWHQL ? <Badge variant="whql">WHQL</Badge> : <Badge variant="warn">Beta</Badge> },
    { label: '发布日期', key: 'releaseDate' as const, render: (d: Driver) => <span className="text-slate-200">{formatDate(d.releaseDate)}</span> },
    { label: '文件大小', key: 'fileSize' as const, render: (d: Driver) => <span className="text-slate-200 font-mono">{d.fileSize}</span> },
    { label: '下载量', key: 'downloadCount' as const, render: (d: Driver) => <span className="text-slate-200 font-mono">{formatDownloadCount(d.downloadCount)}</span> },
    { label: '评分', key: 'rating' as const, render: (d: Driver) => (
      <div className="flex flex-col items-center gap-1">
        <StarRating value={Math.round(d.rating)} readOnly size="sm" />
        <span className="text-xs font-mono text-slate-400">{d.rating.toFixed(1)}</span>
      </div>
    )},
    { label: '支持系统', key: 'osSupport' as const, render: (d: Driver) => (
      <div className="flex flex-wrap gap-1 justify-center">{d.osSupport.map((os) => <Badge key={os} variant="info" className="text-[10px]">{os}</Badge>)}</div>
    )},
    { label: '修复项数量', key: 'changelog' as const, render: (d: Driver) => <span className="text-slate-200 font-mono">{d.changelog.length} 项</span> },
  ];

  const dropdownBtn = (open: boolean, val: string, placeholder: string) => (
    <div className="w-full input-base flex items-center justify-between text-left">
      <span className={val ? 'text-white' : 'text-slate-500'}>{val || placeholder}</span>
      <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
    </div>
  );

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <GitCompare className="w-8 h-8 text-neon-cyan" />
        <div>
          <h1 className="text-2xl font-display font-bold text-white">版本对比</h1>
          <p className="text-sm text-slate-400">选择显卡和驱动版本进行多维度对比</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <label className="text-sm text-slate-400 mb-2 block">品牌</label>
            <button onClick={() => { setBrandOpen(!brandOpen); setGpuOpen(false); }} className="w-full text-left">
              {dropdownBtn(brandOpen, selectedBrand ? getBrandName(selectedBrand) : '', '请选择品牌')}
            </button>
            {brandOpen && (
              <div className="absolute z-20 w-full mt-1 card p-1 max-h-60 overflow-y-auto">
                {brands.map((b) => (
                  <button key={b.value} onClick={() => { setSelectedBrand(b.value); setSelectedGpu(''); setBrandOpen(false); }}
                    className={cn('w-full px-3 py-2 rounded-md text-left text-sm hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors',
                      selectedBrand === b.value ? 'text-neon-cyan bg-neon-cyan/10' : 'text-slate-200')}>
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: b.color }} />{b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <label className="text-sm text-slate-400 mb-2 block">显卡型号</label>
            <button onClick={() => selectedBrand && setGpuOpen(!gpuOpen)} disabled={!selectedBrand} className="w-full text-left disabled:opacity-50">
              {dropdownBtn(gpuOpen, selectedGpu ? gpus.find((g) => g.id === selectedGpu)?.name || '' : '', '请先选择品牌')}
            </button>
            {gpuOpen && (
              <div className="absolute z-20 w-full mt-1 card p-1 max-h-60 overflow-y-auto">
                {gpus.map((g) => (
                  <button key={g.id} onClick={() => { setSelectedGpu(g.id); setGpuOpen(false); }}
                    className={cn('w-full px-3 py-2 rounded-md text-left text-sm hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors',
                      selectedGpu === g.id ? 'text-neon-cyan bg-neon-cyan/10' : 'text-slate-200')}>
                    {g.name}<span className="text-xs text-slate-500 ml-2">({g.driverCount} 个驱动)</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {drivers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-400">选择驱动版本 <span className="text-neon-cyan">({selectedDriverIds.length}/4)</span></label>
              {selectedDriverIds.length > 0 && <button onClick={() => setSelectedDriverIds([])} className="text-xs text-slate-400 hover:text-danger transition-colors">清空选择</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
              {drivers.map((d) => {
                const checked = selectedDriverIds.includes(d.id);
                const disabled = !checked && selectedDriverIds.length >= 4;
                return (
                  <label key={d.id} className={cn('flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    checked ? 'bg-neon-cyan/10 border-neon-cyan/50 shadow-glow-cyan'
                      : disabled ? 'bg-bg-800/30 border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-bg-700/30 border-white/5 hover:border-neon-cyan/30')}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleDriver(d.id)} className="w-4 h-4 accent-neon-cyan bg-bg-700 rounded" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white">{d.version}</span>
                        {d.isWHQL && <Badge variant="whql" className="text-[10px]">WHQL</Badge>}
                      </div>
                      <div className="text-xs text-slate-500">{formatDate(d.releaseDate)}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedDrivers.length < 2 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">请至少选择 2 个驱动版本开始对比</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-700/50">
                  <tr>
                    <th className="sticky left-0 bg-bg-700/50 px-4 py-3 text-left text-sm font-medium text-slate-400 border-b border-white/5 z-10">对比项</th>
                    {selectedDrivers.map((d) => (
                      <th key={d.id} className="px-4 py-3 text-center text-sm font-medium text-white border-b border-white/5 min-w-[140px]">
                        <div className="font-mono">{d.version}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((row) => {
                    const diff = hasDiff(row.key, selectedDrivers.map((d) => d[row.key]));
                    return (
                      <tr key={row.key}>
                        <td className="sticky left-0 bg-bg-800/70 px-4 py-3 text-sm text-slate-300 z-10">{row.label}</td>
                        {selectedDrivers.map((d) => (
                          <td key={d.id} className={cn('px-4 py-3 text-center', diff && 'bg-neon-cyan/10')}>{row.render(d)}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-neon-cyan" /> 评分对比</h2>
            <div className="space-y-4">
              {selectedDrivers.map((d) => {
                const pct = (d.rating / 5) * 100;
                return (
                  <div key={d.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-sm text-white">{d.version}</span>
                      <span className="text-sm font-mono text-neon-cyan">{d.rating.toFixed(1)}</span>
                    </div>
                    <div className="h-6 bg-bg-700/50 rounded-lg overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-neon-cyan-dim to-neon-cyan rounded-lg shadow-glow-cyan transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${pct}%` }}>
                        <span className="text-[10px] font-mono text-bg-900 font-bold">{Math.round(pct)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-whql" /> 更新说明对比</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {selectedDrivers.map((d) => {
                const allItems = selectedDrivers.flatMap((x) => x.changelog);
                return (
                  <div key={d.id} className="p-4 rounded-lg bg-bg-700/30 border border-white/5">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                      <span className="font-mono text-sm text-white font-semibold">{d.version}</span>
                      {d.isWHQL && <Badge variant="whql" className="text-[10px]">WHQL</Badge>}
                    </div>
                    <ul className="space-y-2">
                      {d.changelog.map((item, idx) => {
                        const unique = allItems.filter((x) => x === item).length === 1;
                        return (
                          <li key={idx} className={cn('flex items-start gap-2 text-sm p-2 rounded', unique ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-slate-300')}>
                            <CheckCircle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', unique ? 'text-neon-cyan' : 'text-whql')} />
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

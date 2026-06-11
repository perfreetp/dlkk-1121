import { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Monitor,
  Cpu,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_OPTIONS, OS_OPTIONS } from '@/types';

export interface FilterValues {
  brands: string[];
  series: string[];
  osList: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SeriesOption {
  brand: string;
  series: string[];
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  seriesOptions: SeriesOption[];
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-bg-600 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-200 hover:bg-bg-700/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-neon-cyan">{icon}</span>
          {title}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

export default function FilterPanel({ filters, onChange, seriesOptions }: FilterPanelProps) {
  const toggleArray = (key: 'brands' | 'series' | 'osList', value: string) => {
    const arr = filters[key];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    const patch: Partial<FilterValues> = { [key]: next };
    if (key === 'brands' && next.length === 0) patch.series = [];
    onChange({ ...filters, ...patch });
  };

  const clearAll = () =>
    onChange({ brands: [], series: [], osList: [], dateFrom: undefined, dateTo: undefined, search: undefined });

  const removeTag = (type: string, value: string) => {
    if (type === 'dateFrom' || type === 'dateTo' || type === 'search') {
      onChange({ ...filters, [type]: undefined });
    } else {
      const key = type === 'brand' ? 'brands' : type === 'series' ? 'series' : 'osList';
      toggleArray(key as 'brands' | 'series' | 'osList', value);
    }
  };

  const normalizedSeries: SeriesOption[] = Array.isArray(seriesOptions)
    ? seriesOptions
    : Object.entries(seriesOptions as any).map(([brand, series]) => ({ brand, series: series as string[] }));

  const availableSeries =
    filters.brands.length > 0
      ? normalizedSeries.filter((s) => filters.brands.includes(s.brand)).flatMap((s) => s.series)
      : normalizedSeries.flatMap((s) => s.series);

  const hasActive =
    filters.brands.length + filters.series.length + filters.osList.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search;

  const tags = [
    ...filters.brands.map((b) => ({
      key: `b-${b}`,
      label: BRAND_OPTIONS.find((o) => o.value === b)?.label ?? b,
      onRemove: () => removeTag('brand', b),
    })),
    ...filters.series.map((s) => ({ key: `s-${s}`, label: s, onRemove: () => removeTag('series', s) })),
    ...filters.osList.map((o) => ({ key: `o-${o}`, label: o, onRemove: () => removeTag('os', o) })),
    ...(filters.dateFrom ? [{ key: 'from', label: `从 ${filters.dateFrom}`, onRemove: () => removeTag('dateFrom', '') }] : []),
    ...(filters.dateTo ? [{ key: 'to', label: `至 ${filters.dateTo}`, onRemove: () => removeTag('dateTo', '') }] : []),
    ...(filters.search ? [{ key: 'q', label: filters.search, onRemove: () => removeTag('search', '') }] : []),
  ];

  const chipClass = (active: boolean, color?: string) =>
    cn(
      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all',
      active
        ? color
          ? 'border-transparent'
          : 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
        : 'border-bg-600 bg-bg-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
    );

  const chipStyle = (active: boolean, color?: string) =>
    active && color ? { backgroundColor: `${color}20`, borderColor: color, color } : undefined;

  return (
    <div className="flex h-full flex-col rounded-xl border border-bg-600 bg-bg-800 shadow-card">
      <div className="border-b border-bg-600 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="h-4 w-4 text-neon-cyan" />
          <h3 className="text-sm font-semibold text-slate-100">筛选条件</h3>
          {hasActive && (
            <button type="button" onClick={clearAll} className="ml-auto text-xs text-slate-400 hover:text-neon-cyan">
              清空全部
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索关键词..."
            value={filters.search ?? ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
            className="w-full rounded-lg border border-bg-600 bg-bg-700/50 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
          />
        </div>
      </div>

      {hasActive && (
        <div className="border-b border-bg-600 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t.key}
                className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-0.5 text-xs text-neon-cyan"
              >
                {t.label}
                <button type="button" onClick={t.onRemove} className="ml-0.5 rounded-full p-0.5 hover:bg-neon-cyan/20">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <Section title="品牌" icon={<Cpu className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-2">
            {BRAND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleArray('brands', opt.value)}
                className={chipClass(filters.brands.includes(opt.value), opt.color)}
                style={chipStyle(filters.brands.includes(opt.value), opt.color)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="系列" icon={<Monitor className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {availableSeries.length === 0 ? (
              <p className="text-xs text-slate-500">
                {filters.brands.length === 0 ? '请先选择品牌' : '暂无可用系列'}
              </p>
            ) : (
              availableSeries.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArray('series', s)}
                  className={chipClass(filters.series.includes(s))}
                >
                  {s}
                </button>
              ))
            )}
          </div>
        </Section>

        <Section title="系统版本" icon={<Monitor className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-2">
            {OS_OPTIONS.map((os) => (
              <button
                key={os}
                type="button"
                onClick={() => toggleArray('osList', os)}
                className={chipClass(filters.osList.includes(os))}
              >
                {os}
              </button>
            ))}
          </div>
        </Section>

        <Section title="发布日期" icon={<Calendar className="h-4 w-4" />}>
          <div className="space-y-2">
            {(['dateFrom', 'dateTo'] as const).map((k) => (
              <div key={k}>
                <label className="block text-xs text-slate-400 mb-1">{k === 'dateFrom' ? '开始日期' : '结束日期'}</label>
                <input
                  type="date"
                  value={filters[k] ?? ''}
                  onChange={(e) => onChange({ ...filters, [k]: e.target.value || undefined })}
                  className="w-full rounded-lg border border-bg-600 bg-bg-700/50 px-3 py-1.5 text-sm text-slate-200 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30 [color-scheme:dark]"
                />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

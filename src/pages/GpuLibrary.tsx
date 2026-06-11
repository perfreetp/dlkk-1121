import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Download,
  Trash2,
  ArrowUpDown,
  CheckCircle,
} from 'lucide-react';
import type { GpuModel, SortOption, OrderOption } from '@/types';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/utils/format';
import FilterPanel, { FilterValues, SeriesOption } from '@/components/FilterPanel';
import GpuCard from '@/components/GpuCard';

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'releaseDate', label: '发布时间' },
  { value: 'downloadCount', label: '下载量' },
  { value: 'rating', label: '评分' },
  { value: 'name', label: '名称' },
];

export default function GpuLibrary() {
  const [gpus, setGpus] = useState<GpuModel[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('releaseDate');
  const [order, setOrder] = useState<OrderOption>('desc');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({
    brands: [],
    series: [],
    osList: [],
  });
  const [sortOpen, setSortOpen] = useState(false);

  const { selectedDriverIds, toggleDriverSelection, clearSelection, batchSelect, batchStartDownload } = useAppStore();
  const [batchSuccess, setBatchSuccess] = useState(0);

  useEffect(() => {
    api.gpus.series().then((s) => setSeriesOptions(s as SeriesOption[]));
  }, []);

  useEffect(() => {
    const params: Record<string, any> = {};
    if (searchQuery) params.search = searchQuery;
    if (filters.brands.length > 0) params.brands = filters.brands.join(',');
    if (filters.series.length > 0) params.series = filters.series.join(',');
    if (filters.osList.length > 0) params.os = filters.osList.join(',');
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    params.sort = sort;
    params.order = order;
    api.gpus.list(params).then((g) => setGpus(g as GpuModel[]));
    setPage(1);
  }, [searchQuery, filters, sort, order]);

  const filteredGpus = useMemo(() => gpus, [gpus]);
  const totalPages = Math.max(1, Math.ceil(filteredGpus.length / PAGE_SIZE));
  const pageGpus = filteredGpus.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSelectAll = () => {
    if (selectedDriverIds.length === pageGpus.length && pageGpus.length > 0) {
      clearSelection();
    } else {
      batchSelect(pageGpus.map((g) => g.id));
    }
  };

  const handleBatchDownload = async () => {
    const count = await batchStartDownload(selectedDriverIds);
    setBatchSuccess(count);
    clearSelection();
    setTimeout(() => setBatchSuccess(0), 3000);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="font-display font-bold text-3xl text-white mb-2">显卡型号库</h1>
          <p className="text-slate-400">浏览和筛选所有支持的显卡型号</p>
        </div>

        <div className="flex items-center gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索显卡型号..."
              className="input-base pl-10"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="btn-ghost min-w-[160px]"
            >
              <ArrowUpDown className="w-4 h-4" />
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              <span className="text-xs text-slate-400">
                {order === 'asc' ? '↑' : '↓'}
              </span>
              <ChevronDown className="w-4 h-4 ml-auto" />
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-bg-700 border border-white/10 rounded-lg overflow-hidden shadow-card z-50">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (sort === opt.value) {
                        setOrder(order === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSort(opt.value);
                        setOrder('desc');
                      }
                      setSortOpen(false);
                    }}
                    className={cn(
                      'flex items-center w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-bg-600',
                      sort === opt.value && 'text-neon-cyan'
                    )}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {sort === opt.value && (
                      <span className="text-xs">{order === 'asc' ? '升序' : '降序'}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              seriesOptions={seriesOptions}
            />
          </aside>

          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            {batchSuccess > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-whql/10 border border-whql/30 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-whql flex-shrink-0" />
                <span className="text-whql text-sm">已成功将 <strong>{batchSuccess}</strong> 个驱动加入下载队列，可在 <a href="/downloads" className="underline hover:text-white">下载记录</a> 中查看</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  共 <span className="text-neon-cyan font-medium">{filteredGpus.length}</span> 款显卡
                  {selectedDriverIds.length > 0 && (
                    <span className="ml-2">
                      ，已选 <span className="text-neon-cyan font-medium">{selectedDriverIds.length}</span> 款
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="btn-ghost !py-2 !px-3 text-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectedDriverIds.length === pageGpus.length && pageGpus.length > 0
                    ? '取消全选'
                    : '全选本页'}
                </button>
                <button
                  onClick={handleBatchDownload}
                  disabled={selectedDriverIds.length === 0}
                  className="btn-primary !py-2 !px-4 text-sm"
                >
                  <Download className="w-4 h-4" />
                  批量加入下载
                </button>
                <button
                  onClick={clearSelection}
                  disabled={selectedDriverIds.length === 0}
                  className="btn-danger !py-2 !px-3 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  清空选择
                </button>
              </div>
            </div>

            {pageGpus.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-slate-400">未找到符合条件的显卡</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {pageGpus.map((gpu, i) => (
                    <div
                      key={gpu.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <GpuCard
                        gpu={gpu}
                        selected={selectedDriverIds.includes(gpu.id)}
                        onSelect={() => toggleDriverSelection(gpu.id)}
                      />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="btn-ghost !py-2 !px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1;
                      const isActive = p === page;
                      const isNearby = Math.abs(p - page) <= 2 || p === 1 || p === totalPages;
                      if (!isNearby) {
                        if (Math.abs(p - page) === 3) {
                          return (
                            <span
                              key={p}
                              className="px-2 text-slate-500"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                            isActive
                              ? 'bg-neon-cyan text-bg-900 shadow-glow-cyan'
                              : 'bg-bg-700 text-slate-300 hover:bg-bg-600 border border-white/10'
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="btn-ghost !py-2 !px-3"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

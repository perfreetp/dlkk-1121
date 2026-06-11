export * from '../../shared/types';

export type SortOption = 'releaseDate' | 'downloadCount' | 'rating' | 'name';
export type OrderOption = 'asc' | 'desc';

export interface FilterState {
  brand?: string;
  series?: string;
  os?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort: SortOption;
  order: OrderOption;
}

export const BRAND_OPTIONS = [
  { value: 'nvidia', label: 'NVIDIA', color: '#76B900' },
  { value: 'amd', label: 'AMD Radeon', color: '#ED1C24' },
  { value: 'intel', label: 'Intel Arc', color: '#0071C5' },
];

export const OS_OPTIONS = [
  'Windows 11 64-bit',
  'Windows 10 64-bit',
  'Windows 8 64-bit',
  'Windows 7 64-bit',
];

export const FEEDBACK_TYPES = [
  { value: 'broken_link', label: '失效链接' },
  { value: 'install_issue', label: '安装问题' },
  { value: 'performance', label: '性能异常' },
  { value: 'compatibility', label: '兼容问题' },
  { value: 'other', label: '其他' },
];

export const DOWNLOAD_STATUS_MAP = {
  completed: { label: '已完成', color: 'bg-whql/20 text-whql border-whql/30' },
  downloading: { label: '下载中', color: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30' },
  failed: { label: '失败', color: 'bg-danger/20 text-danger border-danger/30' },
  canceled: { label: '已取消', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  paused: { label: '已暂停', color: 'bg-warn/20 text-warn border-warn/30' },
};

export const FEEDBACK_STATUS_MAP = {
  pending: { label: '待处理', color: 'bg-warn/20 text-warn border-warn/30' },
  processing: { label: '处理中', color: 'bg-info/20 text-info border-info/30' },
  resolved: { label: '已解决', color: 'bg-whql/20 text-whql border-whql/30' },
};

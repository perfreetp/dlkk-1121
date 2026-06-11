import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataColumn<T extends object> {
  key: keyof T | string;
  title: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T extends object> {
  columns: DataColumn<T>[];
  data: T[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  rowKey?: keyof T | ((row: T) => string);
}

function getRowId<T extends object>(
  row: T,
  rowKey: keyof T | ((row: T) => string) | undefined,
  index: number
): string {
  if (typeof rowKey === 'function') return rowKey(row);
  if (rowKey) return String((row as any)[rowKey]);
  if ('id' in row) return String((row as any).id);
  return String(index);
}

export default function DataTable<T extends object>({
  columns,
  data,
  selectable = false,
  selectedIds = [],
  onSelect,
  rowKey,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((row, i) => selectedIds.includes(getRowId(row, rowKey, i)));
  const someSelected = data.some((row, i) => selectedIds.includes(getRowId(row, rowKey, i)));

  const toggleAll = () => {
    if (!onSelect) return;
    if (allSelected) {
      onSelect([]);
    } else {
      onSelect(data.map((row, i) => getRowId(row, rowKey, i)));
    }
  };

  const toggleRow = (id: string) => {
    if (!onSelect) return;
    onSelect(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  };

  const alignClass = (align?: string) =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-bg-600 bg-bg-800">
        <Inbox className="h-12 w-12 text-slate-600" />
        <p className="mt-3 text-sm text-slate-400">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-bg-600 bg-bg-800 shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-bg-700/80 backdrop-blur">
              {selectable && (
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-bg-600 bg-bg-700 text-neon-cyan focus:ring-neon-cyan/30"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-300',
                    alignClass(col.align)
                  )}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              const id = getRowId(row, rowKey, rowIndex);
              const isSelected = selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  className={cn(
                    'border-t border-bg-600 transition-colors',
                    rowIndex % 2 === 0 ? 'bg-bg-800' : 'bg-bg-700/30',
                    isSelected && 'bg-neon-cyan/5',
                    selectable && 'cursor-pointer hover:bg-bg-700/50'
                  )}
                  onClick={() => selectable && toggleRow(id)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                        className="h-4 w-4 cursor-pointer rounded border-bg-600 bg-bg-700 text-neon-cyan focus:ring-neon-cyan/30"
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const cellValue = (row as any)[col.key];
                    return (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'px-4 py-3 text-sm text-slate-200',
                          alignClass(col.align)
                        )}
                      >
                        {col.render ? col.render(row, rowIndex) : cellValue != null ? String(cellValue) : ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

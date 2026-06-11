import { useState } from 'react';
import { Heart, Cpu, Calendar, HardDrive, Usb, Database, Star } from 'lucide-react';
import type { GpuModel } from '@/types';
import { cn, brandColor, getBrandName, formatDate, formatDownloadCount } from '@/utils/format';

interface GpuCardProps {
  gpu: GpuModel;
  selected?: boolean;
  onSelect?: (gpu: GpuModel) => void;
  onFavorite?: (gpu: GpuModel) => void;
}

export default function GpuCard({ gpu, selected, onSelect, onFavorite }: GpuCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const color = brandColor(gpu.brand);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavorite?.(gpu);
  };

  const handleSelect = () => {
    onSelect?.(gpu);
  };

  return (
    <div
      onClick={handleSelect}
      className={cn(
        'card card-hover cursor-pointer relative overflow-hidden group',
        selected && 'ring-2 ring-neon-cyan shadow-glow-cyan'
      )}
      style={{
        boxShadow: selected
          ? `0 0 20px ${color}55, 0 0 40px ${color}22`
          : undefined,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      />

      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <label className="flex items-center justify-center w-7 h-7 rounded-md bg-bg-700/80 backdrop-blur-sm cursor-pointer hover:bg-bg-600 transition-colors">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 accent-neon-cyan cursor-pointer"
          />
        </label>
        <button
          onClick={handleFavorite}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-md bg-bg-700/80 backdrop-blur-sm transition-all duration-200',
            isFavorite ? 'text-red-400 hover:bg-red-500/20' : 'text-slate-400 hover:text-red-400 hover:bg-bg-600'
          )}
        >
          <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3 pr-16">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Cpu className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <span
                className="badge"
                style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
              >
                {getBrandName(gpu.brand)}
              </span>
            </div>
          </div>
        </div>

        <h3 className="font-display font-bold text-lg text-white mb-1 group-hover:text-neon-cyan transition-colors">
          {gpu.name}
        </h3>
        <p className="text-sm text-slate-400 mb-4">{gpu.series}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>{gpu.memory ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Usb className="w-3.5 h-3.5 text-slate-500" />
            <span>{gpu.interface ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDate(gpu.releaseDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDownloadCount(gpu.driverCount)} 个驱动</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-3.5 h-3.5',
                i < Math.floor(gpu.driverCount / 10) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Heart,
  Download,
  Calendar,
  HardDrive,
  Star,
  Monitor,
  ShieldCheck,
  GitCompareArrows,
  Users,
} from 'lucide-react';
import type { Driver } from '@/types';
import { cn, formatDate, formatDownloadCount } from '@/utils/format';

interface DriverCardProps {
  driver: Driver;
  onDownload?: (driver: Driver) => void;
  onCompare?: (driver: Driver) => void;
}

export default function DriverCard({ driver, onDownload, onCompare }: DriverCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(driver);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare?.(driver);
  };

  return (
    <div className="card card-hover relative overflow-hidden group">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg text-white group-hover:text-neon-cyan transition-colors">
              v{driver.version}
            </h3>
            {driver.isWHQL && (
              <span className="badge bg-whql/20 text-whql border border-whql/30">
                <ShieldCheck className="w-3 h-3" />
                WHQL
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCompare}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-bg-700/80 text-slate-400 hover:text-neon-cyan hover:bg-bg-600 transition-all duration-200"
              title="对比"
            >
              <GitCompareArrows className="w-4 h-4" />
            </button>
            <button
              onClick={handleFavorite}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md bg-bg-700/80 transition-all duration-200',
                isFavorite ? 'text-red-400 hover:bg-red-500/20' : 'text-slate-400 hover:text-red-400 hover:bg-bg-600'
              )}
              title="收藏"
            >
              <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <span>{driver.fileSize}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{formatDate(driver.releaseDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Users className="w-4 h-4 text-slate-500" />
            <span>{formatDownloadCount(driver.downloadCount)} 下载</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Monitor className="w-4 h-4 text-slate-500" />
            <span>{driver.gpuIds.length} 款显卡</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < Math.floor(driver.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-slate-400">
            {driver.rating.toFixed(1)} ({driver.ratingCount})
          </span>
        </div>

        {driver.osSupport.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {driver.osSupport.slice(0, 3).map((os) => (
              <span key={os} className="badge bg-bg-700 text-slate-300 border border-white/10">
                {os.replace(' 64-bit', '')}
              </span>
            ))}
            {driver.osSupport.length > 3 && (
              <span className="badge bg-bg-700 text-slate-400 border border-white/10">
                +{driver.osSupport.length - 3}
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleDownload}
          className="btn-primary w-full"
        >
          <Download className="w-4 h-4" />
          下载驱动
        </button>
      </div>
    </div>
  );
}

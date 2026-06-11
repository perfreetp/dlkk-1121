import { Server, Zap, CheckCircle2 } from 'lucide-react';
import type { MirrorSource } from '@/types';
import { cn } from '@/utils/format';

interface MirrorSelectorProps {
  mirrors: MirrorSource[];
  value: string;
  onChange: (id: string) => void;
}

export default function MirrorSelector({ mirrors, value, onChange }: MirrorSelectorProps) {
  const formatSpeed = (speed?: number): string => {
    if (!speed) return '—';
    if (speed >= 1024) return `${(speed / 1024).toFixed(1)} MB/s`;
    return `${speed.toFixed(0)} KB/s`;
  };

  const getSpeedColor = (speed?: number): string => {
    if (!speed) return 'text-slate-500';
    if (speed >= 512) return 'text-whql';
    if (speed >= 128) return 'text-neon-cyan';
    if (speed >= 32) return 'text-warn';
    return 'text-danger';
  };

  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-neon-cyan" />
        <span className="text-sm font-medium text-white">选择镜像源</span>
      </div>
      <div className="space-y-2">
        {mirrors.map((mirror) => {
          const isSelected = value === mirror.id;
          return (
            <button
              key={mirror.id}
              onClick={() => mirror.enabled && onChange(mirror.id)}
              disabled={!mirror.enabled}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left',
                mirror.enabled
                  ? isSelected
                    ? 'bg-neon-cyan/10 border-neon-cyan/50 shadow-glow-cyan'
                    : 'bg-bg-700/50 border-white/10 hover:border-neon-cyan/30 hover:bg-bg-700'
                  : 'bg-bg-800/30 border-white/5 opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    isSelected
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'bg-bg-600/50 text-slate-400'
                  )}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Server className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-white' : 'text-slate-200'
                  )}>
                    {mirror.name}
                  </div>
                  <div className={cn(
                    'text-xs mt-0.5',
                    mirror.enabled ? 'text-slate-500' : 'text-slate-600'
                  )}>
                    {mirror.enabled ? mirror.url.replace(/^https?:\/\//, '').split('/')[0] : '暂不可用'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className={cn('w-3.5 h-3.5', getSpeedColor(mirror.speed))} />
                <span className={cn('text-xs font-mono', getSpeedColor(mirror.speed))}>
                  {formatSpeed(mirror.speed)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

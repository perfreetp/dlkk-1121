import { Server, Zap, CheckCircle2, Star, Shield, ExternalLink } from 'lucide-react';
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
            <div key={mirror.id}>
              <button
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
              {isSelected && mirror.backupUrls && mirror.backupUrls.length > 0 && (
                <div className="ml-4 mt-1.5 space-y-1">
                  {mirror.backupUrls.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-bg-800/40 border border-white/5">
                      <span className={cn(
                        'flex-shrink-0 text-[10px] px-1.5 py-0 rounded font-medium',
                        b.label === 'primary' ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-slate-700/50 text-slate-500'
                      )}>
                        {b.label === 'primary' ? (
                          <span className="inline-flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />主用</span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />备用</span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">{b.url}</span>
                      <a href={b.url} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 text-slate-500 hover:text-neon-cyan transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

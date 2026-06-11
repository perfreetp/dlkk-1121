import { Server, Zap, CheckCircle2, Star, Shield, Globe, ExternalLink } from 'lucide-react';
import type { MirrorSource, BackupUrl } from '@/types';
import { cn } from '@/utils/format';

interface MirrorOption {
  id: string;
  mirrorId: string;
  name: string;
  url: string;
  enabled: boolean;
  speed?: number;
  type: 'official' | 'mirror' | 'backup';
  backupIndex?: number;
}

interface MirrorSelectorProps {
  mirrors: MirrorSource[];
  value: string;
  onChange: (optionId: string) => void;
}

function getMirrorType(name: string): 'official' | 'mirror' {
  const lower = name.toLowerCase();
  if (lower.includes('官网') || lower.includes('官方') || lower.includes('nvidia') || lower.includes('amd') || lower.includes('intel') || lower.includes('official')) {
    return 'official';
  }
  return 'mirror';
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

  const options: MirrorOption[] = [];
  mirrors.forEach((mirror) => {
    const type = getMirrorType(mirror.name);
    options.push({
      id: mirror.id,
      mirrorId: mirror.id,
      name: mirror.name,
      url: mirror.url,
      enabled: mirror.enabled,
      speed: mirror.speed,
      type,
    });
    if (mirror.backupUrls && mirror.backupUrls.length > 0) {
      mirror.backupUrls.forEach((b, i) => {
        options.push({
          id: `${mirror.id}-bk-${i}`,
          mirrorId: mirror.id,
          name: `${mirror.name} · ${b.label === 'primary' ? '主用备用' : '备用线路'}`,
          url: b.url,
          enabled: mirror.enabled,
          speed: mirror.speed ? Math.max(1, Math.round(mirror.speed * 0.7 - i * 100)) : undefined,
          type: 'backup',
          backupIndex: i,
        });
      });
    }
  });

  const getTypeLabel = (type: string): { text: string; className: string; icon: any } => {
    switch (type) {
      case 'official':
        return { text: '官网', className: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30', icon: Globe };
      case 'mirror':
        return { text: '镜像', className: 'bg-whql/15 text-whql border-whql/30', icon: Server };
      case 'backup':
        return { text: '备用', className: 'bg-warn/15 text-warn border-warn/30', icon: Shield };
      default:
        return { text: '线路', className: 'bg-slate-600/30 text-slate-400 border-white/10', icon: Server };
    }
  };

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-medium text-white">选择下载线路</span>
        </div>
        {selectedOption && (
          <a href={selectedOption.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-neon-cyan inline-flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />访问
          </a>
        )}
      </div>
      <div className="space-y-1.5">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          const typeInfo = getTypeLabel(opt.type);
          const TypeIcon = typeInfo.icon;
          return (
            <button
              key={opt.id}
              onClick={() => opt.enabled && onChange(opt.id)}
              disabled={!opt.enabled}
              className={cn(
                'w-full flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 text-left',
                opt.enabled
                  ? isSelected
                    ? 'bg-neon-cyan/10 border-neon-cyan/50 shadow-glow-cyan'
                    : 'bg-bg-700/50 border-white/10 hover:border-neon-cyan/30 hover:bg-bg-700'
                  : 'bg-bg-800/30 border-white/5 opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    isSelected
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'bg-bg-600/50 text-slate-400'
                  )}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <TypeIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-white' : 'text-slate-200'
                    )}>
                      {opt.name}
                    </span>
                    <span className={cn(
                      'flex-shrink-0 text-[9px] px-1 py-0.5 rounded border font-medium',
                      typeInfo.className
                    )}>
                      {typeInfo.text}
                    </span>
                  </div>
                  <div className={cn(
                    'text-[11px] truncate',
                    opt.enabled ? 'text-slate-500' : 'text-slate-600'
                  )}>
                    {opt.enabled ? opt.url.replace(/^https?:\/\//, '').split('/')[0] : '暂不可用'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Zap className={cn('w-3 h-3', getSpeedColor(opt.speed))} />
                <span className={cn('text-[11px] font-mono', getSpeedColor(opt.speed))}>
                  {formatSpeed(opt.speed)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
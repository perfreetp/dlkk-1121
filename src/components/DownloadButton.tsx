import { Download, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/format';

type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'failed';

interface DownloadButtonProps {
  progress: number;
  status: DownloadStatus;
  onClick: () => void;
  disabled?: boolean;
}

const statusConfig: Record<DownloadStatus, { label: string; color: string; iconBg: string }> = {
  idle: {
    label: '立即下载',
    color: 'from-neon-cyan to-neon-cyan-dim',
    iconBg: 'bg-neon-cyan/20',
  },
  downloading: {
    label: '下载中',
    color: 'from-neon-cyan to-neon-cyan-dim',
    iconBg: 'bg-neon-cyan/20',
  },
  completed: {
    label: '下载完成',
    color: 'from-whql to-emerald-400',
    iconBg: 'bg-whql/20',
  },
  failed: {
    label: '下载失败',
    color: 'from-danger to-red-400',
    iconBg: 'bg-danger/20',
  },
};

export default function DownloadButton({ progress, status, onClick, disabled }: DownloadButtonProps) {
  const config = statusConfig[status];

  const getIcon = () => {
    switch (status) {
      case 'idle':
        return <Download className="w-4 h-4" />;
      case 'downloading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    if (status === 'downloading') {
      return `${config.label} ${progress.toFixed(0)}%`;
    }
    return config.label;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || status === 'downloading'}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold',
        'bg-gradient-to-r text-bg-900 transition-all duration-200',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        'overflow-hidden',
        config.color,
        (status === 'downloading' || status === 'completed') && 'shadow-glow-cyan',
        status === 'failed' && 'shadow-glow-red'
      )}
    >
      {status === 'downloading' && (
        <div
          className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {getIcon()}
        <span className="font-mono text-sm">{getStatusText()}</span>
      </span>
      {status === 'failed' && (
        <XCircle className="relative z-10 w-4 h-4 text-white/80 ml-1" />
      )}
    </button>
  );
}

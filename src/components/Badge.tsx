import { cn } from '@/lib/utils';

type BadgeVariant = 'whql' | 'warn' | 'danger' | 'info' | 'cyan';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  whql: 'bg-whql/15 text-whql border border-whql/30 shadow-glow-green',
  warn: 'bg-warn/15 text-warn border border-warn/30',
  danger: 'bg-danger/15 text-danger border border-danger/30 shadow-glow-red',
  info: 'bg-info/15 text-info border border-info/30',
  cyan: 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 shadow-glow-cyan',
};

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn('badge', variantStyles[variant], className)}>
      {children}
    </span>
  );
}

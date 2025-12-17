import { cn } from '@/lib/utils';
import { QualityLevel } from '@/types/data';

interface QualityBadgeProps {
  level: QualityLevel;
  score?: number;
  className?: string;
}

const levelConfig = {
  good: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    label: 'Good',
  },
  review: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    label: 'Needs Review',
  },
  poor: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20',
    label: 'Poor',
  },
};

export const QualityBadge = ({ level, score, className }: QualityBadgeProps) => {
  const config = levelConfig[level];
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bg,
      config.text,
      config.border,
      className
    )}>
      <span className={cn('w-2 h-2 rounded-full', {
        'bg-success': level === 'good',
        'bg-warning': level === 'review',
        'bg-destructive': level === 'poor',
      })} />
      {config.label}
      {score !== undefined && <span className="opacity-75">({score}%)</span>}
    </span>
  );
};

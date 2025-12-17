import { cn } from '@/lib/utils';
import { CorrectionType } from '@/types/data';
import { Check, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfidenceBadgeProps {
  confidence: number;
  label: string;
  type: CorrectionType;
  className?: string;
}

export const ConfidenceBadge = ({ confidence, label, type, className }: ConfidenceBadgeProps) => {
  const bgColor = type === 'corrected' ? 'bg-success/10' : type === 'standardized' ? 'bg-warning/10' : 'bg-muted';
  const textColor = type === 'corrected' ? 'text-success' : type === 'standardized' ? 'text-warning' : 'text-muted-foreground';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('inline-flex items-center gap-1 text-xs', className)}>
          <span className={cn('px-1.5 py-0.5 rounded-md font-medium', bgColor, textColor)}>
            {confidence}%
          </span>
          {type === 'corrected' && <Check className="w-3 h-3 text-success" />}
          {type === 'standardized' && <ArrowRight className="w-3 h-3 text-warning" />}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'accent' | 'warning';
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  className 
}: StatsCardProps) {
  const iconStyles = {
    default: 'bg-muted text-foreground',
    primary: 'gradient-primary text-primary-foreground',
    accent: 'gradient-accent text-accent-foreground',
    warning: 'gradient-warm text-warning-foreground',
  };

  return (
    <Card className={cn(
      "p-5 shadow-card hover:shadow-elevated transition-shadow duration-300 animate-slide-up",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          iconStyles[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

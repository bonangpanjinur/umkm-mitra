import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdated?: Date;
  className?: string;
}

export function RealtimeIndicator({ isConnected, lastUpdated, className }: RealtimeIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <Wifi className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">Live</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-muted-foreground" />
            </span>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Disconnected</span>
          </>
        )}
      </div>
      {lastUpdated && (
        <span className="text-muted-foreground text-xs">
          Update: {lastUpdated.toLocaleTimeString('id-ID')}
        </span>
      )}
    </div>
  );
}

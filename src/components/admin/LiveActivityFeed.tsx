import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { ShoppingBag, Store, Bike, MapPin, Package, ArrowUp, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RealtimeEvent {
  type: 'order' | 'merchant' | 'courier' | 'village' | 'product';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: Date;
}

interface LiveActivityFeedProps {
  events: RealtimeEvent[];
  className?: string;
}

const eventConfig = {
  order: {
    icon: ShoppingBag,
    color: 'text-info',
    bgColor: 'bg-info/10',
    label: 'Pesanan',
  },
  merchant: {
    icon: Store,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Merchant',
  },
  courier: {
    icon: Bike,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Kurir',
  },
  village: {
    icon: MapPin,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Desa',
  },
  product: {
    icon: Package,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Produk',
  },
};

const actionConfig = {
  INSERT: {
    icon: ArrowUp,
    label: 'Baru',
    color: 'text-primary',
  },
  UPDATE: {
    icon: RefreshCw,
    label: 'Diperbarui',
    color: 'text-warning',
  },
  DELETE: {
    icon: Trash2,
    label: 'Dihapus',
    color: 'text-destructive',
  },
};

function getEventDescription(event: RealtimeEvent): string {
  const { type, action, data } = event;
  const name = (data.name as string) || (data.id as string)?.slice(0, 8) || 'Unknown';
  
  switch (type) {
    case 'order':
      if (action === 'INSERT') return `Pesanan baru #${(data.id as string)?.slice(0, 8)}`;
      if (action === 'UPDATE') return `Pesanan #${(data.id as string)?.slice(0, 8)} → ${data.status}`;
      return `Pesanan #${(data.id as string)?.slice(0, 8)} dihapus`;
    case 'merchant':
      if (action === 'INSERT') return `Merchant baru: ${name}`;
      if (action === 'UPDATE') return `${name} → ${data.registration_status || data.status}`;
      return `${name} dihapus`;
    case 'courier':
      if (action === 'INSERT') return `Kurir baru: ${name}`;
      if (action === 'UPDATE') return `${name} → ${data.is_available ? 'Online' : 'Offline'}`;
      return `${name} dihapus`;
    case 'village':
      if (action === 'INSERT') return `Desa baru: ${name}`;
      if (action === 'UPDATE') return `${name} → ${data.is_active ? 'Aktif' : 'Nonaktif'}`;
      return `${name} dihapus`;
    case 'product':
      if (action === 'INSERT') return `Produk baru: ${name}`;
      if (action === 'UPDATE') return `${name} diperbarui`;
      return `${name} dihapus`;
    default:
      return 'Event tidak dikenal';
  }
}

export function LiveActivityFeed({ events, className }: LiveActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Aktivitas Real-time
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Menunggu aktivitas baru...
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        Aktivitas Real-time
      </h3>
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {events.map((event, index) => {
            const config = eventConfig[event.type];
            const actionCfg = actionConfig[event.action];
            const Icon = config.icon;
            const ActionIcon = actionCfg.icon;
            
            return (
              <div
                key={`${event.timestamp.getTime()}-${index}`}
                className="flex items-start gap-3 animate-in slide-in-from-left-5 duration-300"
              >
                <div className={cn('p-2 rounded-lg', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <ActionIcon className={cn('h-3 w-3', actionCfg.color)} />
                    <span className={cn('text-xs font-medium', actionCfg.color)}>
                      {actionCfg.label}
                    </span>
                  </div>
                  <p className="text-sm truncate">{getEventDescription(event)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(event.timestamp, { addSuffix: true, locale: id })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

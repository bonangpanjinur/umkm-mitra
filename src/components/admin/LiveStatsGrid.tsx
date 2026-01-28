import { 
  ShoppingBag, 
  Store, 
  Bike, 
  MapPin, 
  Package, 
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import type { RealtimeStats } from '@/hooks/useRealtimeStats';

interface LiveStatsGridProps {
  stats: RealtimeStats;
  loading?: boolean;
  className?: string;
}

interface StatItemProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down';
}

function StatItem({ label, value, subValue, icon, iconBg }: StatItemProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function LiveStatsGrid({ stats, loading, className }: LiveStatsGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded mb-2" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Today's Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem
          label="Pesanan Hari Ini"
          value={stats.todayOrders}
          icon={<ShoppingBag className="h-5 w-5 text-info" />}
          iconBg="bg-info/10"
        />
        <StatItem
          label="Pendapatan Hari Ini"
          value={formatPrice(stats.todayRevenue)}
          icon={<DollarSign className="h-5 w-5 text-success" />}
          iconBg="bg-success/10"
        />
        <StatItem
          label="Menunggu Diproses"
          value={stats.newOrders}
          subValue="pesanan baru"
          icon={<Clock className="h-5 w-5 text-warning" />}
          iconBg="bg-warning/10"
        />
        <StatItem
          label="Selesai Hari Ini"
          value={stats.completedOrders}
          icon={<CheckCircle className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
        />
      </div>

      {/* Entity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatItem
          label="Merchant"
          value={stats.totalMerchants}
          subValue={`${stats.activeMerchants} aktif • ${stats.pendingMerchants} pending`}
          icon={<Store className="h-5 w-5 text-warning" />}
          iconBg="bg-warning/10"
        />
        <StatItem
          label="Kurir"
          value={stats.totalCouriers}
          subValue={`${stats.availableCouriers} online • ${stats.pendingCouriers} pending`}
          icon={<Bike className="h-5 w-5 text-success" />}
          iconBg="bg-success/10"
        />
        <StatItem
          label="Desa Wisata"
          value={stats.totalVillages}
          subValue={`${stats.activeVillages} aktif • ${stats.pendingVillages} pending`}
          icon={<MapPin className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatItem
          label="Produk"
          value={stats.totalProducts}
          subValue={`${stats.activeProducts} aktif`}
          icon={<Package className="h-5 w-5 text-destructive" />}
          iconBg="bg-destructive/10"
        />
        <StatItem
          label="Total Pesanan"
          value={stats.totalOrders}
          subValue={`${stats.processingOrders} dalam proses`}
          icon={<ShoppingBag className="h-5 w-5 text-info" />}
          iconBg="bg-info/10"
        />
      </div>
    </div>
  );
}

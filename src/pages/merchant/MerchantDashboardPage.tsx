import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Receipt, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MerchantData {
  id: string;
  name: string;
  is_open: boolean;
  status: string;
  registration_status: string;
}

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

export default function MerchantDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get merchant
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('id, name, is_open, status, registration_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!merchantData) {
          setLoading(false);
          return;
        }

        setMerchant(merchantData);

        // Get stats
        const [productsRes, ordersRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, is_active')
            .eq('merchant_id', merchantData.id),
          supabase
            .from('orders')
            .select('id, status, total, created_at')
            .eq('merchant_id', merchantData.id),
        ]);

        const products = productsRes.data || [];
        const orders = ordersRes.data || [];
        const today = new Date().toDateString();

        setStats({
          totalProducts: products.length,
          activeProducts: products.filter(p => p.is_active).length,
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'NEW').length,
          totalRevenue: orders
            .filter(o => o.status === 'DONE')
            .reduce((sum, o) => sum + o.total, 0),
          todayOrders: orders.filter(o => 
            new Date(o.created_at).toDateString() === today
          ).length,
        });
      } catch (error) {
        console.error('Error fetching merchant data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleStoreStatus = async (isOpen: boolean) => {
    if (!merchant) return;
    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('merchants')
        .update({ is_open: isOpen })
        .eq('id', merchant.id);

      if (error) throw error;

      setMerchant({ ...merchant, is_open: isOpen });
      toast.success(isOpen ? 'Toko sekarang buka' : 'Toko sekarang tutup');
    } catch (error) {
      toast.error('Gagal mengubah status toko');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Dashboard" subtitle="Ringkasan toko Anda">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </MerchantLayout>
    );
  }

  if (!merchant) {
    return (
      <MerchantLayout title="Dashboard" subtitle="Ringkasan toko Anda">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-bold text-lg mb-2">Toko Belum Terdaftar</h2>
          <p className="text-muted-foreground mb-4">
            Anda belum memiliki toko. Daftar sekarang untuk mulai berjualan.
          </p>
          <Button onClick={() => navigate('/register/merchant')}>
            Daftar Sebagai Merchant
          </Button>
        </div>
      </MerchantLayout>
    );
  }

  if (merchant.registration_status === 'PENDING') {
    return (
      <MerchantLayout title="Dashboard" subtitle="Ringkasan toko Anda">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="font-bold text-lg mb-2">Menunggu Persetujuan</h2>
          <p className="text-muted-foreground max-w-md">
            Pendaftaran toko Anda sedang dalam proses review. 
            Kami akan memberitahu Anda setelah disetujui.
          </p>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Dashboard" subtitle="Ringkasan toko Anda">
      {/* Store Status Card */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{merchant.name}</h3>
            <p className="text-sm text-muted-foreground">
              {merchant.is_open ? 'Toko sedang buka' : 'Toko sedang tutup'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${merchant.is_open ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
            <Label className="font-medium">
              {merchant.is_open ? 'Buka' : 'Tutup'}
            </Label>
            <Switch
              checked={merchant.is_open}
              onCheckedChange={toggleStoreStatus}
              disabled={updatingStatus}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Produk"
          value={stats.totalProducts}
          icon={<Package className="h-5 w-5" />}
          description={`${stats.activeProducts} aktif`}
        />
        <StatsCard
          title="Total Pesanan"
          value={stats.totalOrders}
          icon={<Receipt className="h-5 w-5" />}
          description={`${stats.pendingOrders} baru`}
        />
        <StatsCard
          title="Pesanan Hari Ini"
          value={stats.todayOrders}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Pendapatan"
          value={`Rp ${(stats.totalRevenue / 1000).toFixed(0)}K`}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate('/merchant/products')}
        >
          <Package className="h-6 w-6" />
          <span>Kelola Produk</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => navigate('/merchant/orders')}
        >
          <Receipt className="h-6 w-6" />
          <span>Lihat Pesanan</span>
        </Button>
      </div>
    </MerchantLayout>
  );
}

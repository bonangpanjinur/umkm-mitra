import { useState, useEffect } from 'react';
import { TicketCheck, Store, Users, TrendingUp } from 'lucide-react';
import { VerifikatorLayout } from '@/components/verifikator/VerifikatorLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  totalCodes: number;
  activeCodes: number;
  totalMerchants: number;
  pendingMerchants: number;
  totalUsage: number;
}

export default function VerifikatorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalCodes: 0,
    activeCodes: 0,
    totalMerchants: 0,
    pendingMerchants: 0,
    totalUsage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Get codes created by this verifikator
        const { data: codes } = await supabase
          .from('verifikator_codes')
          .select('code, is_active, usage_count')
          .eq('verifikator_id', user.id);

        if (!codes) {
          setLoading(false);
          return;
        }

        const codeValues = codes.map(c => c.code);
        const totalUsage = codes.reduce((sum, c) => sum + c.usage_count, 0);
        const activeCodes = codes.filter(c => c.is_active).length;

        // Get merchants using these codes
        let totalMerchants = 0;
        let pendingMerchants = 0;

        if (codeValues.length > 0) {
          const { data: merchants } = await supabase
            .from('merchants')
            .select('registration_status')
            .in('verifikator_code', codeValues);

          if (merchants) {
            totalMerchants = merchants.length;
            pendingMerchants = merchants.filter(m => m.registration_status === 'PENDING').length;
          }
        }

        setStats({
          totalCodes: codes.length,
          activeCodes,
          totalMerchants,
          pendingMerchants,
          totalUsage,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <VerifikatorLayout title="Dashboard" subtitle="Ringkasan aktivitas verifikator">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </VerifikatorLayout>
    );
  }

  return (
    <VerifikatorLayout title="Dashboard" subtitle="Ringkasan aktivitas verifikator">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Kode"
          value={stats.totalCodes}
          icon={<TicketCheck className="h-5 w-5" />}
          description={`${stats.activeCodes} aktif`}
        />
        <StatsCard
          title="Total Merchant"
          value={stats.totalMerchants}
          icon={<Store className="h-5 w-5" />}
          description={`${stats.pendingMerchants} menunggu`}
        />
        <StatsCard
          title="Total Penggunaan"
          value={stats.totalUsage}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Rasio Konversi"
          value={stats.totalUsage > 0 ? `${Math.round((stats.totalMerchants / stats.totalUsage) * 100)}%` : '0%'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Panduan Verifikator</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>1. Buat kode referral untuk kelompok dagang yang Anda kelola</p>
          <p>2. Bagikan kode kepada calon merchant UMKM</p>
          <p>3. Pantau pendaftaran merchant yang menggunakan kode Anda</p>
          <p>4. Setujui atau tolak pendaftaran merchant sesuai kriteria</p>
        </div>
      </div>
    </VerifikatorLayout>
  );
}

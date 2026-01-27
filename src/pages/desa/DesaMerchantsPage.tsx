import { useState, useEffect } from 'react';
import { Store, Eye } from 'lucide-react';
import { DesaLayout } from '@/components/desa/DesaLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MerchantRow {
  id: string;
  name: string;
  phone: string | null;
  business_category: string | null;
  status: string;
  is_open: boolean;
}

export default function DesaMerchantsPage() {
  const { user } = useAuth();
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchants = async () => {
      if (!user) return;

      try {
        // Get village
        const { data: villages } = await supabase
          .from('villages')
          .select('id')
          .eq('registration_status', 'APPROVED')
          .limit(1);

        if (!villages || villages.length === 0) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('merchants')
          .select('id, name, phone, business_category, status, is_open')
          .eq('village_id', villages[0].id)
          .eq('status', 'ACTIVE')
          .order('name', { ascending: true });

        if (error) throw error;
        setMerchants(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Gagal memuat data merchant');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, [user]);

  const columns = [
    {
      key: 'name',
      header: 'Nama Merchant',
      render: (item: MerchantRow) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{item.business_category || '-'}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telepon',
      render: (item: MerchantRow) => item.phone || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: MerchantRow) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${item.is_open ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          <span className="text-sm">{item.is_open ? 'Buka' : 'Tutup'}</span>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: 'business_category',
      label: 'Kategori',
      options: [
        { value: 'kuliner', label: 'Kuliner' },
        { value: 'fashion', label: 'Fashion' },
        { value: 'kriya', label: 'Kriya' },
        { value: 'jasa', label: 'Jasa' },
      ],
    },
  ];

  return (
    <DesaLayout title="Merchant" subtitle="Merchant di desa wisata">
      <div className="flex items-center gap-2 mb-4">
        <Store className="h-5 w-5 text-primary" />
        <span className="text-muted-foreground text-sm">
          {merchants.length} merchant • {merchants.filter(m => m.is_open).length} buka
        </span>
      </div>

      <DataTable
        data={merchants}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Cari nama merchant..."
        filters={filters}
        loading={loading}
        emptyMessage="Belum ada merchant di desa ini"
      />
    </DesaLayout>
  );
}

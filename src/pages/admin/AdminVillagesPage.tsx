import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, Check, X, MoreHorizontal } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { approveVillage, rejectVillage } from '@/lib/adminApi';

interface VillageRow {
  id: string;
  name: string;
  district: string;
  regency: string;
  subdistrict: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  registration_status: string;
  is_active: boolean;
  registered_at: string | null;
}

export default function AdminVillagesPage() {
  const navigate = useNavigate();
  const [villages, setVillages] = useState<VillageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVillages = async () => {
    try {
      const { data, error } = await supabase
        .from('villages')
        .select('id, name, district, regency, subdistrict, contact_name, contact_phone, registration_status, is_active, registered_at')
        .order('registered_at', { ascending: false });

      if (error) throw error;
      setVillages(data || []);
    } catch (error) {
      console.error('Error fetching villages:', error);
      toast.error('Gagal memuat data desa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  const handleApprove = async (id: string) => {
    const success = await approveVillage(id);
    if (success) {
      toast.success('Desa wisata berhasil disetujui');
      fetchVillages();
    } else {
      toast.error('Gagal menyetujui desa wisata');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;
    
    const success = await rejectVillage(id, reason);
    if (success) {
      toast.success('Desa wisata ditolak');
      fetchVillages();
    } else {
      toast.error('Gagal menolak desa wisata');
    }
  };

  const getStatusBadge = (regStatus: string, isActive: boolean) => {
    if (regStatus === 'PENDING') {
      return <Badge variant="secondary" className="bg-warning/10 text-warning">Menunggu</Badge>;
    }
    if (regStatus === 'REJECTED') {
      return <Badge variant="destructive">Ditolak</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-success/10 text-success">Aktif</Badge>;
    }
    return <Badge variant="outline">Nonaktif</Badge>;
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama Desa',
      render: (item: VillageRow) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.subdistrict || '-'}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Lokasi',
      render: (item: VillageRow) => (
        <div className="text-sm">
          <p>{item.district}</p>
          <p className="text-xs text-muted-foreground">{item.regency}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Kontak',
      render: (item: VillageRow) => (
        <div className="text-sm">
          <p>{item.contact_name || '-'}</p>
          <p className="text-xs text-muted-foreground">{item.contact_phone || '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: VillageRow) => getStatusBadge(item.registration_status, item.is_active),
    },
    {
      key: 'registered_at',
      header: 'Terdaftar',
      render: (item: VillageRow) => 
        item.registered_at 
          ? new Date(item.registered_at).toLocaleDateString('id-ID') 
          : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (item: VillageRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/villages/${item.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Lihat Detail
            </DropdownMenuItem>
            {item.registration_status === 'PENDING' && (
              <>
                <DropdownMenuItem onClick={() => handleApprove(item.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Setujui
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReject(item.id)} className="text-destructive">
                  <X className="h-4 w-4 mr-2" />
                  Tolak
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: 'registration_status',
      label: 'Status',
      options: [
        { value: 'PENDING', label: 'Menunggu' },
        { value: 'APPROVED', label: 'Disetujui' },
        { value: 'REJECTED', label: 'Ditolak' },
      ],
    },
  ];

  return (
    <AdminLayout title="Manajemen Desa Wisata" subtitle="Kelola semua desa wisata yang terdaftar">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <span className="text-muted-foreground text-sm">{villages.length} desa terdaftar</span>
      </div>

      <DataTable
        data={villages}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Cari nama desa..."
        filters={filters}
        loading={loading}
        emptyMessage="Belum ada desa wisata terdaftar"
      />
    </AdminLayout>
  );
}

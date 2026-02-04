import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Settings, Info } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

interface TransactionPackage {
  id: string;
  name: string;
  classification_price: string;
  price_per_transaction: number;
  group_commission_percent: number;
  transaction_quota: number;
  validity_days: number;
  description: string | null;
  is_active: boolean;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<TransactionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TransactionPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    classification_price: 'UNDER_5K',
    price_per_transaction: 500,
    group_commission_percent: 10,
    transaction_quota: 50,
    validity_days: 30,
    description: '',
    is_active: true,
  });

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_packages')
        .select('*')
        .order('price_per_transaction', { ascending: true });

      if (error) throw error;
      setPackages((data || []) as TransactionPackage[]);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Gagal memuat data paket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('transaction_packages')
          .update(formData)
          .eq('id', editingPackage.id);

        if (error) throw error;
        toast.success('Paket berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('transaction_packages')
          .insert(formData);

        if (error) throw error;
        toast.success('Paket berhasil ditambahkan');
      }

      setDialogOpen(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Gagal menyimpan paket. Periksa kembali input Anda.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus paket ini?')) return;

    try {
      const { error } = await supabase
        .from('transaction_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Paket berhasil dihapus');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Gagal menghapus paket. Mungkin masih digunakan oleh merchant.');
    }
  };

  const handleEdit = (pkg: TransactionPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      classification_price: pkg.classification_price,
      price_per_transaction: pkg.price_per_transaction,
      group_commission_percent: pkg.group_commission_percent,
      transaction_quota: pkg.transaction_quota,
      validity_days: pkg.validity_days,
      description: pkg.description || '',
      is_active: pkg.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      classification_price: 'UNDER_5K',
      price_per_transaction: 500,
      group_commission_percent: 10,
      transaction_quota: 50,
      validity_days: 30,
      description: '',
      is_active: true,
    });
  };

  // Calculate total price based on transaction quota and price per transaction
  const calculateTotalPrice = (pkg: TransactionPackage) => {
    return pkg.transaction_quota * pkg.price_per_transaction;
  };

  return (
    <AdminLayout title="Paket Transaksi" subtitle="Kelola paket kuota transaksi untuk pedagang">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="text-muted-foreground text-sm">
            {packages.length} paket tersedia
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Paket
          </Button>
        </div>
      </div>

      <Alert className="mb-6 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground">Informasi Paket</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Paket ini menentukan berapa banyak <strong>total kuota (kredit)</strong> yang didapat merchant. 
          Harga paket dihitung dari kuota × harga per transaksi.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={!pkg.is_active ? 'opacity-60' : 'border-primary/10'}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>Paket Kuota Transaksi</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {pkg.is_active ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Harga Paket</p>
                    <p className="font-bold text-primary">{formatPrice(calculateTotalPrice(pkg))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Komisi Kelompok</p>
                    <p className="font-bold">{pkg.group_commission_percent}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Kuota</p>
                    <p className="font-bold">{pkg.transaction_quota} Kredit</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Masa Aktif</p>
                    <p className="font-medium">{pkg.validity_days === 0 ? 'Selamanya' : `${pkg.validity_days} hari`}</p>
                  </div>
                </div>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">{pkg.description}</p>
                )}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(pkg)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5" onClick={() => handleDelete(pkg.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Paket' : 'Tambah Paket Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Nama Paket</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Paket Hemat"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_per_transaction">Harga per Transaksi (Rp)</Label>
                <Input
                  id="price_per_transaction"
                  type="number"
                  value={formData.price_per_transaction}
                  onChange={(e) => setFormData({ ...formData, price_per_transaction: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="group_commission_percent">Komisi Kelompok (%)</Label>
                <Input
                  id="group_commission_percent"
                  type="number"
                  step="0.01"
                  value={formData.group_commission_percent}
                  onChange={(e) => setFormData({ ...formData, group_commission_percent: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction_quota">Total Kuota (Kredit)</Label>
                <Input
                  id="transaction_quota"
                  type="number"
                  value={formData.transaction_quota}
                  onChange={(e) => setFormData({ ...formData, transaction_quota: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="validity_days">Masa Aktif (hari)</Label>
                <Input
                  id="validity_days"
                  type="number"
                  value={formData.validity_days}
                  onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Isi 0 untuk tanpa masa aktif</p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi paket..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label htmlFor="is_active">Paket Aktif (Dapat dibeli merchant)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingPackage ? 'Simpan Perubahan' : 'Tambah Paket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

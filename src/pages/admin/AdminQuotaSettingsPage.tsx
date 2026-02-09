import { useState, useEffect } from 'react';
import { Settings, Info, Gift, Save } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { QuotaTier } from '@/lib/quotaApi';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FreeQuotaSettings {
  enabled: boolean;
  free_credits: number;
  validity_days: number;
}

export default function AdminQuotaSettingsPage() {
  const [tiers] = useState<QuotaTier[]>([
    { id: '1', min_price: 0, max_price: 10000, credit_cost: 1 },
    { id: '2', min_price: 10001, max_price: 50000, credit_cost: 2 },
    { id: '3', min_price: 50001, max_price: 100000, credit_cost: 3 },
    { id: '4', min_price: 100001, max_price: null, credit_cost: 5 },
  ]);

  const [freeQuota, setFreeQuota] = useState<FreeQuotaSettings>({
    enabled: true,
    free_credits: 10,
    validity_days: 30,
  });
  const [loadingFreeQuota, setLoadingFreeQuota] = useState(true);
  const [savingFreeQuota, setSavingFreeQuota] = useState(false);

  useEffect(() => {
    const fetchFreeQuotaSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'free_quota_new_merchant')
        .maybeSingle();

      if (data?.value) {
        const val = data.value as unknown as FreeQuotaSettings;
        setFreeQuota({
          enabled: val.enabled ?? true,
          free_credits: val.free_credits ?? 10,
          validity_days: val.validity_days ?? 30,
        });
      }
      setLoadingFreeQuota(false);
    };
    fetchFreeQuotaSettings();
  }, []);

  const handleSaveFreeQuota = async () => {
    setSavingFreeQuota(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          value: JSON.parse(JSON.stringify(freeQuota)),
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'free_quota_new_merchant');

      if (error) throw error;
      toast.success('Pengaturan kuota gratis berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSavingFreeQuota(false);
    }
  };

  return (
    <AdminLayout title="Pengaturan Kuota" subtitle="Biaya kuota transaksi dan kuota gratis pendaftar baru">
      <div className="space-y-6">
        {/* Free Quota for New Merchants */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Kuota Gratis Pendaftar Baru</CardTitle>
                <CardDescription>
                  Atur jumlah kuota transaksi gratis yang diberikan kepada merchant baru saat disetujui
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFreeQuota ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Aktifkan Kuota Gratis</p>
                    <p className="text-xs text-muted-foreground">
                      Merchant baru akan otomatis mendapatkan kuota gratis saat disetujui
                    </p>
                  </div>
                  <Switch
                    checked={freeQuota.enabled}
                    onCheckedChange={(checked) => setFreeQuota(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                {freeQuota.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="free_credits">Jumlah Kuota Gratis (kredit)</Label>
                      <Input
                        id="free_credits"
                        type="number"
                        min={1}
                        max={1000}
                        value={freeQuota.free_credits}
                        onChange={(e) => setFreeQuota(prev => ({ ...prev, free_credits: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Jumlah kredit transaksi yang diberikan gratis
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validity_days">Masa Berlaku (hari)</Label>
                      <Input
                        id="validity_days"
                        type="number"
                        min={1}
                        max={365}
                        value={freeQuota.validity_days}
                        onChange={(e) => setFreeQuota(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Berapa hari kuota gratis berlaku setelah disetujui
                      </p>
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveFreeQuota} disabled={savingFreeQuota}>
                  <Save className="h-4 w-4 mr-2" />
                  {savingFreeQuota ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tier Info */}
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">Informasi Tier</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Konfigurasi tier kuota saat ini menggunakan pengaturan default.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Tier Biaya Kuota</CardTitle>
                <CardDescription>
                  Biaya kredit yang dipotong berdasarkan rentang harga produk
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">Tier {index + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(tier.min_price)} - {tier.max_price ? formatPrice(tier.max_price) : 'Tidak terbatas'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{tier.credit_cost} Kredit</p>
                    <p className="text-xs text-muted-foreground">per transaksi</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

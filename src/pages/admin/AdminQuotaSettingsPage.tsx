import { useState } from 'react';
import { Settings, Info } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchQuotaTiers, QuotaTier } from '@/lib/quotaApi';
import { formatPrice } from '@/lib/utils';

export default function AdminQuotaSettingsPage() {
  const [tiers] = useState<QuotaTier[]>(() => {
    // Using default tiers from quotaApi since database table doesn't exist
    return [
      { id: '1', min_price: 0, max_price: 10000, credit_cost: 1 },
      { id: '2', min_price: 10001, max_price: 50000, credit_cost: 2 },
      { id: '3', min_price: 50001, max_price: 100000, credit_cost: 3 },
      { id: '4', min_price: 100001, max_price: null, credit_cost: 5 },
    ];
  });

  return (
    <AdminLayout title="Pengaturan Kuota" subtitle="Biaya kuota transaksi berdasarkan harga produk">
      <div className="space-y-6">
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">Informasi</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Konfigurasi tier kuota saat ini menggunakan pengaturan default. 
            Hubungi administrator sistem untuk mengubah pengaturan ini.
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

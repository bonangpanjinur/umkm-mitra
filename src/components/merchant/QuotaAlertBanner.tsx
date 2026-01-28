import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuotaStatus {
  hasActiveSubscription: boolean;
  remainingQuota: number;
  totalQuota: number;
}

export function QuotaAlertBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchQuotaStatus = async () => {
      if (!user) return;

      try {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!merchant) {
          setLoading(false);
          return;
        }

        const { data: subscription } = await supabase
          .from('merchant_subscriptions')
          .select('transaction_quota, used_quota, expired_at')
          .eq('merchant_id', merchant.id)
          .eq('status', 'ACTIVE')
          .gte('expired_at', new Date().toISOString())
          .order('expired_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscription) {
          setStatus({
            hasActiveSubscription: true,
            remainingQuota: subscription.transaction_quota - subscription.used_quota,
            totalQuota: subscription.transaction_quota,
          });
        } else {
          setStatus({
            hasActiveSubscription: false,
            remainingQuota: 0,
            totalQuota: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching quota status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotaStatus();
  }, [user]);

  if (loading || dismissed) return null;
  if (!status) return null;

  const isEmpty = status.remainingQuota <= 0;
  const isLow = status.remainingQuota <= 5 && status.remainingQuota > 0;

  // Only show if no quota or very low
  if (!isEmpty && !isLow && status.hasActiveSubscription) return null;

  const isNoQuota = !status.hasActiveSubscription || isEmpty;

  return (
    <Alert 
      variant="destructive" 
      className={`mb-6 border-2 ${isNoQuota ? 'border-destructive bg-destructive/10' : 'border-warning bg-warning/10'}`}
    >
      <AlertTriangle className={`h-5 w-5 ${isNoQuota ? 'text-destructive' : 'text-warning'}`} />
      <AlertTitle className="text-base font-bold">
        {isNoQuota 
          ? '⚠️ Toko Anda Tidak Dapat Menerima Pesanan!' 
          : '⚠️ Kuota Transaksi Hampir Habis!'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm mb-3">
          {isNoQuota ? (
            <>
              <strong>Produk Anda tidak tampil di halaman publik</strong> karena tidak memiliki kuota transaksi aktif. 
              Pembeli tidak dapat melihat atau membeli produk Anda hingga Anda membeli paket kuota.
            </>
          ) : (
            <>
              Kuota transaksi Anda tersisa <strong>{status.remainingQuota}</strong> dari {status.totalQuota}. 
              Segera beli paket tambahan agar toko Anda tetap dapat menerima pesanan.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => navigate('/merchant/subscription')}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Beli Paket Kuota Sekarang
          </Button>
          {isLow && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Nanti
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

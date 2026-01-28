import { useState } from 'react';
import { Ticket, X, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { useRateLimit } from '@/lib/rateLimit';
import { useAuth } from '@/contexts/AuthContext';

interface VoucherInputProps {
  orderTotal: number;
  merchantId?: string;
  onVoucherApplied: (discount: number, voucherId: string, voucherName: string) => void;
  onVoucherRemoved: () => void;
  appliedVoucher?: { id: string; name: string; discount: number } | null;
}

export function VoucherInput({
  orderTotal,
  merchantId,
  onVoucherApplied,
  onVoucherRemoved,
  appliedVoucher,
}: VoucherInputProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { checkLimit } = useRateLimit('voucherApply');

  const handleApplyVoucher = async () => {
    if (!code.trim()) {
      toast.error('Masukkan kode voucher');
      return;
    }

    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    // Check rate limit
    const limitCheck = checkLimit(user.id);
    if (!limitCheck.allowed) {
      toast.error(`Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(limitCheck.resetIn / 1000)} detik`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('apply_voucher', {
        p_code: code.trim(),
        p_user_id: user.id,
        p_order_total: orderTotal,
        p_merchant_id: merchantId || null,
      });

      if (error) throw error;

      const result = data as { valid: boolean; error?: string; voucher_id?: string; discount?: number; voucher_name?: string };

      if (!result.valid) {
        toast.error(result.error || 'Voucher tidak valid');
        return;
      }

      onVoucherApplied(result.discount!, result.voucher_id!, result.voucher_name!);
      toast.success(`Voucher "${result.voucher_name}" berhasil diterapkan!`);
      setCode('');
    } catch (error) {
      console.error('Error applying voucher:', error);
      toast.error('Gagal menerapkan voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    onVoucherRemoved();
    toast.info('Voucher dihapus');
  };

  if (appliedVoucher) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {appliedVoucher.name}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Hemat {formatPrice(appliedVoucher.discount)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:text-red-600"
            onClick={handleRemoveVoucher}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Ticket className="h-4 w-4 text-primary" />
        Kode Voucher
      </label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Masukkan kode"
          className="flex-1 uppercase"
          disabled={loading}
        />
        <Button
          onClick={handleApplyVoucher}
          disabled={loading || !code.trim()}
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Pakai'
          )}
        </Button>
      </div>
    </div>
  );
}

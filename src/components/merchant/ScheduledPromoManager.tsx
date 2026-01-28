import { useState, useEffect } from 'react';
import { Calendar, Clock, Percent, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  price: number;
  is_promo: boolean;
  discount_percent: number | null;
  discount_end_date: string | null;
}

interface ScheduledPromoManagerProps {
  merchantId: string;
}

export function ScheduledPromoManager({ merchantId }: ScheduledPromoManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [merchantId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, is_promo, discount_percent, discount_end_date')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePromo = async () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }

    if (discountPercent < 1 || discountPercent > 90) {
      toast.error('Diskon harus antara 1-90%');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_promo: true,
          discount_percent: discountPercent,
          discount_end_date: endDate || null,
        })
        .eq('id', selectedProduct);

      if (error) throw error;
      toast.success('Promo berhasil dijadwalkan!');
      fetchProducts();
      setSelectedProduct('');
      setDiscountPercent(10);
      setEndDate('');
    } catch (error) {
      console.error('Error scheduling promo:', error);
      toast.error('Gagal menjadwalkan promo');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePromo = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_promo: false,
          discount_percent: null,
          discount_end_date: null,
        })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Promo dihapus');
      fetchProducts();
    } catch (error) {
      console.error('Error removing promo:', error);
      toast.error('Gagal menghapus promo');
    }
  };

  const activePromos = products.filter(p => p.is_promo);
  const availableProducts = products.filter(p => !p.is_promo);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule New Promo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Jadwalkan Promo Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pilih Produk</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Diskon (%)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Berakhir (opsional)</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleSchedulePromo} 
            disabled={saving || !selectedProduct}
            className="w-full gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Jadwalkan Promo'}
          </Button>
        </CardContent>
      </Card>

      {/* Active Promos */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Promo Aktif ({activePromos.length})
        </h3>
        
        {activePromos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada promo aktif
          </p>
        ) : (
          <div className="space-y-2">
            {activePromos.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                        -{product.discount_percent}%
                      </span>
                      {product.discount_end_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(product.discount_end_date), 'dd MMM yyyy HH:mm', { locale: id })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemovePromo(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

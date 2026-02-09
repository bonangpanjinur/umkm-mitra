import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, Printer, CheckCircle, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { OrderInvoice, printInvoice } from '@/components/merchant/OrderInvoice';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function MerchantPOSPage() {
  const { user } = useAuth();
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState('');
  const [merchantAddress, setMerchantAddress] = useState<string | null>(null);
  const [merchantPhone, setMerchantPhone] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [successDialog, setSuccessDialog] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [lastOrderItems, setLastOrderItems] = useState<any[]>([]);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMerchant = async () => {
      if (!user) return;
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id, name, address, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (merchant) {
        setMerchantId(merchant.id);
        setMerchantName(merchant.name);
        setMerchantAddress(merchant.address);
        setMerchantPhone(merchant.phone);
      }
    };
    fetchMerchant();
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!merchantId) return;
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, price, stock, image_url, category')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .gt('stock', 0)
        .order('name');
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [merchantId]);

  // Check quota
  useEffect(() => {
    const checkQuota = async () => {
      if (!merchantId) return;
      const { data } = await supabase.rpc('check_merchant_quota', { p_merchant_id: merchantId });
      if (data) {
        const parsed = typeof data === 'object' && data !== null ? data as Record<string, any> : null;
        setQuotaRemaining(parsed?.remaining_quota ?? 0);
      }
    };
    checkQuota();
  }, [merchantId]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Stok tidak mencukupi');
          return prev;
        }
        return prev.map(c =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.product.id === productId) {
          const newQty = c.quantity + delta;
          if (newQty <= 0) return c;
          if (newQty > c.product.stock) {
            toast.error('Stok tidak mencukupi');
            return c;
          }
          return { ...c, quantity: newQty };
        }
        return c;
      }).filter(c => c.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const total = subtotal; // No shipping for POS

  const handleCheckout = async () => {
    if (!merchantId || !user || cart.length === 0) return;

    // Check quota first
    const { data: quotaCheck } = await supabase.rpc('check_merchant_quota', { p_merchant_id: merchantId });
    const quotaParsed = typeof quotaCheck === 'object' && quotaCheck !== null ? quotaCheck as Record<string, any> : null;
    if (!quotaParsed?.can_transact) {
      toast.error('Kuota transaksi habis! Beli paket kuota untuk melanjutkan.');
      return;
    }

    setProcessing(true);
    try {
      // Create order record (POS = handled_by MERCHANT, delivery_type PICKUP, payment immediate)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id, // merchant acts as buyer for POS
          merchant_id: merchantId,
          delivery_type: 'PICKUP',
          delivery_name: customerName || 'Pelanggan Kasir',
          payment_method: paymentMethod === 'CASH' ? 'COD' : 'TRANSFER',
          payment_status: 'PAID',
          status: 'DONE',
          subtotal,
          shipping_cost: 0,
          total,
          handled_by: 'MERCHANT',
          notes: `Penjualan Kasir POS - ${paymentMethod}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(c => ({
        order_id: order.id,
        product_id: c.product.id,
        product_name: c.product.name,
        product_price: c.product.price,
        quantity: c.quantity,
        subtotal: c.product.price * c.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Reduce stock
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id);
      }

      // Use merchant quota (reduce by 1 credit)
      await supabase.rpc('use_merchant_quota', { p_merchant_id: merchantId });

      // Update quota display
      setQuotaRemaining(prev => prev !== null ? Math.max(0, prev - 1) : null);

      // Save last order for receipt
      setLastOrder(order);
      setLastOrderItems(orderItems);
      setSuccessDialog(true);

      // Reset cart
      setCart([]);
      setCustomerName('');

      // Refresh products (stock updated)
      const { data: refreshed } = await supabase
        .from('products')
        .select('id, name, price, stock, image_url, category')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .gt('stock', 0)
        .order('name');
      setProducts(refreshed || []);

      toast.success('Transaksi berhasil!');
    } catch (error: any) {
      console.error('POS checkout error:', error);
      toast.error('Gagal memproses transaksi: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (invoiceRef.current) {
      printInvoice(invoiceRef.current);
    }
  };

  return (
    <MerchantLayout title="Kasir POS" subtitle="Penjualan langsung di toko">
      {/* Quota Warning */}
      {quotaRemaining !== null && quotaRemaining <= 5 && (
        <Alert variant={quotaRemaining === 0 ? 'destructive' : 'default'} className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {quotaRemaining === 0
              ? 'Kuota transaksi habis! Anda tidak dapat memproses transaksi baru.'
              : `Kuota transaksi tersisa ${quotaRemaining}. Segera beli paket kuota baru.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-20 object-cover rounded-md mb-2"
                      />
                    ) : (
                      <div className="w-full h-20 bg-muted rounded-md mb-2 flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-primary font-bold text-sm">{formatPrice(product.price)}</p>
                    <p className="text-xs text-muted-foreground">Stok: {product.stock}</p>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  Tidak ada produk ditemukan
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart / Checkout Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang
                </h3>
                <Badge variant="secondary">{cart.length} item</Badge>
              </div>

              <Separator />

              {/* Customer Name */}
              <Input
                placeholder="Nama pelanggan (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              {/* Cart Items */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">
                    Keranjang kosong
                  </p>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-medium w-20 text-right">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* Payment Method */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Metode Pembayaran</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('CASH')}
                    className="w-full"
                  >
                    <Banknote className="h-4 w-4 mr-1" />
                    Tunai
                  </Button>
                  <Button
                    variant={paymentMethod === 'TRANSFER' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Transfer
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-primary/5 rounded-lg p-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0 || processing || quotaRemaining === 0}
                onClick={handleCheckout}
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Proses Pembayaran
              </Button>

              {quotaRemaining !== null && (
                <p className="text-xs text-center text-muted-foreground">
                  Sisa kuota: <span className="font-medium">{quotaRemaining}</span> transaksi
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success + Print Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Transaksi Berhasil
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {lastOrder && (
              <OrderInvoice
                ref={invoiceRef}
                order={{
                  id: lastOrder.id,
                  delivery_name: lastOrder.delivery_name,
                  delivery_phone: null,
                  delivery_address: null,
                  delivery_type: 'PICKUP',
                  subtotal: lastOrder.subtotal,
                  shipping_cost: 0,
                  total: lastOrder.total,
                  payment_method: lastOrder.payment_method,
                  created_at: lastOrder.created_at,
                  notes: lastOrder.notes,
                }}
                items={lastOrderItems.map((item, i) => ({
                  id: String(i),
                  product_name: item.product_name,
                  quantity: item.quantity,
                  product_price: item.product_price,
                  subtotal: item.subtotal,
                }))}
                merchant={{
                  name: merchantName,
                  address: merchantAddress,
                  phone: merchantPhone,
                }}
              />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSuccessDialog(false)}>
              Tutup
            </Button>
            <Button onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak Struk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}

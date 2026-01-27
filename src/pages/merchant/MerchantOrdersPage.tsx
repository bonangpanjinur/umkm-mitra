import { useState, useEffect } from 'react';
import { Receipt, Check, X, Package, Clock, MoreHorizontal, User, MapPin, Phone } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface OrderRow {
  id: string;
  status: string;
  delivery_type: string;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  created_at: string;
}

export default function MerchantOrdersPage() {
  const { user } = useAuth();
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
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

        setMerchantId(merchant.id);

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('merchant_id', merchant.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Gagal memuat pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const viewOrderDetail = async (order: OrderRow) => {
    setSelectedOrder(order);
    
    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    setOrderItems(items || []);
    setDetailDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      toast.success('Status pesanan diperbarui');
      setDetailDialogOpen(false);
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'NEW': { label: 'Baru', className: 'bg-blue-100 text-blue-700' },
      'PROCESSED': { label: 'Diproses', className: 'bg-amber-100 text-amber-700' },
      'SENT': { label: 'Dikirim', className: 'bg-purple-100 text-purple-700' },
      'DONE': { label: 'Selesai', className: 'bg-primary/10 text-primary' },
      'CANCELED': { label: 'Dibatalkan', className: 'bg-destructive/10 text-destructive' },
    };
    
    const config = statusMap[status] || { label: status, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const columns = [
    {
      key: 'id',
      header: 'ID Pesanan',
      render: (item: OrderRow) => (
        <span className="font-mono text-sm">#{item.id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Pelanggan',
      render: (item: OrderRow) => (
        <div>
          <p className="font-medium">{item.delivery_name || 'Pelanggan'}</p>
          <p className="text-xs text-muted-foreground">{item.delivery_phone || '-'}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (item: OrderRow) => `Rp ${item.total.toLocaleString('id-ID')}`,
    },
    {
      key: 'delivery_type',
      header: 'Pengiriman',
      render: (item: OrderRow) => (
        <Badge variant="outline">
          {item.delivery_type === 'PICKUP' ? 'Ambil Sendiri' : 'Diantar'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: OrderRow) => getStatusBadge(item.status),
    },
    {
      key: 'created_at',
      header: 'Tanggal',
      render: (item: OrderRow) => new Date(item.created_at).toLocaleDateString('id-ID'),
    },
    {
      key: 'actions',
      header: '',
      render: (item: OrderRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => viewOrderDetail(item)}>
              Lihat Detail
            </DropdownMenuItem>
            {item.status === 'NEW' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(item.id, 'PROCESSED')}>
                <Check className="h-4 w-4 mr-2" />
                Proses Pesanan
              </DropdownMenuItem>
            )}
            {item.status === 'PROCESSED' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(item.id, 'SENT')}>
                <Package className="h-4 w-4 mr-2" />
                Kirim
              </DropdownMenuItem>
            )}
            {(item.status === 'NEW' || item.status === 'PROCESSED') && (
              <DropdownMenuItem onClick={() => updateOrderStatus(item.id, 'CANCELED')} className="text-destructive">
                <X className="h-4 w-4 mr-2" />
                Batalkan
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'NEW', label: 'Baru' },
        { value: 'PROCESSED', label: 'Diproses' },
        { value: 'SENT', label: 'Dikirim' },
        { value: 'DONE', label: 'Selesai' },
        { value: 'CANCELED', label: 'Dibatalkan' },
      ],
    },
    {
      key: 'delivery_type',
      label: 'Pengiriman',
      options: [
        { value: 'PICKUP', label: 'Ambil Sendiri' },
        { value: 'INTERNAL', label: 'Diantar' },
      ],
    },
  ];

  return (
    <MerchantLayout title="Pesanan" subtitle="Kelola pesanan masuk">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-5 w-5 text-primary" />
        <span className="text-muted-foreground text-sm">
          {orders.length} pesanan • {orders.filter(o => o.status === 'NEW').length} baru
        </span>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        searchKey="delivery_name"
        searchPlaceholder="Cari nama pelanggan..."
        filters={filters}
        loading={loading}
        emptyMessage="Belum ada pesanan"
      />

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Detail Pesanan #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Customer Info */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrder.delivery_name || 'Pelanggan'}</span>
                </div>
                {selectedOrder.delivery_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrder.delivery_phone}</span>
                  </div>
                )}
                {selectedOrder.delivery_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Item Pesanan</p>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {orderItems.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x Rp {item.product_price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Catatan:</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rp {selectedOrder.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ongkir</span>
                  <span>Rp {selectedOrder.shipping_cost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Actions */}
              {selectedOrder.status === 'NEW' && (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'PROCESSED')}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Proses Pesanan
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELED')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}

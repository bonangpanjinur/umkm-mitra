import { useState, useEffect } from 'react';
import { Receipt, Eye, MoreHorizontal, Package, Truck, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { CourierAssignDialog } from '@/components/admin/CourierAssignDialog';
import { OrderDetailsDialog } from '@/components/order/OrderDetailsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

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
  payment_status: string | null;
  delivery_type: string;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  created_at: string;
  courier_id: string | null;
  merchants: { name: string } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [courierAssignDialogOpen, setCourierAssignDialogOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, merchants(name)')
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const viewOrderDetail = async (order: OrderRow) => {
    setSelectedOrder(order);
    
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    setOrderItems(items || []);
    setDetailDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'DONE') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
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

  const openAssignDialog = (order: OrderRow) => {
    setSelectedOrder(order);
    setCourierAssignDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'destructive' | 'pending' }> = {
      'NEW': { label: 'Baru', variant: 'info' },
      'CONFIRMED': { label: 'Dikonfirmasi', variant: 'info' },
      'PROCESSED': { label: 'Diproses', variant: 'warning' },
      'SENT': { label: 'Dikirim', variant: 'pending' },
      'DONE': { label: 'Selesai', variant: 'success' },
      'CANCELLED': { label: 'Dibatalkan', variant: 'destructive' },
    };
    
    const config = statusMap[status] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (paymentStatus: string | null) => {
    const statusMap: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' | 'pending' }> = {
      'UNPAID': { label: 'Belum Bayar', variant: 'warning' },
      'PENDING': { label: 'Menunggu', variant: 'info' },
      'PAID': { label: 'Lunas', variant: 'success' },
      'EXPIRED': { label: 'Expired', variant: 'destructive' },
      'COD': { label: 'COD', variant: 'pending' },
    };
    
    const config = statusMap[paymentStatus || 'UNPAID'] || { label: paymentStatus || '-', variant: 'warning' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
      key: 'merchant',
      header: 'Merchant',
      render: (item: OrderRow) => item.merchants?.name || '-',
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
      render: (item: OrderRow) => formatPrice(item.total),
    },
    {
      key: 'payment_status',
      header: 'Pembayaran',
      render: (item: OrderRow) => getPaymentBadge(item.payment_status),
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
              <Eye className="h-4 w-4 mr-2" />
              Lihat Detail
            </DropdownMenuItem>
            {item.delivery_type === 'INTERNAL' && !item.courier_id && (
              <DropdownMenuItem onClick={() => openAssignDialog(item)}>
                <Truck className="h-4 w-4 mr-2" />
                Tugaskan Kurir
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {item.status === 'NEW' && (
              <>
                <DropdownMenuItem onClick={() => updateOrderStatus(item.id, 'PROCESSED')}>
                  <Package className="h-4 w-4 mr-2" />
                  Terima & Proses
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => updateOrderStatus(item.id, 'CANCELLED')} 
                  className="text-destructive"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Tolak Pesanan
                </DropdownMenuItem>
              </>
            )}
            {item.status === 'PROCESSED' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(item.id, 'SENT')}>
                <Truck className="h-4 w-4 mr-2" />
                Kirim
              </DropdownMenuItem>
            )}
            {item.status === 'SENT' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(item.id, 'DONE')}>
                Selesaikan
              </DropdownMenuItem>
            )}
            {['NEW', 'PROCESSED'].includes(item.status) && (
              <DropdownMenuItem 
                onClick={() => updateOrderStatus(item.id, 'CANCELLED')}
                className="text-destructive"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
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
        { value: 'CONFIRMED', label: 'Dikonfirmasi' },
        { value: 'PROCESSED', label: 'Diproses' },
        { value: 'SENT', label: 'Dikirim' },
        { value: 'DONE', label: 'Selesai' },
        { value: 'CANCELLED', label: 'Dibatalkan' },
      ],
    },
    {
      key: 'payment_status',
      label: 'Pembayaran',
      options: [
        { value: 'UNPAID', label: 'Belum Bayar' },
        { value: 'PENDING', label: 'Menunggu' },
        { value: 'PAID', label: 'Lunas' },
        { value: 'COD', label: 'COD' },
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

  const newOrdersCount = orders.filter(o => o.status === 'NEW').length;
  const unpaidCount = orders.filter(o => o.payment_status === 'UNPAID' || o.payment_status === 'PENDING').length;

  return (
    <AdminLayout title="Manajemen Pesanan" subtitle="Kelola semua pesanan">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <span className="text-muted-foreground text-sm">{orders.length} pesanan</span>
        </div>
        {newOrdersCount > 0 && (
          <Badge variant="info">{newOrdersCount} baru</Badge>
        )}
        {unpaidCount > 0 && (
          <Badge variant="warning">
            <AlertCircle className="h-3 w-3 mr-1" />
            {unpaidCount} belum bayar
          </Badge>
        )}
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

      <OrderDetailsDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        order={selectedOrder}
        orderItems={orderItems}
        onUpdateStatus={updateOrderStatus}
        onOpenAssignCourier={openAssignDialog}
        getStatusBadge={getStatusBadge}
        getPaymentBadge={getPaymentBadge}
      />

      {selectedOrder && (
        <CourierAssignDialog
          open={courierAssignDialogOpen}
          onOpenChange={setCourierAssignDialogOpen}
          orderId={selectedOrder.id}
          onSuccess={() => {
            fetchOrders();
            setDetailDialogOpen(false);
          }}
        />
      )}
    </AdminLayout>
  );
}

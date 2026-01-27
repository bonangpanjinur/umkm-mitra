import { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle, Eye, Filter, Download, MoreHorizontal } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { logAdminAction } from '@/lib/auditLog';

interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isBlocked: boolean;
  blockedAt: string | null;
  blockReason: string | null;
  createdAt: string;
  roles: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap = new Map<string, string[]>();
      roles?.forEach(r => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      const mappedUsers: UserProfile[] = (profiles || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        fullName: p.full_name || 'Tanpa Nama',
        phone: p.phone,
        avatarUrl: p.avatar_url,
        isBlocked: p.is_blocked || false,
        blockedAt: p.blocked_at,
        blockReason: p.block_reason,
        createdAt: p.created_at,
        roles: roleMap.get(p.user_id) || ['buyer'],
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason.trim()) {
      toast.error('Alasan blokir harus diisi');
      return;
    }

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          block_reason: blockReason,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await logAdminAction('BLOCK_USER', 'user', selectedUser.userId, 
        { is_blocked: false }, 
        { is_blocked: true, block_reason: blockReason }
      );

      toast.success('Pengguna berhasil diblokir');
      setBlockDialogOpen(false);
      setBlockReason('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Gagal memblokir pengguna');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (user: UserProfile) => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: false,
          blocked_at: null,
          block_reason: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await logAdminAction('UNBLOCK_USER', 'user', user.userId,
        { is_blocked: true, block_reason: user.blockReason },
        { is_blocked: false }
      );

      toast.success('Pengguna berhasil dibuka blokirnya');
      loadUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Gagal membuka blokir pengguna');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search) ||
      user.userId.includes(search);
    
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'blocked' && user.isBlocked) ||
      (statusFilter === 'active' && !user.isBlocked);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Nama', 'Telepon', 'Role', 'Status', 'Terdaftar'];
    const rows = filteredUsers.map(u => [
      u.fullName,
      u.phone || '-',
      u.roles.join(', '),
      u.isBlocked ? 'Diblokir' : 'Aktif',
      format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: idLocale }),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'merchant': return 'bg-primary text-primary-foreground';
      case 'courier': return 'bg-chart-2 text-white';
      case 'verifikator': return 'bg-chart-4 text-white';
      case 'admin_desa': return 'bg-chart-3 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <AdminLayout title="Manajemen Pengguna" subtitle="Kelola semua pengguna aplikasi">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, telepon, atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="merchant">Merchant</SelectItem>
            <SelectItem value="courier">Kurir</SelectItem>
            <SelectItem value="verifikator">Verifikator</SelectItem>
            <SelectItem value="admin_desa">Admin Desa</SelectItem>
            <SelectItem value="buyer">Pembeli</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="blocked">Diblokir</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Pengguna</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pengguna Aktif</p>
          <p className="text-2xl font-bold text-chart-2">{users.filter(u => !u.isBlocked).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Diblokir</p>
          <p className="text-2xl font-bold text-destructive">{users.filter(u => u.isBlocked).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Hasil Filter</p>
          <p className="text-2xl font-bold">{filteredUsers.length}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Tidak ada pengguna ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <Badge key={role} className={getRoleBadgeColor(role)} variant="secondary">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive">Diblokir</Badge>
                      ) : (
                        <Badge variant="outline" className="text-chart-2 border-chart-2">Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.isBlocked ? (
                            <DropdownMenuItem onClick={() => handleUnblockUser(user)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Buka Blokir
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user);
                                setBlockDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Blokir Pengguna
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blokir Pengguna</DialogTitle>
            <DialogDescription>
              Pengguna yang diblokir tidak akan bisa mengakses aplikasi. Tindakan ini dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedUser.avatarUrl || undefined} />
                  <AvatarFallback>{selectedUser.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Alasan Blokir *</label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Jelaskan alasan pemblokiran..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleBlockUser} disabled={actionLoading}>
              {actionLoading ? 'Memproses...' : 'Blokir Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

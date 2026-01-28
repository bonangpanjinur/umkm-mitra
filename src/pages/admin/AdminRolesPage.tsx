import { useState, useEffect } from 'react';
import { Shield, Edit2, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
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
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
}

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Admin', description: 'Akses penuh ke semua fitur' },
  { id: 'verifikator', label: 'Verifikator', description: 'Kelola merchant dan komisi' },
  { id: 'merchant', label: 'Merchant', description: 'Kelola toko dan produk' },
  { id: 'courier', label: 'Kurir', description: 'Kelola pengiriman' },
  { id: 'admin_desa', label: 'Admin Desa', description: 'Kelola wisata desa' },
  { id: 'buyer', label: 'Pembeli', description: 'Akses dasar pembeli' },
];

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = (profiles || []).map((profile) => {
        const userRoles = (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role);

        return {
          id: profile.user_id,
          email: '', // Will be fetched separately if needed
          full_name: profile.full_name || 'Unnamed User',
          roles: userRoles,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserWithRoles) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id);

      if (deleteError) throw deleteError;

      // Insert new roles
      if (selectedRoles.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(
            selectedRoles.map((role) => ({
              user_id: editingUser.id,
              role: role as AppRole,
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success('Role berhasil diperbarui');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error saving roles:', error);
      toast.error('Gagal menyimpan role');
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.roles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'verifikator':
        return 'default';
      case 'merchant':
        return 'secondary';
      case 'courier':
        return 'outline';
      case 'admin_desa':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <AdminLayout title="Manajemen Role" subtitle="Kelola role dan izin pengguna">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <Input
            placeholder="Cari pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {AVAILABLE_ROLES.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Role Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AVAILABLE_ROLES.map((role) => {
            const count = users.filter((u) => u.roles.includes(role.id)).length;
            return (
              <Card key={role.id} className="cursor-pointer hover:border-primary transition"
                onClick={() => setFilterRole(filterRole === role.id ? 'all' : role.id)}>
                <CardContent className="p-4 text-center">
                  <Shield className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{role.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        ) : (
                          user.roles.map((role) => (
                            <Badge key={role} variant={getRoleBadgeVariant(role) as any} className="text-xs">
                              {AVAILABLE_ROLES.find((r) => r.id === role)?.label || role}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Tidak ada pengguna ditemukan</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role - {editingUser?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {AVAILABLE_ROLES.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleRole(role.id)}
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <div>
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingUser(null)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveRoles}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

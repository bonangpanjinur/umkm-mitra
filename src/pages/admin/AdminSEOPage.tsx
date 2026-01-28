import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Globe, Save, Image } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SEOSetting {
  id: string;
  page_path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  canonical_url: string | null;
  robots: string;
}

const COMMON_PAGES = [
  { path: '/', label: 'Beranda' },
  { path: '/products', label: 'Produk' },
  { path: '/tourism', label: 'Wisata' },
  { path: '/explore', label: 'Explore' },
  { path: '/shops', label: 'Toko' },
];

export default function AdminSEOPage() {
  const [settings, setSettings] = useState<SEOSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SEOSetting | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    page_path: '',
    title: '',
    description: '',
    keywords: '',
    og_image: '',
    og_title: '',
    og_description: '',
    canonical_url: '',
    robots: 'index, follow',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .order('page_path');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: SEOSetting) => {
    setEditingSetting(setting);
    setFormData({
      page_path: setting.page_path,
      title: setting.title || '',
      description: setting.description || '',
      keywords: setting.keywords || '',
      og_image: setting.og_image || '',
      og_title: setting.og_title || '',
      og_description: setting.og_description || '',
      canonical_url: setting.canonical_url || '',
      robots: setting.robots,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSetting(null);
    setFormData({
      page_path: '',
      title: '',
      description: '',
      keywords: '',
      og_image: '',
      og_title: '',
      og_description: '',
      canonical_url: '',
      robots: 'index, follow',
    });
  };

  const handleSubmit = async () => {
    if (!formData.page_path) {
      toast.error('Path halaman wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const seoData = {
        page_path: formData.page_path,
        title: formData.title || null,
        description: formData.description || null,
        keywords: formData.keywords || null,
        og_image: formData.og_image || null,
        og_title: formData.og_title || null,
        og_description: formData.og_description || null,
        canonical_url: formData.canonical_url || null,
        robots: formData.robots,
      };

      if (editingSetting) {
        const { error } = await supabase
          .from('seo_settings')
          .update(seoData)
          .eq('id', editingSetting.id);

        if (error) throw error;
        toast.success('SEO settings berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('seo_settings')
          .insert([seoData]);

        if (error) throw error;
        toast.success('SEO settings berhasil ditambahkan');
      }

      setDialogOpen(false);
      resetForm();
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving SEO:', error);
      if (error.code === '23505') {
        toast.error('Path halaman sudah ada');
      } else {
        toast.error('Gagal menyimpan settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus SEO settings ini?')) return;

    try {
      const { error } = await supabase
        .from('seo_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('SEO settings dihapus');
      fetchSettings();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Gagal menghapus');
    }
  };

  return (
    <AdminLayout title="SEO Settings" subtitle="Kelola meta tags untuk setiap halaman">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Konfigurasi SEO untuk meningkatkan peringkat di mesin pencari
          </p>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Halaman
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSetting ? 'Edit SEO Settings' : 'Tambah SEO Settings'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Path Halaman</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.page_path}
                      onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
                      placeholder="/products"
                      disabled={!!editingSetting}
                    />
                    {!editingSetting && (
                      <Select onValueChange={(value) => setFormData({ ...formData, page_path: value })}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_PAGES.map((page) => (
                            <SelectItem key={page.path} value={page.path}>
                              {page.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title (maks 60 karakter)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Judul halaman untuk SEO"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/60 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Description (maks 160 karakter)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat halaman"
                    maxLength={160}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/160 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Keywords (pisahkan dengan koma)</Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="umkm, desa, wisata"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OG Image URL</Label>
                  <Input
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OG Title (opsional)</Label>
                  <Input
                    value={formData.og_title}
                    onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                    placeholder="Judul untuk sosial media"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OG Description (opsional)</Label>
                  <Textarea
                    value={formData.og_description}
                    onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    placeholder="Deskripsi untuk sosial media"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Robots</Label>
                  <Select 
                    value={formData.robots} 
                    onValueChange={(value) => setFormData({ ...formData, robots: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="index, follow">Index, Follow (default)</SelectItem>
                      <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                      <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                      <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Settings'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : settings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Belum ada SEO settings</p>
              <p className="text-sm text-muted-foreground">Tambahkan konfigurasi SEO untuk halaman-halaman penting</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {settings.map((setting) => (
              <Card key={setting.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                          {setting.page_path}
                        </span>
                      </div>
                      {setting.title && (
                        <p className="font-medium text-sm truncate">{setting.title}</p>
                      )}
                      {setting.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {setting.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                          {setting.robots}
                        </span>
                        {setting.og_image && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            OG Image
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(setting.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

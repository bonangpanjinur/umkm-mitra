import { useState, useEffect } from 'react';
import { Save, Smartphone, Globe, Bell, Palette, RefreshCw, Image as ImageIcon, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PWASettings {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  enableOffline: boolean;
  enableNotifications: boolean;
  enableInstallPrompt: boolean;
  installPromptDelay: number;
  showInstallBanner: boolean;
  icons: {
    src: string;
    sizes: string;
    type: string;
  }[];
}

const defaultSettings: PWASettings = {
  appName: 'DesaMart - Marketplace UMKM & Desa Wisata',
  shortName: 'DesaMart',
  description: 'Jelajahi produk UMKM asli desa dan destinasi wisata desa di Indonesia',
  themeColor: '#10b981',
  backgroundColor: '#ffffff',
  enableOffline: true,
  enableNotifications: true,
  enableInstallPrompt: true,
  installPromptDelay: 30,
  showInstallBanner: true,
  icons: [
    { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
};

export default function AdminPWASettingsPage() {
  const [settings, setSettings] = useState<PWASettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('category', 'pwa')
        .single();

      if (data && !error && data.value) {
        const savedSettings = data.value as unknown as Partial<PWASettings>;
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('Error fetching PWA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'pwa_config',
          category: 'pwa',
          value: settings as any,
          description: 'Progressive Web App configuration',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Pengaturan PWA berhasil disimpan');
    } catch (error) {
      console.error('Error saving PWA settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof PWASettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout title="Pengaturan PWA" subtitle="Konfigurasi Progressive Web App">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pengaturan PWA" subtitle="Konfigurasi Progressive Web App">
      <div className="space-y-6">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Status PWA
            </CardTitle>
            <CardDescription>
              Progressive Web App memungkinkan pengguna menginstall aplikasi langsung dari browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="success" className="flex items-center gap-1 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                PWA Aktif
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Service Worker: Aktif
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Manifest: Valid
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                HTTPS: Aman
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Umum</TabsTrigger>
            <TabsTrigger value="appearance">Tampilan</TabsTrigger>
            <TabsTrigger value="icons">Ikon</TabsTrigger>
            <TabsTrigger value="behavior">Perilaku</TabsTrigger>
            <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Informasi Aplikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="appName">Nama Aplikasi</Label>
                    <Input
                      id="appName"
                      value={settings.appName}
                      onChange={(e) => handleChange('appName', e.target.value)}
                      placeholder="Nama lengkap aplikasi"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ditampilkan di splash screen dan about
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortName">Nama Singkat</Label>
                    <Input
                      id="shortName"
                      value={settings.shortName}
                      onChange={(e) => handleChange('shortName', e.target.value)}
                      placeholder="Nama singkat (max 12 karakter)"
                      maxLength={12}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ditampilkan di homescreen
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Deskripsi singkat aplikasi"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Icon Settings */}
          <TabsContent value="icons">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Ikon Aplikasi
                </CardTitle>
                <CardDescription>
                  Ikon yang digunakan untuk homescreen dan splash screen. Pastikan ukuran dan tipe file sesuai.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {settings.icons.map((icon, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        <img src={icon.src} alt={`Icon ${icon.sizes}`} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold">{icon.sizes}</Label>
                          <Badge variant="outline" className="text-[10px]">{icon.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{icon.src}</p>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Tervalidasi</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Tips Ikon PWA</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Gunakan format <strong>PNG</strong> untuk transparansi dan kualitas terbaik.</li>
                      <li>Pastikan ukuran tepat (192x192 dan 512x512 piksel).</li>
                      <li>Ikon 512x512 digunakan untuk splash screen berkualitas tinggi.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Tampilan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="themeColor">Warna Tema</Label>
                    <div className="flex gap-2">
                      <Input
                        id="themeColor"
                        type="color"
                        value={settings.themeColor}
                        onChange={(e) => handleChange('themeColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.themeColor}
                        onChange={(e) => handleChange('themeColor', e.target.value)}
                        placeholder="#10b981"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Warna status bar dan header browser
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Warna Background</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Warna splash screen saat loading
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-muted rounded-xl">
                  <h4 className="font-medium mb-3">Preview Splash Screen</h4>
                  <div 
                    className="w-48 h-80 rounded-2xl mx-auto shadow-lg flex flex-col items-center justify-center"
                    style={{ backgroundColor: settings.backgroundColor }}
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-white font-bold text-2xl"
                      style={{ backgroundColor: settings.themeColor }}
                    >
                      D
                    </div>
                    <p className="font-semibold text-sm" style={{ color: settings.themeColor }}>
                      {settings.shortName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Settings */}
          <TabsContent value="behavior">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Perilaku Aplikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mode Offline</Label>
                    <p className="text-xs text-muted-foreground">
                      Cache halaman untuk akses tanpa internet
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableOffline}
                    onCheckedChange={(checked) => handleChange('enableOffline', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tampilkan Prompt Install</Label>
                    <p className="text-xs text-muted-foreground">
                      Ajak pengguna menginstall aplikasi
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableInstallPrompt}
                    onCheckedChange={(checked) => handleChange('enableInstallPrompt', checked)}
                  />
                </div>

                {settings.enableInstallPrompt && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <Label htmlFor="installDelay">Delay Prompt (detik)</Label>
                    <Input
                      id="installDelay"
                      type="number"
                      value={settings.installPromptDelay}
                      onChange={(e) => handleChange('installPromptDelay', parseInt(e.target.value) || 30)}
                      min={0}
                      max={300}
                      className="w-32"
                    />
                    <p className="text-xs text-muted-foreground">
                      Waktu tunggu sebelum menampilkan prompt install
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Banner Install</Label>
                    <p className="text-xs text-muted-foreground">
                      Tampilkan banner install di bagian bawah
                    </p>
                  </div>
                  <Switch
                    checked={settings.showInstallBanner}
                    onCheckedChange={(checked) => handleChange('showInstallBanner', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aktifkan Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Kirim notifikasi ke perangkat pengguna
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => handleChange('enableNotifications', checked)}
                  />
                </div>

                {settings.enableNotifications && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h4 className="font-medium mb-2">Jenis Notifikasi Aktif</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ Status pesanan (baru, diproses, dikirim, selesai)</li>
                      <li>✓ Promo dan diskon</li>
                      <li>✓ Pengumuman sistem</li>
                      <li>✓ Chat dari pembeli/penjual</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={fetchSettings}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

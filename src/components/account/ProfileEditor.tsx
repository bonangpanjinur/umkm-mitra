import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressSelector, formatFullAddress, createEmptyAddressData, type AddressData } from '@/components/AddressSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProfileEditorProps {
  userId: string;
  initialData: {
    full_name: string;
    phone: string | null;
    address: string | null;
  };
  onSave: (data: { full_name: string; phone: string | null; address: string | null }) => void;
  onCancel: () => void;
}

export function ProfileEditor({ userId, initialData, onSave, onCancel }: ProfileEditorProps) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(initialData.full_name || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [addressData, setAddressData] = useState<AddressData>(createEmptyAddressData());

  // Parse existing address if available (try to extract detail part)
  useEffect(() => {
    if (initialData.address) {
      // If there's existing address, put it in the detail field
      // In a more sophisticated implementation, you could parse the address
      setAddressData(prev => ({
        ...prev,
        detail: initialData.address || '',
      }));
    }
  }, [initialData.address]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Nama lengkap wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Format the full address from the selector
      const formattedAddress = formatFullAddress(addressData);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: formattedAddress || null,
          village: addressData.villageName || null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      onSave({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: formattedAddress || null,
      });

      toast({ title: 'Profil berhasil diperbarui' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Gagal memperbarui profil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Lengkap</Label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nama lengkap"
        />
      </div>

      <div className="space-y-2">
        <Label>No. Telepon</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
          type="tel"
        />
      </div>

      <div className="space-y-2">
        <Label>Alamat</Label>
        <AddressSelector
          value={addressData}
          onChange={setAddressData}
          disabled={saving}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={saving}
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
        </Button>
      </div>
    </div>
  );
}

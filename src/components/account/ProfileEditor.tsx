import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressSelector, formatFullAddress, createEmptyAddressData, type AddressData } from '@/components/AddressSelector';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isValidIndonesianPhone } from '@/lib/phoneValidation';

interface ProfileEditorProps {
  userId: string;
  initialData: {
    full_name: string;
    phone: string | null;
    address: string | null;
    province_id?: string | null;
    province_name?: string | null;
    city_id?: string | null;
    city_name?: string | null;
    district_id?: string | null;
    district_name?: string | null;
    village_id?: string | null;
    village_name?: string | null;
    address_detail?: string | null;
  };
  onSave: (data: { full_name: string; phone: string | null; address: string | null }) => void;
  onCancel: () => void;
}

export function ProfileEditor({ userId, initialData, onSave, onCancel }: ProfileEditorProps) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(initialData.full_name || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [phoneValid, setPhoneValid] = useState(true);
  const [addressData, setAddressData] = useState<AddressData>(() => {
    // Initialize with stored address components if available
    if (initialData.province_id) {
      return {
        province: initialData.province_id || '',
        provinceName: initialData.province_name || '',
        city: initialData.city_id || '',
        cityName: initialData.city_name || '',
        district: initialData.district_id || '',
        districtName: initialData.district_name || '',
        village: initialData.village_id || '',
        villageName: initialData.village_name || '',
        detail: initialData.address_detail || '',
      };
    }
    return createEmptyAddressData();
  });

  const handlePhoneValidation = (isValid: boolean) => {
    setPhoneValid(isValid || !phone); // Empty phone is valid
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Nama lengkap wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    if (phone && !isValidIndonesianPhone(phone)) {
      toast({
        title: 'Format nomor telepon tidak valid',
        description: 'Gunakan format 08xx-xxxx-xxxx',
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
          province_id: addressData.province || null,
          province_name: addressData.provinceName || null,
          city_id: addressData.city || null,
          city_name: addressData.cityName || null,
          district_id: addressData.district || null,
          district_name: addressData.districtName || null,
          village_id: addressData.village || null,
          village_name: addressData.villageName || null,
          address_detail: addressData.detail || null,
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
        <PhoneInput
          value={phone}
          onChange={setPhone}
          onValidationChange={handlePhoneValidation}
          disabled={saving}
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
          disabled={saving || (!phoneValid && !!phone)}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
        </Button>
      </div>
    </div>
  );
}

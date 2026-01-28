import { useState, useEffect } from 'react';
import { MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressSelector, type AddressData, formatFullAddress, createEmptyAddressData } from '@/components/AddressSelector';
import { LocationPicker } from './LocationPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneInput } from '@/components/ui/PhoneInput';

export interface CheckoutAddressData {
  name: string;
  phone: string;
  address: AddressData;
  location: { lat: number; lng: number } | null;
  fullAddress: string;
}

interface CheckoutAddressFormProps {
  value: CheckoutAddressData;
  onChange: (data: CheckoutAddressData) => void;
  onDistanceChange?: (distanceKm: number) => void;
  merchantLocation?: { lat: number; lng: number } | null;
  errors?: {
    name?: string;
    phone?: string;
    address?: string;
    location?: string;
  };
}

export function CheckoutAddressForm({
  value,
  onChange,
  onDistanceChange,
  merchantLocation,
  errors,
}: CheckoutAddressFormProps) {
  const { user } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || profileLoaded) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Auto-fill from profile if checkout form is empty
          const hasExistingData = value.name || value.phone || value.address.province;
          
          if (!hasExistingData) {
            const addressData: AddressData = {
              province: profile.province_id || '',
              provinceName: profile.province_name || '',
              city: profile.city_id || '',
              cityName: profile.city_name || '',
              district: profile.district_id || '',
              districtName: profile.district_name || '',
              village: profile.village_id || '',
              villageName: profile.village_name || '',
              detail: profile.address_detail || '',
            };

            onChange({
              name: profile.full_name || '',
              phone: profile.phone || '',
              address: addressData,
              location: value.location,
              fullAddress: formatFullAddress(addressData),
            });
          }
        }
        setProfileLoaded(true);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileLoaded(true);
      }
    };

    loadProfile();
  }, [user, profileLoaded, onChange, value]);

  const handleNameChange = (name: string) => {
    onChange({ ...value, name });
  };

  const handlePhoneChange = (phone: string) => {
    onChange({ ...value, phone });
  };

  const handleAddressChange = (address: AddressData) => {
    onChange({
      ...value,
      address,
      fullAddress: formatFullAddress(address),
    });
  };

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    onChange({ ...value, location });
  };

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Info Penerima</h4>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="checkout-name" className="text-xs text-muted-foreground">
              Nama Penerima
            </Label>
            <Input
              id="checkout-name"
              placeholder="Nama lengkap penerima"
              value={value.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
            {errors?.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone" className="text-xs text-muted-foreground">
              No. Telepon (WhatsApp)
            </Label>
            <PhoneInput
              value={value.phone}
              onChange={handlePhoneChange}
              placeholder="08xxxxxxxxxx"
            />
            {errors?.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Alamat Pengiriman</h4>
        </div>

        <AddressSelector
          value={value.address}
          onChange={handleAddressChange}
        />
        {errors?.address && (
          <p className="text-xs text-destructive">{errors.address}</p>
        )}
      </div>

      {/* Map Location Picker */}
      <div className="space-y-4">
        <LocationPicker
          value={value.location}
          onChange={handleLocationChange}
          merchantLocation={merchantLocation}
          onDistanceChange={onDistanceChange}
        />
        {errors?.location && (
          <p className="text-xs text-destructive">{errors.location}</p>
        )}
      </div>
    </div>
  );
}

export function createEmptyCheckoutAddress(): CheckoutAddressData {
  return {
    name: '',
    phone: '',
    address: createEmptyAddressData(),
    location: null,
    fullAddress: '',
  };
}

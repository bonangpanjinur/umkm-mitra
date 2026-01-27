import { useState, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  type Region,
} from '@/lib/addressApi';

interface AddressData {
  province: string;
  provinceName: string;
  city: string;
  cityName: string;
  district: string;
  districtName: string;
  village: string;
  villageName: string;
  detail: string;
}

interface AddressSelectorProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
}

export function AddressSelector({ value, onChange, disabled }: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      const data = await fetchProvinces();
      setProvinces(data);
      setLoadingProvinces(false);
    };
    loadProvinces();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    if (value.province) {
      const loadCities = async () => {
        setLoadingCities(true);
        const data = await fetchRegencies(value.province);
        setCities(data);
        setLoadingCities(false);
      };
      loadCities();
    } else {
      setCities([]);
    }
  }, [value.province]);

  // Load districts when city changes
  useEffect(() => {
    if (value.city) {
      const loadDistricts = async () => {
        setLoadingDistricts(true);
        const data = await fetchDistricts(value.city);
        setDistricts(data);
        setLoadingDistricts(false);
      };
      loadDistricts();
    } else {
      setDistricts([]);
    }
  }, [value.city]);

  // Load villages when district changes
  useEffect(() => {
    if (value.district) {
      const loadVillages = async () => {
        setLoadingVillages(true);
        const data = await fetchVillages(value.district);
        setVillages(data);
        setLoadingVillages(false);
      };
      loadVillages();
    } else {
      setVillages([]);
    }
  }, [value.district]);

  const handleProvinceChange = (provinceId: string) => {
    const province = provinces.find(p => p.id === provinceId);
    onChange({
      province: provinceId,
      provinceName: province?.name || '',
      city: '',
      cityName: '',
      district: '',
      districtName: '',
      village: '',
      villageName: '',
      detail: value.detail,
    });
  };

  const handleCityChange = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    onChange({
      ...value,
      city: cityId,
      cityName: city?.name || '',
      district: '',
      districtName: '',
      village: '',
      villageName: '',
    });
  };

  const handleDistrictChange = (districtId: string) => {
    const district = districts.find(d => d.id === districtId);
    onChange({
      ...value,
      district: districtId,
      districtName: district?.name || '',
      village: '',
      villageName: '',
    });
  };

  const handleVillageChange = (villageId: string) => {
    const village = villages.find(v => v.id === villageId);
    onChange({
      ...value,
      village: villageId,
      villageName: village?.name || '',
    });
  };

  const handleDetailChange = (detail: string) => {
    onChange({
      ...value,
      detail,
    });
  };

  return (
    <div className="space-y-3">
      {/* Province */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Provinsi</Label>
        <Select
          value={value.province}
          onValueChange={handleProvinceChange}
          disabled={disabled || loadingProvinces}
        >
          <SelectTrigger className="h-10">
            {loadingProvinces ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <SelectValue placeholder="Pilih Provinsi" />
            )}
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Kota/Kabupaten</Label>
        <Select
          value={value.city}
          onValueChange={handleCityChange}
          disabled={disabled || !value.province || loadingCities}
        >
          <SelectTrigger className="h-10">
            {loadingCities ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <SelectValue placeholder="Pilih Kota/Kabupaten" />
            )}
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* District */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Kecamatan</Label>
        <Select
          value={value.district}
          onValueChange={handleDistrictChange}
          disabled={disabled || !value.city || loadingDistricts}
        >
          <SelectTrigger className="h-10">
            {loadingDistricts ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <SelectValue placeholder="Pilih Kecamatan" />
            )}
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Village */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Kelurahan/Desa</Label>
        <Select
          value={value.village}
          onValueChange={handleVillageChange}
          disabled={disabled || !value.district || loadingVillages}
        >
          <SelectTrigger className="h-10">
            {loadingVillages ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <SelectValue placeholder="Pilih Kelurahan/Desa" />
            )}
          </SelectTrigger>
          <SelectContent>
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id}>
                {village.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detail Address */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Detail Alamat (RT/RW, Nama Jalan, dll)</Label>
        <Textarea
          value={value.detail}
          onChange={(e) => handleDetailChange(e.target.value)}
          placeholder="Contoh: Jl. Merdeka No. 10, RT 01/RW 02"
          className="min-h-[70px] resize-none"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// Helper function to format full address from AddressData
export function formatFullAddress(data: AddressData): string {
  const parts = [
    data.detail,
    data.villageName,
    data.districtName,
    data.cityName,
    data.provinceName,
  ].filter(Boolean);
  return parts.join(', ');
}

// Helper function to create empty AddressData
export function createEmptyAddressData(): AddressData {
  return {
    province: '',
    provinceName: '',
    city: '',
    cityName: '',
    district: '',
    districtName: '',
    village: '',
    villageName: '',
    detail: '',
  };
}

export type { AddressData };

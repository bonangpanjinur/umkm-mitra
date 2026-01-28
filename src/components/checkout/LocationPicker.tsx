import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateDistance } from '@/lib/codSecurity';
import { Skeleton } from '@/components/ui/skeleton';
import type { LatLng } from 'leaflet';

// Lazy load the map component to avoid SSR issues with react-leaflet
const LazyMapComponent = lazy(() => import('./LazyMap'));

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number }) => void;
  merchantLocation?: { lat: number; lng: number } | null;
  onDistanceChange?: (distanceKm: number) => void;
  disabled?: boolean;
}

function MapLoadingFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      <div className="text-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        <p className="text-xs text-muted-foreground">Memuat peta...</p>
      </div>
    </div>
  );
}

export function LocationPicker({
  value,
  onChange,
  merchantLocation,
  onDistanceChange,
  disabled,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  
  // Default to Indonesia center
  const defaultCenter: [number, number] = [-2.5489, 118.0149];
  const center: [number, number] = value 
    ? [value.lat, value.lng] 
    : defaultCenter;

  // Calculate distance when location changes
  useEffect(() => {
    if (value && merchantLocation && onDistanceChange) {
      const distance = calculateDistance(
        value.lat,
        value.lng,
        merchantLocation.lat,
        merchantLocation.lng
      );
      onDistanceChange(distance);
    }
  }, [value, merchantLocation, onDistanceChange]);

  const handleMapClick = useCallback((latlng: LatLng) => {
    if (disabled) return;
    onChange({ lat: latlng.lat, lng: latlng.lng });
  }, [disabled, onChange]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Titik Lokasi Pengiriman</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={loading || disabled}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-1" />
              Lokasi Saya
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="rounded-lg overflow-hidden border border-border h-[200px]">
        {mapError ? (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <div className="text-center space-y-2">
              <MapPin className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Gagal memuat peta</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMapError(false)}
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        ) : (
          <Suspense fallback={<MapLoadingFallback />}>
            <LazyMapComponent
              center={center}
              value={value}
              zoom={value ? 15 : 5}
              onMapClick={handleMapClick}
            />
          </Suspense>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Klik pada peta atau gunakan tombol "Lokasi Saya" untuk menentukan titik pengiriman
      </p>

      {value && (
        <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
          Koordinat: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

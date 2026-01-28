import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';

// Fix for default marker icon
import 'leaflet/dist/leaflet.css';

const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LazyMapProps {
  center: [number, number];
  value: { lat: number; lng: number } | null;
  zoom: number;
  onMapClick: (latlng: LatLng) => void;
}

// Component to handle map click events
function MapClickHandler({ onClick }: { onClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng);
    },
  });
  return null;
}

// Component to recenter map
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LazyMap({ center, value, zoom, onMapClick }: LazyMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={onMapClick} />
      {value && <MapRecenter center={[value.lat, value.lng]} />}
      {value && (
        <Marker position={[value.lat, value.lng]} icon={customIcon} />
      )}
    </MapContainer>
  );
}

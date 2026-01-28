// Wilayah.id API for Indonesian regions
// Source: https://wilayah.id/
// Uses multiple fallback strategies: Edge Function -> CORS Proxy -> Static Data

export interface Region {
  code: string;
  name: string;
}

interface WilayahResponse {
  data: Region[];
  meta?: {
    administrative_area_level: number;
    updated_at: string;
  };
}

// In-memory cache for API responses
const cache: Map<string, { data: Region[]; timestamp: number }> = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function getCacheKey(type: string, code?: string): string {
  return code ? `${type}-${code}` : type;
}

function getFromCache(key: string): Region[] | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: Region[]): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Static fallback data for provinces (in case all APIs fail)
const STATIC_PROVINCES: Region[] = [
  { code: "11", name: "Aceh" },
  { code: "12", name: "Sumatera Utara" },
  { code: "13", name: "Sumatera Barat" },
  { code: "14", name: "Riau" },
  { code: "15", name: "Jambi" },
  { code: "16", name: "Sumatera Selatan" },
  { code: "17", name: "Bengkulu" },
  { code: "18", name: "Lampung" },
  { code: "19", name: "Kepulauan Bangka Belitung" },
  { code: "21", name: "Kepulauan Riau" },
  { code: "31", name: "DKI Jakarta" },
  { code: "32", name: "Jawa Barat" },
  { code: "33", name: "Jawa Tengah" },
  { code: "34", name: "DI Yogyakarta" },
  { code: "35", name: "Jawa Timur" },
  { code: "36", name: "Banten" },
  { code: "51", name: "Bali" },
  { code: "52", name: "Nusa Tenggara Barat" },
  { code: "53", name: "Nusa Tenggara Timur" },
  { code: "61", name: "Kalimantan Barat" },
  { code: "62", name: "Kalimantan Tengah" },
  { code: "63", name: "Kalimantan Selatan" },
  { code: "64", name: "Kalimantan Timur" },
  { code: "65", name: "Kalimantan Utara" },
  { code: "71", name: "Sulawesi Utara" },
  { code: "72", name: "Sulawesi Tengah" },
  { code: "73", name: "Sulawesi Selatan" },
  { code: "74", name: "Sulawesi Tenggara" },
  { code: "75", name: "Gorontalo" },
  { code: "76", name: "Sulawesi Barat" },
  { code: "81", name: "Maluku" },
  { code: "82", name: "Maluku Utara" },
  { code: "91", name: "Papua" },
  { code: "92", name: "Papua Barat" },
  { code: "93", name: "Papua Selatan" },
  { code: "94", name: "Papua Tengah" },
  { code: "95", name: "Papua Pegunungan" },
  { code: "96", name: "Papua Barat Daya" },
];

const BASE_URL = 'https://wilayah.id/api';

// Try fetching directly first (some browsers/networks allow it)
async function fetchDirect(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return response;
    }
  } catch {
    // Silent fail, try next method
  }
  return null;
}

// Try using Edge Function proxy
async function fetchViaEdgeFunction(type: string, code?: string): Promise<Response | null> {
  try {
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!projectUrl || !anonKey) return null;
    
    const params = new URLSearchParams({ type });
    if (code) params.append('code', code);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${projectUrl}/functions/v1/wilayah-proxy?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return response;
    }
  } catch {
    // Silent fail
  }
  return null;
}

// Try using public CORS proxy (allorigins.win)
async function fetchViaCorsProxy(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return response;
    }
  } catch {
    // Silent fail
  }
  return null;
}

// Main fetch function with multiple fallbacks
async function fetchWithFallbacks(type: string, code?: string): Promise<Region[]> {
  let url: string;
  
  switch (type) {
    case 'provinces':
      url = `${BASE_URL}/provinces.json`;
      break;
    case 'regencies':
      url = `${BASE_URL}/regencies/${code}.json`;
      break;
    case 'districts':
      url = `${BASE_URL}/districts/${code}.json`;
      break;
    case 'villages':
      url = `${BASE_URL}/villages/${code}.json`;
      break;
    default:
      return [];
  }

  // Strategy 1: Try direct fetch
  let response = await fetchDirect(url);
  
  // Strategy 2: Try Edge Function
  if (!response) {
    response = await fetchViaEdgeFunction(type, code);
  }
  
  // Strategy 3: Try CORS proxy
  if (!response) {
    response = await fetchViaCorsProxy(url);
  }

  // If all strategies fail, use static data for provinces
  if (!response) {
    if (type === 'provinces') {
      console.log('Using static provinces data');
      return STATIC_PROVINCES;
    }
    throw new Error('All fetch strategies failed');
  }

  const result: WilayahResponse = await response.json();
  return result.data || [];
}

export async function fetchProvinces(): Promise<Region[]> {
  const cacheKey = getCacheKey('provinces');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithFallbacks('provinces');
    if (data.length > 0) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    // Return static fallback
    return STATIC_PROVINCES;
  }
}

export async function fetchRegencies(provinceCode: string): Promise<Region[]> {
  if (!provinceCode) return [];
  
  const cacheKey = getCacheKey('regencies', provinceCode);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithFallbacks('regencies', provinceCode);
    if (data.length > 0) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching regencies:', error);
    return [];
  }
}

export async function fetchDistricts(regencyCode: string): Promise<Region[]> {
  if (!regencyCode) return [];
  
  const cacheKey = getCacheKey('districts', regencyCode);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithFallbacks('districts', regencyCode);
    if (data.length > 0) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
}

export async function fetchVillages(districtCode: string): Promise<Region[]> {
  if (!districtCode) return [];
  
  const cacheKey = getCacheKey('villages', districtCode);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithFallbacks('villages', districtCode);
    if (data.length > 0) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching villages:', error);
    return [];
  }
}

// Helper to pre-load all levels at once (for editing existing addresses)
export async function preloadAddressChain(
  provinceCode: string,
  cityCode: string,
  districtCode: string
): Promise<{
  provinces: Region[];
  cities: Region[];
  districts: Region[];
  villages: Region[];
}> {
  const [provinces, cities, districts, villages] = await Promise.all([
    fetchProvinces(),
    provinceCode ? fetchRegencies(provinceCode) : Promise.resolve([]),
    cityCode ? fetchDistricts(cityCode) : Promise.resolve([]),
    districtCode ? fetchVillages(districtCode) : Promise.resolve([]),
  ]);

  return { provinces, cities, districts, villages };
}

// Clear the cache (useful for testing or forced refresh)
export function clearAddressCache(): void {
  cache.clear();
}

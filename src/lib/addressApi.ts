// Wilayah.id API for Indonesian regions
// Source: https://wilayah.id/

const BASE_URL = 'https://wilayah.id/api';

export interface Region {
  code: string;
  name: string;
}

interface WilayahResponse {
  data: Region[];
  meta: {
    administrative_area_level: number;
    updated_at: string;
  };
}

// In-memory cache for API responses
const cache: Map<string, { data: Region[]; timestamp: number }> = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

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

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error');
      
      // Wait before retrying (exponential backoff)
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
      }
    }
  }
  
  throw lastError;
}

export async function fetchProvinces(): Promise<Region[]> {
  const cacheKey = getCacheKey('provinces');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(`${BASE_URL}/provinces.json`);
    const result: WilayahResponse = await response.json();
    const data = result.data || [];
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
}

export async function fetchRegencies(provinceCode: string): Promise<Region[]> {
  if (!provinceCode) return [];
  
  const cacheKey = getCacheKey('regencies', provinceCode);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry(`${BASE_URL}/regencies/${provinceCode}.json`);
    const result: WilayahResponse = await response.json();
    const data = result.data || [];
    setCache(cacheKey, data);
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
    const response = await fetchWithRetry(`${BASE_URL}/districts/${regencyCode}.json`);
    const result: WilayahResponse = await response.json();
    const data = result.data || [];
    setCache(cacheKey, data);
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
    const response = await fetchWithRetry(`${BASE_URL}/villages/${districtCode}.json`);
    const result: WilayahResponse = await response.json();
    const data = result.data || [];
    setCache(cacheKey, data);
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

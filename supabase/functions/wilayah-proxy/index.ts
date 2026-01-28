import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://wilayah.id/api';

// In-memory cache with TTL
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours - data rarely changes

function getCached(key: string): unknown | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DesaApp/1.0',
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // provinces, regencies, districts, villages
    const code = url.searchParams.get('code'); // parent code for sub-regions

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Missing type parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let apiUrl: string;
    let cacheKey: string;

    switch (type) {
      case 'provinces':
        apiUrl = `${BASE_URL}/provinces.json`;
        cacheKey = 'provinces';
        break;
      case 'regencies':
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Missing code parameter for regencies' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        apiUrl = `${BASE_URL}/regencies/${code}.json`;
        cacheKey = `regencies-${code}`;
        break;
      case 'districts':
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Missing code parameter for districts' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        apiUrl = `${BASE_URL}/districts/${code}.json`;
        cacheKey = `districts-${code}`;
        break;
      case 'villages':
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Missing code parameter for villages' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        apiUrl = `${BASE_URL}/villages/${code}.json`;
        cacheKey = `villages-${code}`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(
        JSON.stringify(cached),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    console.log(`Fetching from API: ${apiUrl}`);
    const response = await fetchWithRetry(apiUrl);
    const data = await response.json();

    // Cache the response
    setCache(cacheKey, data);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
    );
  } catch (error) {
    console.error('Error in wilayah-proxy:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

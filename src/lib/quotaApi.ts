import { supabase } from '@/integrations/supabase/client';

// Since quota_tiers table doesn't exist, we use a simple fixed cost model
export interface QuotaTier {
  id: string;
  min_price: number;
  max_price: number | null;
  credit_cost: number;
}

// Default tiers stored in memory (since table doesn't exist yet)
const DEFAULT_TIERS: QuotaTier[] = [
  { id: '1', min_price: 0, max_price: 10000, credit_cost: 1 },
  { id: '2', min_price: 10001, max_price: 50000, credit_cost: 2 },
  { id: '3', min_price: 50001, max_price: 100000, credit_cost: 3 },
  { id: '4', min_price: 100001, max_price: null, credit_cost: 5 },
];

export async function fetchQuotaTiers(): Promise<QuotaTier[]> {
  // Return default tiers since quota_tiers table doesn't exist
  return DEFAULT_TIERS;
}

export function calculateCreditCost(price: number, tiers: QuotaTier[]): number {
  const tier = tiers.find(t => 
    price >= t.min_price && (t.max_price === null || price <= t.max_price)
  );
  return tier ? tier.credit_cost : 1; // Default to 1 if no tier matches
}

export async function calculateOrderCreditCost(items: { price: number; quantity: number }[]): Promise<number> {
  const tiers = await fetchQuotaTiers();
  return items.reduce((total, item) => {
    return total + (calculateCreditCost(item.price, tiers) * item.quantity);
  }, 0);
}

export async function useMerchantQuotaCredits(merchantId: string, credits: number): Promise<boolean> {
  try {
    // Use the existing use_merchant_quota function instead of v2
    const { data, error } = await supabase.rpc('use_merchant_quota', {
      p_merchant_id: merchantId,
      p_credits: credits
    });

    if (error) {
      console.error('Error using merchant quota credits:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error using merchant quota credits:', error);
    return false;
  }
}

// Client-side rate limiting utility
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${identifier}:${action}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }
  
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

// Rate limit configurations for different actions
export const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
  register: { maxRequests: 3, windowMs: 600000 }, // 3 attempts per 10 minutes
  checkout: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  addToCart: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
  search: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  review: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
  voucherApply: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
};

// Hook for using rate limiting in components
export function useRateLimit(action: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[action];
  
  const checkLimit = (identifier: string = 'anonymous') => {
    return checkRateLimit(identifier, action, config);
  };
  
  return { checkLimit };
}

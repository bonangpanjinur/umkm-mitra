
-- Insert free quota setting for new merchants (admin-configurable)
INSERT INTO app_settings (key, value, category, description)
VALUES (
  'free_quota_new_merchant',
  '{"enabled": true, "free_credits": 10, "validity_days": 30}'::jsonb,
  'quota',
  'Pengaturan kuota gratis untuk merchant pendaftar baru'
)
ON CONFLICT (key) DO NOTHING;

-- Create function to auto-grant free quota when merchant is approved
CREATE OR REPLACE FUNCTION public.auto_grant_free_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_settings JSONB;
  v_enabled BOOLEAN;
  v_free_credits INTEGER;
  v_validity_days INTEGER;
  v_existing_sub INTEGER;
  v_default_package_id UUID;
BEGIN
  -- Only trigger when status changes to APPROVED
  IF NEW.registration_status = 'APPROVED' AND 
     (OLD.registration_status IS NULL OR OLD.registration_status != 'APPROVED') THEN
    
    -- Get free quota settings
    SELECT value INTO v_settings FROM app_settings WHERE key = 'free_quota_new_merchant';
    
    IF v_settings IS NULL THEN
      RETURN NEW;
    END IF;
    
    v_enabled := COALESCE((v_settings->>'enabled')::BOOLEAN, false);
    v_free_credits := COALESCE((v_settings->>'free_credits')::INTEGER, 10);
    v_validity_days := COALESCE((v_settings->>'validity_days')::INTEGER, 30);
    
    IF NOT v_enabled OR v_free_credits <= 0 THEN
      RETURN NEW;
    END IF;
    
    -- Check if merchant already has a subscription
    SELECT COUNT(*) INTO v_existing_sub
    FROM merchant_subscriptions
    WHERE merchant_id = NEW.id AND status = 'ACTIVE';
    
    IF v_existing_sub > 0 THEN
      RETURN NEW;
    END IF;
    
    -- Get first available package (or use any package id)
    SELECT id INTO v_default_package_id FROM transaction_packages LIMIT 1;
    
    IF v_default_package_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Create free subscription
    INSERT INTO merchant_subscriptions (
      merchant_id,
      package_id,
      transaction_quota,
      used_quota,
      payment_amount,
      payment_status,
      status,
      started_at,
      expired_at
    ) VALUES (
      NEW.id,
      v_default_package_id,
      v_free_credits,
      0,
      0,
      'PAID',
      'ACTIVE',
      now(),
      now() + (v_validity_days || ' days')::interval
    );
    
    -- Notify merchant about free quota
    IF NEW.user_id IS NOT NULL THEN
      PERFORM send_notification(
        NEW.user_id,
        'Kuota Gratis Diberikan!',
        'Selamat! Anda mendapatkan ' || v_free_credits || ' kuota transaksi gratis selama ' || v_validity_days || ' hari.',
        'success',
        '/merchant/subscription'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_grant_free_quota ON merchants;
CREATE TRIGGER trigger_auto_grant_free_quota
  AFTER UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_free_quota();

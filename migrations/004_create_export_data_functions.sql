-- Migration: Create Supabase database functions for export data operations
-- Created: 2025-01-22

-- Function to get export opportunities with compliance status
CREATE OR REPLACE FUNCTION get_export_opportunities(
  p_user_id UUID DEFAULT NULL,
  p_market TEXT DEFAULT NULL,
  p_product TEXT DEFAULT NULL,
  p_compliance_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  market TEXT,
  product TEXT,
  estimated_value DECIMAL,
  compliance_status TEXT,
  market_score INTEGER,
  tags TEXT[],
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  user_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eo.id,
    eo.title,
    eo.description,
    eo.market,
    eo.product,
    eo.estimated_value,
    eo.compliance_status,
    eo.market_score,
    eo.tags,
    eo.created_at,
    eo.expires_at,
    eo.user_id
  FROM export_opportunities eo
  WHERE 
    (p_user_id IS NULL OR eo.user_id = p_user_id)
    AND (p_market IS NULL OR eo.market ILIKE '%' || p_market || '%')
    AND (p_product IS NULL OR eo.product ILIKE '%' || p_product || '%')
    AND (p_compliance_status IS NULL OR eo.compliance_status = p_compliance_status)
    AND (eo.expires_at IS NULL OR eo.expires_at > NOW())
  ORDER BY eo.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to create or update export opportunity
CREATE OR REPLACE FUNCTION upsert_export_opportunity(
  p_id UUID DEFAULT NULL,
  p_title TEXT,
  p_description TEXT,
  p_market TEXT,
  p_product TEXT,
  p_estimated_value DECIMAL,
  p_compliance_status TEXT DEFAULT 'pending',
  p_market_score INTEGER DEFAULT 0,
  p_tags TEXT[] DEFAULT '{}',
  p_expires_at TIMESTAMP DEFAULT NULL,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opportunity_id UUID;
BEGIN
  -- Validate compliance status
  IF p_compliance_status NOT IN ('compliant', 'requires_license', 'restricted', 'pending') THEN
    RAISE EXCEPTION 'Invalid compliance status: %', p_compliance_status;
  END IF;

  -- Validate market score
  IF p_market_score < 0 OR p_market_score > 100 THEN
    RAISE EXCEPTION 'Market score must be between 0 and 100';
  END IF;

  -- Insert or update opportunity
  INSERT INTO export_opportunities (
    id, title, description, market, product, estimated_value,
    compliance_status, market_score, tags, expires_at, user_id,
    created_at, updated_at
  )
  VALUES (
    COALESCE(p_id, gen_random_uuid()),
    p_title, p_description, p_market, p_product, p_estimated_value,
    p_compliance_status, p_market_score, p_tags, p_expires_at, p_user_id,
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    market = EXCLUDED.market,
    product = EXCLUDED.product,
    estimated_value = EXCLUDED.estimated_value,
    compliance_status = EXCLUDED.compliance_status,
    market_score = EXCLUDED.market_score,
    tags = EXCLUDED.tags,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW()
  RETURNING id INTO v_opportunity_id;

  -- Log the operation
  INSERT INTO audit_logs (user_id, action, resource, resource_id, status, timestamp)
  VALUES (p_user_id, 'upsert_opportunity', 'export_opportunities', v_opportunity_id::TEXT, 'success', NOW());

  RETURN v_opportunity_id;
END;
$$;

-- Function to perform compliance screening
CREATE OR REPLACE FUNCTION perform_compliance_screening(
  p_party_name TEXT,
  p_destination_country TEXT,
  p_product_code TEXT DEFAULT NULL,
  p_user_id UUID
)
RETURNS TABLE (
  screening_id UUID,
  status TEXT,
  risk_level TEXT,
  restrictions JSONB,
  recommendations TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_screening_id UUID;
  v_status TEXT := 'clear';
  v_risk_level TEXT := 'low';
  v_restrictions JSONB := '{}';
  v_recommendations TEXT[] := '{}';
BEGIN
  -- Generate screening ID
  v_screening_id := gen_random_uuid();

  -- Check denied parties list (simplified logic)
  IF EXISTS (
    SELECT 1 FROM denied_parties 
    WHERE party_name ILIKE '%' || p_party_name || '%'
  ) THEN
    v_status := 'blocked';
    v_risk_level := 'high';
    v_restrictions := jsonb_build_object(
      'type', 'denied_party',
      'list_name', 'Denied Persons List',
      'reason', 'Party appears on restricted list'
    );
    v_recommendations := ARRAY['Contact compliance team immediately', 'Do not proceed with transaction'];
  END IF;

  -- Check destination restrictions
  IF EXISTS (
    SELECT 1 FROM restricted_destinations 
    WHERE country_code = p_destination_country 
    AND status = 'prohibited'
  ) THEN
    v_status := 'blocked';
    v_risk_level := 'high';
    v_restrictions := jsonb_build_object(
      'type', 'prohibited_destination',
      'country', p_destination_country,
      'reason', 'Destination is under sanctions'
    );
    v_recommendations := array_append(v_recommendations, 'Review current sanctions list');
  END IF;

  -- Check product controls
  IF p_product_code IS NOT NULL AND EXISTS (
    SELECT 1 FROM controlled_products 
    WHERE product_code = p_product_code 
    AND requires_license = true
  ) THEN
    IF v_status = 'clear' THEN
      v_status := 'license_required';
      v_risk_level := 'medium';
    END IF;
    v_restrictions := jsonb_build_object(
      'type', 'license_required',
      'product_code', p_product_code,
      'reason', 'Product requires export license'
    );
    v_recommendations := array_append(v_recommendations, 'Obtain appropriate export license');
  END IF;

  -- Store screening result
  INSERT INTO compliance_screenings (
    id, party_name, destination_country, product_code, status, risk_level,
    restrictions, recommendations, user_id, created_at
  )
  VALUES (
    v_screening_id, p_party_name, p_destination_country, p_product_code,
    v_status, v_risk_level, v_restrictions, v_recommendations, p_user_id, NOW()
  );

  -- Log the screening
  INSERT INTO audit_logs (user_id, action, resource, resource_id, status, timestamp)
  VALUES (p_user_id, 'compliance_screening', 'compliance_screenings', v_screening_id::TEXT, 'success', NOW());

  RETURN QUERY
  SELECT v_screening_id, v_status, v_risk_level, v_restrictions, v_recommendations;
END;
$$;

-- Function to get market analysis data
CREATE OR REPLACE FUNCTION get_market_analysis(
  p_market TEXT,
  p_product TEXT DEFAULT NULL,
  p_time_period INTEGER DEFAULT 12 -- months
)
RETURNS TABLE (
  market TEXT,
  product TEXT,
  trade_volume DECIMAL,
  growth_rate DECIMAL,
  market_share DECIMAL,
  tariff_rate DECIMAL,
  competition_level TEXT,
  opportunity_score INTEGER,
  trends JSONB,
  last_updated TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.market,
    ma.product,
    ma.trade_volume,
    ma.growth_rate,
    ma.market_share,
    ma.tariff_rate,
    ma.competition_level,
    ma.opportunity_score,
    ma.trends,
    ma.last_updated
  FROM market_analysis ma
  WHERE 
    ma.market ILIKE '%' || p_market || '%'
    AND (p_product IS NULL OR ma.product ILIKE '%' || p_product || '%')
    AND ma.last_updated >= NOW() - INTERVAL '1 month' * p_time_period
  ORDER BY ma.opportunity_score DESC, ma.last_updated DESC;
END;
$$;

-- Function to sync export data (for offline/online scenarios)
CREATE OR REPLACE FUNCTION sync_export_data(
  p_user_id UUID,
  p_last_sync_timestamp TIMESTAMP DEFAULT NULL,
  p_data_types TEXT[] DEFAULT ARRAY['opportunities', 'screenings', 'market_data']
)
RETURNS TABLE (
  data_type TEXT,
  operation TEXT,
  record_id UUID,
  data JSONB,
  timestamp TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sync_timestamp TIMESTAMP := COALESCE(p_last_sync_timestamp, NOW() - INTERVAL '7 days');
BEGIN
  -- Sync export opportunities
  IF 'opportunities' = ANY(p_data_types) THEN
    RETURN QUERY
    SELECT 
      'opportunities'::TEXT,
      CASE 
        WHEN eo.created_at > v_sync_timestamp AND eo.updated_at = eo.created_at THEN 'create'
        WHEN eo.updated_at > v_sync_timestamp THEN 'update'
        ELSE 'sync'
      END,
      eo.id,
      to_jsonb(eo.*),
      eo.updated_at
    FROM export_opportunities eo
    WHERE eo.user_id = p_user_id
      AND (eo.created_at > v_sync_timestamp OR eo.updated_at > v_sync_timestamp);
  END IF;

  -- Sync compliance screenings
  IF 'screenings' = ANY(p_data_types) THEN
    RETURN QUERY
    SELECT 
      'screenings'::TEXT,
      'sync'::TEXT,
      cs.id,
      to_jsonb(cs.*),
      cs.created_at
    FROM compliance_screenings cs
    WHERE cs.user_id = p_user_id
      AND cs.created_at > v_sync_timestamp;
  END IF;

  -- Sync market data
  IF 'market_data' = ANY(p_data_types) THEN
    RETURN QUERY
    SELECT 
      'market_data'::TEXT,
      'sync'::TEXT,
      ma.id,
      to_jsonb(ma.*),
      ma.last_updated
    FROM market_analysis ma
    WHERE ma.last_updated > v_sync_timestamp;
  END IF;

  -- Update user's last sync timestamp
  UPDATE users 
  SET last_sync_at = NOW() 
  WHERE id = p_user_id;
END;
$$;

-- Function to backup critical export data
CREATE OR REPLACE FUNCTION backup_export_data(
  p_user_id UUID DEFAULT NULL,
  p_backup_type TEXT DEFAULT 'incremental' -- 'full' or 'incremental'
)
RETURNS TABLE (
  backup_id UUID,
  backup_type TEXT,
  data_size BIGINT,
  records_count INTEGER,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_backup_id UUID;
  v_data_size BIGINT := 0;
  v_records_count INTEGER := 0;
  v_backup_data JSONB;
  v_last_backup TIMESTAMP;
BEGIN
  -- Generate backup ID
  v_backup_id := gen_random_uuid();

  -- Get last backup timestamp for incremental backups
  IF p_backup_type = 'incremental' THEN
    SELECT MAX(created_at) INTO v_last_backup
    FROM data_backups
    WHERE user_id = p_user_id OR user_id IS NULL;
  END IF;

  -- Collect data for backup
  WITH backup_data AS (
    SELECT 
      'export_opportunities' as table_name,
      to_jsonb(array_agg(eo.*)) as data
    FROM export_opportunities eo
    WHERE (p_user_id IS NULL OR eo.user_id = p_user_id)
      AND (p_backup_type = 'full' OR eo.updated_at > COALESCE(v_last_backup, '1970-01-01'))
    
    UNION ALL
    
    SELECT 
      'compliance_screenings' as table_name,
      to_jsonb(array_agg(cs.*)) as data
    FROM compliance_screenings cs
    WHERE (p_user_id IS NULL OR cs.user_id = p_user_id)
      AND (p_backup_type = 'full' OR cs.created_at > COALESCE(v_last_backup, '1970-01-01'))
    
    UNION ALL
    
    SELECT 
      'market_analysis' as table_name,
      to_jsonb(array_agg(ma.*)) as data
    FROM market_analysis ma
    WHERE (p_backup_type = 'full' OR ma.last_updated > COALESCE(v_last_backup, '1970-01-01'))
  )
  SELECT jsonb_object_agg(table_name, data) INTO v_backup_data
  FROM backup_data;

  -- Calculate backup size and record count
  v_data_size := length(v_backup_data::TEXT);
  
  SELECT 
    COALESCE(
      (v_backup_data->'export_opportunities'->0->>'id' IS NOT NULL)::INTEGER * 
      jsonb_array_length(v_backup_data->'export_opportunities'), 0
    ) +
    COALESCE(
      (v_backup_data->'compliance_screenings'->0->>'id' IS NOT NULL)::INTEGER * 
      jsonb_array_length(v_backup_data->'compliance_screenings'), 0
    ) +
    COALESCE(
      (v_backup_data->'market_analysis'->0->>'id' IS NOT NULL)::INTEGER * 
      jsonb_array_length(v_backup_data->'market_analysis'), 0
    )
  INTO v_records_count;

  -- Store backup
  INSERT INTO data_backups (
    id, user_id, backup_type, data_size, records_count, backup_data, created_at
  )
  VALUES (
    v_backup_id, p_user_id, p_backup_type, v_data_size, v_records_count, v_backup_data, NOW()
  );

  -- Log backup operation
  INSERT INTO audit_logs (
    user_id, action, resource, resource_id, status, 
    details, timestamp
  )
  VALUES (
    p_user_id, 'data_backup', 'data_backups', v_backup_id::TEXT, 'success',
    jsonb_build_object('backup_type', p_backup_type, 'records_count', v_records_count),
    NOW()
  );

  RETURN QUERY
  SELECT v_backup_id, p_backup_type, v_data_size, v_records_count, NOW();
END;
$$;

-- Function to restore export data from backup
CREATE OR REPLACE FUNCTION restore_export_data(
  p_backup_id UUID,
  p_user_id UUID,
  p_restore_options JSONB DEFAULT '{}'
)
RETURNS TABLE (
  restored_table TEXT,
  records_restored INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_backup_data JSONB;
  v_restore_count INTEGER;
  v_table_name TEXT;
  v_table_data JSONB;
BEGIN
  -- Get backup data
  SELECT backup_data INTO v_backup_data
  FROM data_backups
  WHERE id = p_backup_id
    AND (user_id = p_user_id OR user_id IS NULL);

  IF v_backup_data IS NULL THEN
    RAISE EXCEPTION 'Backup not found or access denied';
  END IF;

  -- Restore export opportunities
  IF v_backup_data ? 'export_opportunities' THEN
    v_table_data := v_backup_data->'export_opportunities';
    
    INSERT INTO export_opportunities 
    SELECT * FROM jsonb_populate_recordset(null::export_opportunities, v_table_data)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      market = EXCLUDED.market,
      product = EXCLUDED.product,
      estimated_value = EXCLUDED.estimated_value,
      compliance_status = EXCLUDED.compliance_status,
      market_score = EXCLUDED.market_score,
      tags = EXCLUDED.tags,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW();
    
    GET DIAGNOSTICS v_restore_count = ROW_COUNT;
    RETURN QUERY SELECT 'export_opportunities'::TEXT, v_restore_count, 'success'::TEXT;
  END IF;

  -- Restore compliance screenings
  IF v_backup_data ? 'compliance_screenings' THEN
    v_table_data := v_backup_data->'compliance_screenings';
    
    INSERT INTO compliance_screenings 
    SELECT * FROM jsonb_populate_recordset(null::compliance_screenings, v_table_data)
    ON CONFLICT (id) DO NOTHING;
    
    GET DIAGNOSTICS v_restore_count = ROW_COUNT;
    RETURN QUERY SELECT 'compliance_screenings'::TEXT, v_restore_count, 'success'::TEXT;
  END IF;

  -- Log restore operation
  INSERT INTO audit_logs (
    user_id, action, resource, resource_id, status, timestamp
  )
  VALUES (
    p_user_id, 'data_restore', 'data_backups', p_backup_id::TEXT, 'success', NOW()
  );
END;
$$;

-- Create tables for new functionality if they don't exist
CREATE TABLE IF NOT EXISTS export_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  market TEXT NOT NULL,
  product TEXT NOT NULL,
  estimated_value DECIMAL(15,2),
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('compliant', 'requires_license', 'restricted', 'pending')),
  market_score INTEGER DEFAULT 0 CHECK (market_score >= 0 AND market_score <= 100),
  tags TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_name TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  product_code TEXT,
  status TEXT NOT NULL CHECK (status IN ('clear', 'blocked', 'license_required', 'pending')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  restrictions JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market TEXT NOT NULL,
  product TEXT NOT NULL,
  trade_volume DECIMAL(15,2),
  growth_rate DECIMAL(5,2),
  market_share DECIMAL(5,2),
  tariff_rate DECIMAL(5,2),
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  trends JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental')),
  data_size BIGINT NOT NULL,
  records_count INTEGER NOT NULL,
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS denied_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_name TEXT NOT NULL,
  list_name TEXT NOT NULL,
  reason TEXT,
  added_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'removed'))
);

CREATE TABLE IF NOT EXISTS restricted_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prohibited', 'restricted', 'license_required')),
  reason TEXT,
  effective_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS controlled_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  control_list TEXT,
  requires_license BOOLEAN DEFAULT false,
  license_exception TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_export_opportunities_user_id ON export_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_market ON export_opportunities(market);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_compliance_status ON export_opportunities(compliance_status);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_expires_at ON export_opportunities(expires_at);

CREATE INDEX IF NOT EXISTS idx_compliance_screenings_user_id ON compliance_screenings(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_screenings_status ON compliance_screenings(status);
CREATE INDEX IF NOT EXISTS idx_compliance_screenings_created_at ON compliance_screenings(created_at);

CREATE INDEX IF NOT EXISTS idx_market_analysis_market ON market_analysis(market);
CREATE INDEX IF NOT EXISTS idx_market_analysis_product ON market_analysis(product);
CREATE INDEX IF NOT EXISTS idx_market_analysis_last_updated ON market_analysis(last_updated);

CREATE INDEX IF NOT EXISTS idx_data_backups_user_id ON data_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_data_backups_created_at ON data_backups(created_at);

CREATE INDEX IF NOT EXISTS idx_denied_parties_party_name ON denied_parties USING gin(to_tsvector('english', party_name));
CREATE INDEX IF NOT EXISTS idx_restricted_destinations_country_code ON restricted_destinations(country_code);
CREATE INDEX IF NOT EXISTS idx_controlled_products_product_code ON controlled_products(product_code);

-- Add last_sync_at column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_sync_at') THEN
    ALTER TABLE users ADD COLUMN last_sync_at TIMESTAMP;
  END IF;
END $$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_export_opportunities_updated_at ON export_opportunities;
CREATE TRIGGER update_export_opportunities_updated_at
    BEFORE UPDATE ON export_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_export_opportunities TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_export_opportunity TO authenticated;
GRANT EXECUTE ON FUNCTION perform_compliance_screening TO authenticated;
GRANT EXECUTE ON FUNCTION get_market_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION sync_export_data TO authenticated;
GRANT EXECUTE ON FUNCTION backup_export_data TO authenticated;
GRANT EXECUTE ON FUNCTION restore_export_data TO authenticated;
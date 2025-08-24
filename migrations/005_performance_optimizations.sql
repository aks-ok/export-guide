-- Migration: Performance optimizations and indexing
-- Created: 2025-01-22

-- Add performance indexes for frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_opportunities_market_product 
ON export_opportunities(market, product);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_opportunities_compliance_status_score 
ON export_opportunities(compliance_status, market_score DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_opportunities_user_created 
ON export_opportunities(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_export_opportunities_expires_at_active 
ON export_opportunities(expires_at) WHERE expires_at > NOW();

-- Compliance screenings indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_screenings_party_country 
ON compliance_screenings(party_name, destination_country);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_screenings_status_risk 
ON compliance_screenings(status, risk_level);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_screenings_user_created 
ON compliance_screenings(user_id, created_at DESC);

-- Market analysis indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_analysis_market_product_updated 
ON market_analysis(market, product, last_updated DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_analysis_opportunity_score 
ON market_analysis(opportunity_score DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_analysis_updated_recent 
ON market_analysis(last_updated) WHERE last_updated > NOW() - INTERVAL '7 days';

-- Audit logs indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
ON audit_logs(user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_timestamp 
ON audit_logs(resource, timestamp DESC);

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status 
ON users(role, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login 
ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_search 
ON export_opportunities USING gin(to_tsvector('english', title || ' ' || description || ' ' || market || ' ' || product));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_search 
ON compliance_screenings USING gin(to_tsvector('english', party_name || ' ' || destination_country));

-- Partial indexes for active data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_active_high_score 
ON export_opportunities(market_score DESC, created_at DESC) 
WHERE compliance_status = 'compliant' AND market_score >= 70;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_screenings_recent_blocked 
ON compliance_screenings(created_at DESC) 
WHERE status = 'blocked' AND created_at > NOW() - INTERVAL '30 days';

-- Create materialized view for dashboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics AS
SELECT 
  COUNT(*) FILTER (WHERE compliance_status = 'compliant') as compliant_opportunities,
  COUNT(*) FILTER (WHERE compliance_status = 'requires_license') as license_required_opportunities,
  COUNT(*) FILTER (WHERE compliance_status = 'restricted') as restricted_opportunities,
  AVG(market_score) as avg_market_score,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_opportunities,
  SUM(estimated_value) FILTER (WHERE compliance_status = 'compliant') as total_compliant_value,
  NOW() as last_updated
FROM export_opportunities
WHERE expires_at IS NULL OR expires_at > NOW();

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metrics_unique ON dashboard_metrics(last_updated);

-- Create materialized view for compliance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS compliance_metrics AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'clear') as clear_screenings,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_screenings,
  COUNT(*) FILTER (WHERE status = 'license_required') as license_required_screenings,
  COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_screenings,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_screenings,
  AVG(CASE WHEN status = 'clear' THEN 1 ELSE 0 END) * 100 as clearance_rate,
  NOW() as last_updated
FROM compliance_screenings;

-- Create unique index on compliance metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_metrics_unique ON compliance_metrics(last_updated);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
AS $
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY compliance_metrics;
END;
$;

-- Create function for efficient opportunity search
CREATE OR REPLACE FUNCTION search_export_opportunities(
  p_search_query TEXT DEFAULT NULL,
  p_market TEXT DEFAULT NULL,
  p_product TEXT DEFAULT NULL,
  p_compliance_status TEXT DEFAULT NULL,
  p_min_score INTEGER DEFAULT NULL,
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
  relevance_score REAL
) 
LANGUAGE plpgsql
AS $
DECLARE
  search_vector tsvector;
BEGIN
  -- Build search vector if search query provided
  IF p_search_query IS NOT NULL THEN
    search_vector := to_tsquery('english', 
      regexp_replace(trim(p_search_query), '\s+', ' & ', 'g') || ':*'
    );
  END IF;

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
    CASE 
      WHEN p_search_query IS NOT NULL THEN
        ts_rank(to_tsvector('english', eo.title || ' ' || eo.description || ' ' || eo.market || ' ' || eo.product), search_vector)
      ELSE 0.0
    END as relevance_score
  FROM export_opportunities eo
  WHERE 
    (p_search_query IS NULL OR to_tsvector('english', eo.title || ' ' || eo.description || ' ' || eo.market || ' ' || eo.product) @@ search_vector)
    AND (p_market IS NULL OR eo.market ILIKE '%' || p_market || '%')
    AND (p_product IS NULL OR eo.product ILIKE '%' || p_product || '%')
    AND (p_compliance_status IS NULL OR eo.compliance_status = p_compliance_status)
    AND (p_min_score IS NULL OR eo.market_score >= p_min_score)
    AND (eo.expires_at IS NULL OR eo.expires_at > NOW())
  ORDER BY 
    CASE WHEN p_search_query IS NOT NULL THEN relevance_score ELSE 0 END DESC,
    eo.market_score DESC,
    eo.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$;

-- Create function for efficient compliance screening search
CREATE OR REPLACE FUNCTION search_compliance_screenings(
  p_search_query TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_risk_level TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  party_name TEXT,
  destination_country TEXT,
  product_code TEXT,
  status TEXT,
  risk_level TEXT,
  created_at TIMESTAMP,
  relevance_score REAL
) 
LANGUAGE plpgsql
AS $
DECLARE
  search_vector tsvector;
  date_threshold TIMESTAMP;
BEGIN
  -- Build search vector if search query provided
  IF p_search_query IS NOT NULL THEN
    search_vector := to_tsquery('english', 
      regexp_replace(trim(p_search_query), '\s+', ' & ', 'g') || ':*'
    );
  END IF;

  date_threshold := NOW() - INTERVAL '1 day' * p_days_back;

  RETURN QUERY
  SELECT 
    cs.id,
    cs.party_name,
    cs.destination_country,
    cs.product_code,
    cs.status,
    cs.risk_level,
    cs.created_at,
    CASE 
      WHEN p_search_query IS NOT NULL THEN
        ts_rank(to_tsvector('english', cs.party_name || ' ' || cs.destination_country), search_vector)
      ELSE 0.0
    END as relevance_score
  FROM compliance_screenings cs
  WHERE 
    (p_search_query IS NULL OR to_tsvector('english', cs.party_name || ' ' || cs.destination_country) @@ search_vector)
    AND (p_status IS NULL OR cs.status = p_status)
    AND (p_risk_level IS NULL OR cs.risk_level = p_risk_level)
    AND (p_user_id IS NULL OR cs.user_id = p_user_id)
    AND cs.created_at >= date_threshold
  ORDER BY 
    CASE WHEN p_search_query IS NOT NULL THEN relevance_score ELSE 0 END DESC,
    cs.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$;

-- Create function to get aggregated market data
CREATE OR REPLACE FUNCTION get_market_summary(
  p_market TEXT DEFAULT NULL,
  p_time_period INTEGER DEFAULT 12
)
RETURNS TABLE (
  market TEXT,
  total_opportunities INTEGER,
  avg_market_score DECIMAL,
  total_estimated_value DECIMAL,
  compliance_rate DECIMAL,
  growth_trend TEXT
) 
LANGUAGE plpgsql
AS $
DECLARE
  date_threshold TIMESTAMP;
BEGIN
  date_threshold := NOW() - INTERVAL '1 month' * p_time_period;

  RETURN QUERY
  SELECT 
    eo.market,
    COUNT(*)::INTEGER as total_opportunities,
    AVG(eo.market_score) as avg_market_score,
    SUM(eo.estimated_value) as total_estimated_value,
    (COUNT(*) FILTER (WHERE eo.compliance_status = 'compliant')::DECIMAL / COUNT(*) * 100) as compliance_rate,
    CASE 
      WHEN COUNT(*) FILTER (WHERE eo.created_at > NOW() - INTERVAL '30 days') > 
           COUNT(*) FILTER (WHERE eo.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days')
      THEN 'increasing'
      WHEN COUNT(*) FILTER (WHERE eo.created_at > NOW() - INTERVAL '30 days') < 
           COUNT(*) FILTER (WHERE eo.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days')
      THEN 'decreasing'
      ELSE 'stable'
    END as growth_trend
  FROM export_opportunities eo
  WHERE 
    (p_market IS NULL OR eo.market ILIKE '%' || p_market || '%')
    AND eo.created_at >= date_threshold
    AND (eo.expires_at IS NULL OR eo.expires_at > NOW())
  GROUP BY eo.market
  ORDER BY total_opportunities DESC, avg_market_score DESC;
END;
$;

-- Create automated job to refresh materialized views
-- This would typically be set up with pg_cron or similar
-- For now, we'll create a function that can be called periodically

CREATE OR REPLACE FUNCTION schedule_view_refresh()
RETURNS void
LANGUAGE plpgsql
AS $
BEGIN
  -- Refresh views every 15 minutes during business hours
  IF EXTRACT(hour FROM NOW()) BETWEEN 6 AND 22 THEN
    PERFORM refresh_dashboard_views();
  END IF;
END;
$;

-- Create function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_size TEXT,
  table_size TEXT,
  index_usage_count BIGINT
)
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    indexname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    idx_scan as index_usage_count
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
    AND (tablename LIKE '%export%' OR tablename LIKE '%compliance%' OR tablename LIKE '%market%')
  ORDER BY pg_relation_size(indexrelid) DESC;
END;
$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION search_export_opportunities TO authenticated;
GRANT EXECUTE ON FUNCTION search_compliance_screenings TO authenticated;
GRANT EXECUTE ON FUNCTION get_market_summary TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_views TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_query_performance TO authenticated;

-- Grant select permissions on materialized views
GRANT SELECT ON dashboard_metrics TO authenticated;
GRANT SELECT ON compliance_metrics TO authenticated;

-- Add table statistics update
ANALYZE export_opportunities;
ANALYZE compliance_screenings;
ANALYZE market_analysis;
ANALYZE audit_logs;
ANALYZE users;
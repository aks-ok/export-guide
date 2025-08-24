-- Migration: Create export-related tables and enhance existing tables
-- Created: 2025-01-22

-- Add export-specific fields to existing leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country_code VARCHAR(3);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS import_volume DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compliance_cleared BOOLEAN DEFAULT FALSE;

-- Create export regulations table
CREATE TABLE IF NOT EXISTS export_regulations (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  regulation_type VARCHAR(50) NOT NULL,
  requirements TEXT,
  license_required BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create market opportunities table
CREATE TABLE IF NOT EXISTS market_opportunities (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  market_size DECIMAL,
  growth_rate DECIMAL,
  tariff_rate DECIMAL,
  trade_barriers TEXT,
  opportunity_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create lead export data table
CREATE TABLE IF NOT EXISTS lead_export_data (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  import_capacity DECIMAL,
  export_experience VARCHAR(50) CHECK (export_experience IN ('none', 'limited', 'experienced', 'expert')),
  compliance_status VARCHAR(50) CHECK (compliance_status IN ('pending', 'cleared', 'restricted', 'denied')),
  market_segment VARCHAR(100),
  opportunity_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create compliance screenings table
CREATE TABLE IF NOT EXISTS compliance_screenings (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  screening_type VARCHAR(50) CHECK (screening_type IN ('denied_party', 'restricted_entity', 'sanctions')),
  status VARCHAR(20) CHECK (status IN ('clear', 'flagged', 'denied')),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  notes TEXT,
  screened_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_export_regulations_country_product ON export_regulations(country_code, product_category);
CREATE INDEX IF NOT EXISTS idx_market_opportunities_country_product ON market_opportunities(country_code, product_category);
CREATE INDEX IF NOT EXISTS idx_lead_export_data_lead_id ON lead_export_data(lead_id);
CREATE INDEX IF NOT EXISTS idx_compliance_screenings_lead_id ON compliance_screenings(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_country_industry ON leads(country_code, industry);
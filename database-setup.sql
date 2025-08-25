-- ExportGuide Database Setup
-- Run these commands in your Supabase SQL editor

-- Create export_opportunities table
CREATE TABLE IF NOT EXISTS export_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    market VARCHAR(100) NOT NULL,
    product VARCHAR(100) NOT NULL,
    estimated_value DECIMAL(15,2),
    compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'compliant', 'restricted', 'requires_license')),
    market_score INTEGER CHECK (market_score >= 0 AND market_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    country VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance_checks table
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_name VARCHAR(255) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    product_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('clear', 'blocked', 'license_required', 'pending')),
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_export_opportunities_market ON export_opportunities(market);
CREATE INDEX IF NOT EXISTS idx_export_opportunities_compliance_status ON export_opportunities(compliance_status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_party_name ON compliance_checks(party_name);

-- Enable Row Level Security (RLS)
ALTER TABLE export_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON export_opportunities FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON export_opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON export_opportunities FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON leads FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON leads FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON compliance_checks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON compliance_checks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON compliance_checks FOR UPDATE USING (true);

-- Insert some sample data
INSERT INTO export_opportunities (title, market, product, estimated_value, compliance_status, market_score) VALUES
('Electronics Export to Germany', 'Germany', 'Electronics', 250000.00, 'compliant', 85),
('Machinery Export to Japan', 'Japan', 'Industrial Machinery', 500000.00, 'pending', 78),
('Software Services to UK', 'United Kingdom', 'Software', 150000.00, 'compliant', 92),
('Automotive Parts to Mexico', 'Mexico', 'Automotive', 300000.00, 'requires_license', 67);

INSERT INTO leads (name, company, email, phone, country, status) VALUES
('John Smith', 'Tech Solutions GmbH', 'john.smith@techsolutions.de', '+49-123-456-789', 'Germany', 'qualified'),
('Maria Garcia', 'Industrial Corp', 'maria.garcia@industrial.mx', '+52-555-123-4567', 'Mexico', 'contacted'),
('Hiroshi Tanaka', 'Tokyo Manufacturing', 'h.tanaka@tokyo-mfg.jp', '+81-3-1234-5678', 'Japan', 'new'),
('Sarah Johnson', 'UK Imports Ltd', 'sarah@ukimports.co.uk', '+44-20-7123-4567', 'United Kingdom', 'converted');

INSERT INTO compliance_checks (party_name, destination_country, product_code, status, risk_level) VALUES
('Tech Solutions GmbH', 'Germany', 'ELEC001', 'clear', 'low'),
('Industrial Corp', 'Mexico', 'MACH002', 'license_required', 'medium'),
('Restricted Company Ltd', 'Iran', 'DUAL001', 'blocked', 'high'),
('Safe Trading Co', 'Canada', 'SOFT001', 'clear', 'low');

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_address TEXT,
    customer_country VARCHAR(100),
    quotation_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_terms TEXT,
    delivery_terms TEXT,
    items JSONB NOT NULL,
    subtotal DECIMAL(15,2) DEFAULT 0,
    total_discount DECIMAL(15,2) DEFAULT 0,
    total_tax DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for quotations
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email ON quotations(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_date ON quotations(quotation_date);

-- Enable RLS for quotations
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Create policies for quotations
CREATE POLICY "Enable read access for all users" ON quotations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON quotations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON quotations FOR UPDATE USING (true);
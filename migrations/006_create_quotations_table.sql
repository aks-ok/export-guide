-- Migration: Create quotations table and sample data
-- Created: 2025-01-22

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  destination_country VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'USD',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  shipping_cost DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  hsn_code VARCHAR(20),
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample quotations
INSERT INTO quotations (quotation_number, customer_name, customer_email, customer_phone, customer_address, destination_country, currency, subtotal, tax_amount, shipping_cost, total_amount, status, valid_until, notes) VALUES
('QT-2025-001', 'Global Electronics Ltd', 'procurement@globalelectronics.com', '+49-123-456-7890', '123 Business Street, Berlin, Germany', 'Germany', 'EUR', 15000.00, 2700.00, 500.00, 18200.00, 'sent', '2025-02-28', 'Bulk order for electronic components'),
('QT-2025-002', 'Tech Solutions Inc', 'orders@techsolutions.com', '+1-555-123-4567', '456 Innovation Ave, San Francisco, CA, USA', 'United States', 'USD', 25000.00, 2500.00, 750.00, 28250.00, 'draft', '2025-03-15', 'Custom software development project'),
('QT-2025-003', 'Manufacturing Co Ltd', 'supply@mfgco.co.uk', '+44-20-1234-5678', '789 Industrial Park, Manchester, UK', 'United Kingdom', 'GBP', 12000.00, 2400.00, 300.00, 14700.00, 'accepted', '2025-02-20', 'Manufacturing equipment order');

-- Insert sample quotation items
INSERT INTO quotation_items (quotation_id, product_name, hsn_code, description, quantity, unit, unit_price, discount_percent, tax_percent, total_amount) VALUES
(1, 'Microprocessors', '85423100', 'High-performance microprocessors for industrial use', 100, 'pcs', 150.00, 5.00, 18.00, 16815.00),
(1, 'Memory Modules', '85423200', 'DDR4 memory modules 16GB', 50, 'pcs', 80.00, 0.00, 18.00, 4720.00),
(2, 'Software License', '85234900', 'Enterprise software license', 1, 'license', 25000.00, 0.00, 10.00, 27500.00),
(3, 'CNC Machine Parts', '84669200', 'Precision CNC machine components', 20, 'pcs', 600.00, 10.00, 20.00, 12960.00);

-- Insert sample compliance screenings
INSERT INTO compliance_screenings (lead_id, screening_type, status, risk_level, notes, screened_at) VALUES
(1, 'denied_party', 'clear', 'low', 'No matches found in denied party lists', NOW() - INTERVAL '1 day'),
(2, 'sanctions', 'clear', 'low', 'No sanctions restrictions identified', NOW() - INTERVAL '2 days'),
(3, 'restricted_entity', 'flagged', 'medium', 'Entity requires additional verification', NOW() - INTERVAL '3 days'),
(1, 'denied_party', 'clear', 'low', 'Routine screening completed successfully', NOW() - INTERVAL '5 days'),
(4, 'sanctions', 'clear', 'low', 'No sanctions matches found', NOW() - INTERVAL '1 week');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_customer_name ON quotations(customer_name);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_compliance_screenings_status ON compliance_screenings(status);
CREATE INDEX IF NOT EXISTS idx_compliance_screenings_risk_level ON compliance_screenings(risk_level);
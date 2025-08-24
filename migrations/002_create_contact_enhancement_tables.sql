-- Migration: Create contact enhancement tables for export features
-- Created: 2025-01-22

-- Add export-specific fields to existing contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country_code VARCHAR(3);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type VARCHAR(50) DEFAULT 'prospect' CHECK (contact_type IN ('prospect', 'customer', 'partner', 'supplier', 'government'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS export_experience VARCHAR(50) DEFAULT 'none' CHECK (export_experience IN ('none', 'limited', 'experienced', 'expert'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'cleared', 'restricted', 'denied'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS compliance_notes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_compliance_check TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS time_zone VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS export_interests TEXT[]; -- Array of export interests
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS annual_import_volume DECIMAL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_stage VARCHAR(50) DEFAULT 'cold' CHECK (relationship_stage IN ('cold', 'warm', 'hot', 'customer', 'inactive'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create communication logs table
CREATE TABLE IF NOT EXISTS communication_logs (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'trade_show', 'other')),
  subject VARCHAR(255) NOT NULL,
  content TEXT,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  export_context TEXT, -- Context related to export opportunities
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create follow-up reminders table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  reminder_date TIMESTAMP NOT NULL,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('call', 'email', 'meeting', 'proposal', 'compliance_check')),
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed')),
  completed_at TIMESTAMP,
  completed_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create contact export interests junction table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS contact_export_interests (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  interest VARCHAR(100) NOT NULL,
  priority INTEGER DEFAULT 1, -- 1 = high, 2 = medium, 3 = low
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_country_industry ON contacts(country_code, industry);
CREATE INDEX IF NOT EXISTS idx_contacts_compliance_status ON contacts(compliance_status);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_stage ON contacts(relationship_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_next_follow_up ON contacts(next_follow_up);

CREATE INDEX IF NOT EXISTS idx_communication_logs_contact_id ON communication_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at ON communication_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_contact_id ON follow_up_reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_date ON follow_up_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_status ON follow_up_reminders(status);

CREATE INDEX IF NOT EXISTS idx_contact_export_interests_contact_id ON contact_export_interests(contact_id);

-- Create a view for contact summary with export information
CREATE OR REPLACE VIEW contact_export_summary AS
SELECT 
  c.*,
  COUNT(cl.id) as communication_count,
  COUNT(CASE WHEN fr.status = 'pending' THEN 1 END) as pending_reminders,
  MAX(cl.created_at) as last_communication,
  MIN(CASE WHEN fr.status = 'pending' THEN fr.reminder_date END) as next_reminder
FROM contacts c
LEFT JOIN communication_logs cl ON c.id = cl.contact_id
LEFT JOIN follow_up_reminders fr ON c.id = fr.contact_id
GROUP BY c.id;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on contacts table
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- This can be removed in production
INSERT INTO contacts (name, email, phone, company, notes, country_code, industry, contact_type, export_experience, compliance_status, relationship_stage) VALUES
('Hans Mueller', 'hans.mueller@example.de', '+49-30-12345678', 'German Tech GmbH', 'Interested in electronics import', 'DEU', 'Technology', 'prospect', 'experienced', 'cleared', 'warm'),
('Marie Dubois', 'marie.dubois@example.fr', '+33-1-23456789', 'French Industries SA', 'Looking for manufacturing partnerships', 'FRA', 'Manufacturing', 'partner', 'expert', 'cleared', 'hot'),
('Yuki Tanaka', 'yuki.tanaka@example.jp', '+81-3-12345678', 'Tokyo Electronics Ltd', 'Automotive components buyer', 'JPN', 'Automotive', 'customer', 'expert', 'cleared', 'customer')
ON CONFLICT DO NOTHING;
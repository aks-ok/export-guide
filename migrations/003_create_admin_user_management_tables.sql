-- Migration: Create admin and user management tables for export system
-- Created: 2025-01-22

-- Create users table for role-based access control
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'compliance_officer', 'sales_manager', 'user')),
  permissions TEXT[], -- Array of permission strings
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create export compliance settings table
CREATE TABLE IF NOT EXISTS export_compliance_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(50) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE, -- For settings that should be encrypted/hidden
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create audit log table for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'lead', 'contact', 'screening', 'setting', etc.
  entity_id VARCHAR(100), -- Can be numeric ID or string identifier
  old_values JSONB, -- Previous state of the entity
  new_values JSONB, -- New state of the entity
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  resource VARCHAR(100), -- Optional resource identifier
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optional expiration
  UNIQUE(user_id, permission, resource)
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'webhook')),
  is_enabled BOOLEAN DEFAULT TRUE,
  settings JSONB, -- Channel-specific settings (email address, phone number, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, notification_type, channel)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_export_compliance_settings_key ON export_compliance_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_export_compliance_settings_type ON export_compliance_settings(setting_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_export_compliance_settings_updated_at ON export_compliance_settings;
CREATE TRIGGER update_export_compliance_settings_updated_at
    BEFORE UPDATE ON export_compliance_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default compliance settings
INSERT INTO export_compliance_settings (setting_key, setting_value, setting_type, description) VALUES
('screening_auto_enabled', 'true', 'boolean', 'Enable automatic compliance screening for new leads'),
('screening_batch_size', '50', 'number', 'Maximum number of leads to screen in a single batch'),
('compliance_review_days', '30', 'number', 'Number of days before compliance review expires'),
('denied_party_list_url', 'https://api.bis.doc.gov/denied-persons', 'string', 'URL for denied parties list API'),
('sanctions_list_url', 'https://api.treasury.gov/sanctions', 'string', 'URL for sanctions list API'),
('notification_email_from', 'compliance@company.com', 'string', 'From email address for compliance notifications'),
('max_export_value_threshold', '100000', 'number', 'Maximum export value before additional approval required (USD)'),
('high_risk_countries', '["IRN", "PRK", "SYR", "CUB", "VEN", "MMR", "RUS", "BLR"]', 'json', 'List of high-risk country codes'),
('restricted_industries', '["defense", "nuclear", "weapons", "military"]', 'json', 'List of restricted industry keywords'),
('audit_retention_days', '2555', 'number', 'Number of days to retain audit logs (7 years)')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default admin user (password should be changed on first login)
INSERT INTO users (email, name, role, permissions) VALUES
('admin@company.com', 'System Administrator', 'admin', ARRAY['*'])
ON CONFLICT (email) DO NOTHING;

-- Insert default permissions for different roles
INSERT INTO user_permissions (user_id, permission, granted_by) 
SELECT u.id, unnest(ARRAY[
  'leads.read', 'leads.write', 'leads.delete',
  'contacts.read', 'contacts.write', 'contacts.delete',
  'compliance.read', 'compliance.write', 'compliance.screen',
  'analytics.read', 'reports.read', 'reports.export',
  'settings.read', 'settings.write',
  'users.read', 'users.write', 'users.delete',
  'audit.read', 'system.admin'
]), u.id
FROM users u 
WHERE u.role = 'admin'
ON CONFLICT (user_id, permission, resource) DO NOTHING;

-- Create view for user summary with permissions
CREATE OR REPLACE VIEW user_summary AS
SELECT 
  u.*,
  COUNT(up.id) as permission_count,
  COUNT(CASE WHEN us.is_active = true AND us.expires_at > NOW() THEN 1 END) as active_sessions,
  MAX(us.created_at) as last_session
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN user_sessions us ON u.id = us.user_id
GROUP BY u.id;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id INTEGER,
  p_action VARCHAR(100),
  p_entity_type VARCHAR(50),
  p_entity_id VARCHAR(100),
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  audit_id INTEGER;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, 
    old_values, new_values, ip_address, user_agent, session_id
  ) VALUES (
    p_user_id, p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_ip_address, p_user_agent, p_session_id
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id INTEGER,
  p_permission VARCHAR(100),
  p_resource VARCHAR(100) DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
BEGIN
  -- Check if user is admin (has * permission)
  SELECT EXISTS(
    SELECT 1 FROM user_permissions 
    WHERE user_id = p_user_id 
    AND permission = '*'
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_permission;
  
  IF has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS(
    SELECT 1 FROM user_permissions 
    WHERE user_id = p_user_id 
    AND permission = p_permission
    AND (resource IS NULL OR resource = p_resource)
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
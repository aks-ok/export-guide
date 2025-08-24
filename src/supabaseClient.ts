import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Basic types for our data
export interface ExportOpportunity {
  id: string;
  title: string;
  description?: string;
  market: string;
  product: string;
  estimated_value?: number;
  compliance_status: 'pending' | 'compliant' | 'restricted' | 'requires_license';
  market_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  created_at: string;
  updated_at: string;
}

export interface ComplianceCheck {
  id: string;
  party_name: string;
  destination_country: string;
  product_code?: string;
  status: 'clear' | 'blocked' | 'license_required' | 'pending';
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
}
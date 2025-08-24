# Database Migrations

This directory contains SQL migration scripts for the Export Research and Lead Generation feature.

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)
```bash
# If you have Supabase CLI installed
supabase migration new create_export_tables
# Copy the content from 001_create_export_tables.sql to the generated file
supabase db push
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the content from `001_create_export_tables.sql`
4. Execute the script

### Option 3: Using a Database Client
Connect to your PostgreSQL database and execute the SQL scripts in order.

## Migration Files

- `001_create_export_tables.sql` - Creates the core export-related tables and indexes

## Schema Overview

The migration creates the following tables:

1. **export_regulations** - Stores export regulation information by country and product
2. **market_opportunities** - Contains market research data and opportunity scores
3. **lead_export_data** - Extended export-specific information for leads
4. **compliance_screenings** - Results of compliance checks for leads

It also adds export-specific columns to the existing `leads` table:
- `country_code` - ISO 3166-1 alpha-3 country code
- `industry` - Industry classification
- `annual_revenue` - Company annual revenue
- `import_volume` - Import capacity/volume
- `compliance_cleared` - Boolean flag for compliance status

## Indexes

The migration creates indexes for optimal query performance:
- Country and product category lookups
- Lead ID foreign key relationships
- Country and industry combinations for leads
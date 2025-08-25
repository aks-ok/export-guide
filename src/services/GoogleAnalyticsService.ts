// Google Analytics Service for ExportGuide Platform
// Tracks user interactions and business intelligence events

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

class GoogleAnalyticsService {
  private measurementId: string;
  private isEnabled: boolean;

  constructor() {
    this.measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-9E88FVDNYX';
    this.isEnabled = typeof window !== 'undefined' && !!window.gtag;
  }

  // Track page views
  trackPageView(pagePath: string, pageTitle?: string) {
    if (!this.isEnabled) return;

    window.gtag('config', this.measurementId, {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  // Track export-specific events
  trackExportEvent(eventName: string, parameters: {
    country?: string;
    product_category?: string;
    trade_value?: number;
    compliance_status?: string;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', eventName, {
      event_category: 'export_intelligence',
      ...parameters
    });
  }

  // Track API usage
  trackAPIUsage(apiName: string, success: boolean, responseTime: number, dataPoints?: number) {
    if (!this.isEnabled) return;

    window.gtag('event', 'api_call', {
      event_category: 'api_usage',
      api_name: apiName,
      success: success,
      response_time: responseTime,
      data_points: dataPoints || 0,
      value: success ? 1 : 0
    });
  }

  // Track lead generation activities
  trackLeadGeneration(eventType: 'search' | 'filter' | 'export' | 'contact', parameters: {
    lead_count?: number;
    search_query?: string;
    filters_applied?: string[];
    target_country?: string;
    industry?: string;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', `lead_${eventType}`, {
      event_category: 'lead_generation',
      ...parameters
    });
  }

  // Track market research activities
  trackMarketResearch(eventType: 'country_analysis' | 'trade_data' | 'competitor_research', parameters: {
    country?: string;
    product_code?: string;
    market_score?: number;
    data_source?: string;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', `market_${eventType}`, {
      event_category: 'market_research',
      ...parameters
    });
  }

  // Track compliance activities
  trackCompliance(eventType: 'screening' | 'regulation_check' | 'license_inquiry', parameters: {
    party_name?: string;
    country?: string;
    product_code?: string;
    risk_level?: string;
    compliance_status?: string;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', `compliance_${eventType}`, {
      event_category: 'export_compliance',
      ...parameters
    });
  }

  // Track quotation activities
  trackQuotation(eventType: 'create' | 'send' | 'accept' | 'reject', parameters: {
    quotation_id?: string;
    customer_country?: string;
    total_value?: number;
    currency?: string;
    product_count?: number;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', `quotation_${eventType}`, {
      event_category: 'quotations',
      ...parameters
    });
  }

  // Track user engagement
  trackEngagement(eventType: 'feature_usage' | 'time_spent' | 'data_export', parameters: {
    feature_name?: string;
    duration?: number;
    export_format?: string;
    user_type?: string;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', eventType, {
      event_category: 'user_engagement',
      ...parameters
    });
  }

  // Track business conversions
  trackConversion(conversionType: 'lead_qualified' | 'export_opportunity' | 'compliance_cleared', parameters: {
    conversion_value?: number;
    currency?: string;
    country?: string;
    product_category?: string;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', 'conversion', {
      event_category: 'business_conversion',
      conversion_type: conversionType,
      ...parameters
    });
  }

  // Track errors and issues
  trackError(errorType: 'api_error' | 'validation_error' | 'system_error', parameters: {
    error_message?: string;
    error_code?: string;
    api_name?: string;
    page_path?: string;
    [key: string]: any;
  } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', 'exception', {
      event_category: 'errors',
      error_type: errorType,
      fatal: false,
      ...parameters
    });
  }

  // Set user properties
  setUserProperties(properties: {
    user_type?: 'free' | 'premium' | 'enterprise';
    industry?: string;
    company_size?: string;
    primary_export_markets?: string[];
    [key: string]: any;
  }) {
    if (!this.isEnabled) return;

    window.gtag('config', this.measurementId, {
      custom_map: properties
    });
  }

  // Track custom events
  trackCustomEvent(eventName: string, parameters: { [key: string]: any } = {}) {
    if (!this.isEnabled) return;

    window.gtag('event', eventName, parameters);
  }

  // Enhanced ecommerce tracking for export opportunities
  trackExportOpportunity(action: 'view' | 'add_to_pipeline' | 'pursue' | 'convert', opportunity: {
    opportunity_id: string;
    country: string;
    product_category: string;
    estimated_value: number;
    currency: string;
    market_score: number;
  }) {
    if (!this.isEnabled) return;

    const eventData = {
      event_category: 'export_opportunities',
      currency: opportunity.currency,
      value: opportunity.estimated_value,
      items: [{
        item_id: opportunity.opportunity_id,
        item_name: `${opportunity.product_category} to ${opportunity.country}`,
        item_category: 'export_opportunity',
        item_variant: opportunity.country,
        price: opportunity.estimated_value,
        quantity: 1
      }]
    };

    switch (action) {
      case 'view':
        window.gtag('event', 'view_item', eventData);
        break;
      case 'add_to_pipeline':
        window.gtag('event', 'add_to_cart', eventData);
        break;
      case 'pursue':
        window.gtag('event', 'begin_checkout', eventData);
        break;
      case 'convert':
        window.gtag('event', 'purchase', {
          ...eventData,
          transaction_id: opportunity.opportunity_id
        });
        break;
    }
  }

  // Get analytics status
  getStatus() {
    return {
      enabled: this.isEnabled,
      measurement_id: this.measurementId,
      gtag_available: typeof window !== 'undefined' && !!window.gtag
    };
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
export default googleAnalyticsService;
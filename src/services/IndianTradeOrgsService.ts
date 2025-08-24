// Indian Trade Organizations API Integration Service
// Handles CII, FICCI, EEPC, and FIEO API integrations

export interface TradeEvent {
  id: string;
  title: string;
  organization: 'CII' | 'FICCI' | 'EEPC' | 'FIEO';
  date: string;
  location: string;
  type: 'trade_fair' | 'delegation' | 'seminar' | 'networking' | 'exhibition';
  sectors: string[];
  countries: string[];
  registration_deadline: string;
  registration_fee: number;
  currency: string;
  description: string;
  contact_person: string;
  contact_email: string;
  website_url: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface TradeOpportunity {
  id: string;
  title: string;
  organization: 'CII' | 'FICCI' | 'EEPC' | 'FIEO';
  country: string;
  sector: string;
  product_category: string;
  value_range: string;
  deadline: string;
  requirements: string[];
  description: string;
  buyer_profile: {
    company_name: string;
    company_size: string;
    annual_turnover: string;
    years_in_business: number;
  };
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  application_process: string[];
}

export interface MembershipBenefit {
  organization: 'CII' | 'FICCI' | 'EEPC' | 'FIEO';
  membership_type: string;
  annual_fee: number;
  currency: string;
  benefits: string[];
  eligibility_criteria: string[];
  application_process: string[];
  contact_info: {
    phone: string;
    email: string;
    address: string;
  };
}

export interface MarketIntelligence {
  id: string;
  organization: 'CII' | 'FICCI' | 'EEPC' | 'FIEO';
  title: string;
  sector: string;
  country: string;
  report_type: 'market_analysis' | 'trade_statistics' | 'policy_update' | 'opportunity_alert';
  summary: string;
  key_insights: string[];
  publication_date: string;
  access_level: 'public' | 'member_only' | 'premium';
  download_url?: string;
}

class IndianTradeOrgsService {
  private baseUrls = {
    CII: process.env.REACT_APP_CII_BASE_URL || 'https://api.cii.in/v1',
    FICCI: process.env.REACT_APP_FICCI_BASE_URL || 'https://api.ficci.com/v1',
    EEPC: process.env.REACT_APP_EPC_BASE_URL || 'https://api.eepc.gov.in/v1',
    FIEO: process.env.REACT_APP_FIEO_BASE_URL || 'https://api.fieo.org/v1'
  };

  private apiKeys = {
    CII: process.env.REACT_APP_CII_API_KEY,
    FICCI: process.env.REACT_APP_FICCI_API_KEY,
    EEPC: process.env.REACT_APP_EPC_API_KEY,
    FIEO: process.env.REACT_APP_FIEO_API_KEY
  };

  // CII API Methods
  async getCIITradeEvents(filters?: {
    sector?: string;
    country?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<TradeEvent[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.sector) queryParams.append('sector', filters.sector);
      if (filters?.country) queryParams.append('country', filters.country);
      if (filters?.date_from) queryParams.append('date_from', filters.date_from);
      if (filters?.date_to) queryParams.append('date_to', filters.date_to);

      const response = await fetch(`${this.baseUrls.CII}/events?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.CII}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch CII events');
      return await response.json();
    } catch (error) {
      console.error('CII API Error:', error);
      return this.getMockCIIEvents();
    }
  }

  async getCIIBusinessMatching(criteria: {
    sector: string;
    country: string;
    company_size?: string;
    turnover_range?: string;
  }): Promise<TradeOpportunity[]> {
    try {
      const response = await fetch(`${this.baseUrls.CII}/business-matching`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.CII}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(criteria)
      });

      if (!response.ok) throw new Error('Failed to fetch CII business matches');
      return await response.json();
    } catch (error) {
      console.error('CII Business Matching Error:', error);
      return this.getMockTradeOpportunities().filter(opp => opp.organization === 'CII');
    }
  }

  // FICCI API Methods
  async getFICCIMarketIntelligence(filters?: {
    sector?: string;
    country?: string;
    report_type?: string;
  }): Promise<MarketIntelligence[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.sector) queryParams.append('sector', filters.sector);
      if (filters?.country) queryParams.append('country', filters.country);
      if (filters?.report_type) queryParams.append('type', filters.report_type);

      const response = await fetch(`${this.baseUrls.FICCI}/market-intelligence?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.FICCI}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch FICCI market intelligence');
      return await response.json();
    } catch (error) {
      console.error('FICCI API Error:', error);
      return this.getMockMarketIntelligence().filter(intel => intel.organization === 'FICCI');
    }
  }

  async getFICCITradeDelegations(destination?: string): Promise<TradeEvent[]> {
    try {
      const queryParams = destination ? `?destination=${destination}` : '';
      const response = await fetch(`${this.baseUrls.FICCI}/delegations${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.FICCI}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch FICCI delegations');
      return await response.json();
    } catch (error) {
      console.error('FICCI Delegations Error:', error);
      return this.getMockTradeEvents().filter(event => 
        event.organization === 'FICCI' && event.type === 'delegation'
      );
    }
  }

  // EEPC API Methods
  async getEEPCExportStatistics(filters: {
    product_category?: string;
    destination_country?: string;
    time_period?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrls.EEPC}/export-statistics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.EEPC}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) throw new Error('Failed to fetch EEPC statistics');
      return await response.json();
    } catch (error) {
      console.error('EEPC Statistics Error:', error);
      return this.getMockExportStatistics();
    }
  }

  async getEEPCBuyerSellerMeets(): Promise<TradeEvent[]> {
    try {
      const response = await fetch(`${this.baseUrls.EEPC}/buyer-seller-meets`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.EEPC}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch EEPC buyer-seller meets');
      return await response.json();
    } catch (error) {
      console.error('EEPC Buyer-Seller Meets Error:', error);
      return this.getMockTradeEvents().filter(event => 
        event.organization === 'EEPC' && event.type === 'networking'
      );
    }
  }

  // FIEO API Methods
  async getFIEOExportOpportunities(filters?: {
    sector?: string;
    country?: string;
    value_range?: string;
  }): Promise<TradeOpportunity[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.sector) queryParams.append('sector', filters.sector);
      if (filters?.country) queryParams.append('country', filters.country);
      if (filters?.value_range) queryParams.append('value_range', filters.value_range);

      const response = await fetch(`${this.baseUrls.FIEO}/export-opportunities?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.FIEO}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch FIEO opportunities');
      return await response.json();
    } catch (error) {
      console.error('FIEO Opportunities Error:', error);
      return this.getMockTradeOpportunities().filter(opp => opp.organization === 'FIEO');
    }
  }

  async getFIEOMembershipBenefits(): Promise<MembershipBenefit[]> {
    try {
      const response = await fetch(`${this.baseUrls.FIEO}/membership-benefits`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.FIEO}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch FIEO membership benefits');
      return await response.json();
    } catch (error) {
      console.error('FIEO Membership Error:', error);
      return this.getMockMembershipBenefits();
    }
  }

  // Unified Methods
  async getAllTradeEvents(filters?: {
    organization?: string;
    sector?: string;
    country?: string;
    type?: string;
  }): Promise<TradeEvent[]> {
    const allEvents: TradeEvent[] = [];

    try {
      // Fetch from all organizations in parallel
      const [ciiEvents, ficciEvents, eepcEvents, fieoEvents] = await Promise.allSettled([
        this.getCIITradeEvents(filters),
        this.getFICCITradeDelegations(filters?.country),
        this.getEEPCBuyerSellerMeets(),
        this.getFIEOExportOpportunities(filters) // FIEO doesn't have events API, using opportunities
      ]);

      if (ciiEvents.status === 'fulfilled') allEvents.push(...ciiEvents.value);
      if (ficciEvents.status === 'fulfilled') allEvents.push(...ficciEvents.value);
      if (eepcEvents.status === 'fulfilled') allEvents.push(...eepcEvents.value);

      // Apply filters
      let filteredEvents = allEvents;
      if (filters?.organization) {
        filteredEvents = filteredEvents.filter(event => event.organization === filters.organization);
      }
      if (filters?.sector) {
        filteredEvents = filteredEvents.filter(event => 
          event.sectors.some(sector => sector.toLowerCase().includes(filters.sector!.toLowerCase()))
        );
      }
      if (filters?.type) {
        filteredEvents = filteredEvents.filter(event => event.type === filters.type);
      }

      return filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error fetching all trade events:', error);
      return this.getMockTradeEvents();
    }
  }

  async getAllTradeOpportunities(filters?: {
    organization?: string;
    sector?: string;
    country?: string;
  }): Promise<TradeOpportunity[]> {
    const allOpportunities: TradeOpportunity[] = [];

    try {
      const [ciiOpps, fieoOpps] = await Promise.allSettled([
        this.getCIIBusinessMatching({ 
          sector: filters?.sector || 'All', 
          country: filters?.country || 'Global' 
        }),
        this.getFIEOExportOpportunities(filters)
      ]);

      if (ciiOpps.status === 'fulfilled') allOpportunities.push(...ciiOpps.value);
      if (fieoOpps.status === 'fulfilled') allOpportunities.push(...fieoOpps.value);

      // Apply filters
      let filteredOpps = allOpportunities;
      if (filters?.organization) {
        filteredOpps = filteredOpps.filter(opp => opp.organization === filters.organization);
      }
      if (filters?.sector) {
        filteredOpps = filteredOpps.filter(opp => 
          opp.sector.toLowerCase().includes(filters.sector!.toLowerCase())
        );
      }
      if (filters?.country) {
        filteredOpps = filteredOpps.filter(opp => 
          opp.country.toLowerCase().includes(filters.country!.toLowerCase())
        );
      }

      return filteredOpps.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } catch (error) {
      console.error('Error fetching all trade opportunities:', error);
      return this.getMockTradeOpportunities();
    }
  }

  // Mock Data Methods (for development/fallback)
  private getMockCIIEvents(): TradeEvent[] {
    return [
      {
        id: 'cii-001',
        title: 'India-Germany Business Summit 2025',
        organization: 'CII',
        date: '2025-03-15',
        location: 'New Delhi',
        type: 'delegation',
        sectors: ['Engineering', 'Automotive', 'IT'],
        countries: ['Germany'],
        registration_deadline: '2025-02-28',
        registration_fee: 25000,
        currency: 'INR',
        description: 'High-level business delegation to explore opportunities in German market',
        contact_person: 'Rajesh Kumar',
        contact_email: 'rajesh.kumar@cii.in',
        website_url: 'https://www.cii.in/events/germany-summit-2025',
        status: 'upcoming'
      }
    ];
  }

  private getMockTradeEvents(): TradeEvent[] {
    return [
      {
        id: 'cii-001',
        title: 'India-Germany Business Summit 2025',
        organization: 'CII',
        date: '2025-03-15',
        location: 'New Delhi',
        type: 'delegation',
        sectors: ['Engineering', 'Automotive', 'IT'],
        countries: ['Germany'],
        registration_deadline: '2025-02-28',
        registration_fee: 25000,
        currency: 'INR',
        description: 'High-level business delegation to explore opportunities in German market',
        contact_person: 'Rajesh Kumar',
        contact_email: 'rajesh.kumar@cii.in',
        website_url: 'https://www.cii.in/events/germany-summit-2025',
        status: 'upcoming'
      },
      {
        id: 'ficci-001',
        title: 'FICCI Global Skills Summit',
        organization: 'FICCI',
        date: '2025-02-20',
        location: 'Mumbai',
        type: 'seminar',
        sectors: ['Education', 'IT Services', 'Healthcare'],
        countries: ['Global'],
        registration_deadline: '2025-02-15',
        registration_fee: 15000,
        currency: 'INR',
        description: 'Global summit on skills development and workforce transformation',
        contact_person: 'Priya Sharma',
        contact_email: 'priya.sharma@ficci.com',
        website_url: 'https://www.ficci.in/skills-summit-2025',
        status: 'upcoming'
      }
    ];
  }

  private getMockTradeOpportunities(): TradeOpportunity[] {
    return [
      {
        id: 'cii-opp-001',
        title: 'Electronics Components Export to Germany',
        organization: 'CII',
        country: 'Germany',
        sector: 'Electronics',
        product_category: 'Electronic Components',
        value_range: '$500K - $2M',
        deadline: '2025-03-01',
        requirements: ['ISO 9001 Certification', 'CE Marking', 'Minimum 5 years experience'],
        description: 'German electronics manufacturer seeking Indian suppliers for components',
        buyer_profile: {
          company_name: 'TechComponents GmbH',
          company_size: 'Medium (250 employees)',
          annual_turnover: '€50M',
          years_in_business: 15
        },
        contact_person: 'Rajesh Kumar',
        contact_email: 'rajesh.kumar@cii.in',
        contact_phone: '+91-11-2462-9994',
        application_process: [
          'Submit company profile and certifications',
          'Technical evaluation by buyer',
          'Commercial negotiation',
          'Contract finalization'
        ]
      }
    ];
  }

  private getMockMarketIntelligence(): MarketIntelligence[] {
    return [
      {
        id: 'ficci-intel-001',
        organization: 'FICCI',
        title: 'India-UAE Trade Opportunities 2025',
        sector: 'Multi-sector',
        country: 'UAE',
        report_type: 'market_analysis',
        summary: 'Comprehensive analysis of trade opportunities between India and UAE',
        key_insights: [
          'UAE imports $15B worth of goods from India annually',
          'Electronics and textiles show highest growth potential',
          'New FTA provisions create additional opportunities'
        ],
        publication_date: '2025-01-15',
        access_level: 'member_only',
        download_url: 'https://www.ficci.com/reports/india-uae-trade-2025.pdf'
      }
    ];
  }

  private getMockExportStatistics(): any {
    return {
      total_exports: 45000000000, // $45B
      growth_rate: 12.5,
      top_destinations: [
        { country: 'USA', value: 12000000000, share: 26.7 },
        { country: 'Germany', value: 8000000000, share: 17.8 },
        { country: 'UK', value: 6000000000, share: 13.3 }
      ],
      top_products: [
        { category: 'Machinery', value: 15000000000, share: 33.3 },
        { category: 'Auto Components', value: 12000000000, share: 26.7 },
        { category: 'Electronics', value: 8000000000, share: 17.8 }
      ]
    };
  }

  private getMockMembershipBenefits(): MembershipBenefit[] {
    return [
      {
        organization: 'CII',
        membership_type: 'Corporate Membership',
        annual_fee: 100000,
        currency: 'INR',
        benefits: [
          'Access to trade delegations',
          'Business matching services',
          'Industry reports and insights',
          'Networking events',
          'Policy advocacy support'
        ],
        eligibility_criteria: [
          'Registered Indian company',
          'Minimum annual turnover of ₹10 crores',
          'Good standing with regulatory authorities'
        ],
        application_process: [
          'Submit application form',
          'Provide company documents',
          'Pay membership fee',
          'Approval by membership committee'
        ],
        contact_info: {
          phone: '+91-11-2462-9994',
          email: 'membership@cii.in',
          address: 'The Mantosh Sondhi Centre, 23, Institutional Area, Lodi Road, New Delhi'
        }
      }
    ];
  }
}

export const indianTradeOrgsService = new IndianTradeOrgsService();
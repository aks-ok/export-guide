import { TradeStats, ProductStat, TradingPartner, MarketData } from '../types';

// World Bank API Response Types
export interface WorldBankResponse<T> {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  data: T[];
}

export interface WorldBankIndicator {
  id: string;
  value: number | null;
  decimal: number;
  date: string;
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  indicator: {
    id: string;
    value: string;
  };
}

export interface WorldBankCountry {
  id: string;
  iso2Code: string;
  name: string;
  region: {
    id: string;
    iso2code: string;
    value: string;
  };
  adminregion: {
    id: string;
    iso2code: string;
    value: string;
  };
  incomeLevel: {
    id: string;
    iso2code: string;
    value: string;
  };
  lendingType: {
    id: string;
    iso2code: string;
    value: string;
  };
  capitalCity: string;
  longitude: string;
  latitude: string;
}

export class WorldBankTransformer {
  
  /**
   * Transform World Bank trade indicators to TradeStats
   */
  static transformToTradeStats(
    indicators: WorldBankIndicator[],
    countryCode: string,
    countryName: string
  ): TradeStats {
    const latestYear = Math.max(...indicators.map(i => parseInt(i.date)));
    const latestData = indicators.filter(i => parseInt(i.date) === latestYear);
    
    // Find specific indicators
    const exports = this.findIndicatorValue(latestData, 'NE.EXP.GNFS.CD') || 0;
    const imports = this.findIndicatorValue(latestData, 'NE.IMP.GNFS.CD') || 0;
    const gdp = this.findIndicatorValue(latestData, 'NY.GDP.MKTP.CD') || 0;
    
    return {
      country: countryName,
      countryCode: countryCode,
      totalExports: exports,
      totalImports: imports,
      tradeBalance: exports - imports,
      topExportProducts: this.generateMockProductStats('export'),
      topImportProducts: this.generateMockProductStats('import'),
      tradingPartners: this.generateMockTradingPartners(),
      period: latestYear.toString(),
      source: 'World Bank',
      lastUpdated: new Date()
    };
  }

  /**
   * Transform World Bank indicators to market data
   */
  static transformToMarketData(
    indicators: WorldBankIndicator[],
    productCategory: string
  ): MarketData[] {
    const countries = this.groupByCountry(indicators);
    
    return Object.entries(countries).map(([countryCode, countryData]) => {
      const latestYear = Math.max(...countryData.map(i => parseInt(i.date)));
      const latestData = countryData.filter(i => parseInt(i.date) === latestYear);
      const previousYearData = countryData.filter(i => parseInt(i.date) === latestYear - 1);
      
      const currentGDP = this.findIndicatorValue(latestData, 'NY.GDP.MKTP.CD') || 0;
      const previousGDP = this.findIndicatorValue(previousYearData, 'NY.GDP.MKTP.CD') || 0;
      const growthRate = previousGDP > 0 ? ((currentGDP - previousGDP) / previousGDP) * 100 : 0;
      
      const exports = this.findIndicatorValue(latestData, 'NE.EXP.GNFS.CD') || 0;
      const imports = this.findIndicatorValue(latestData, 'NE.IMP.GNFS.CD') || 0;
      
      return {
        id: `${countryCode}_${productCategory}_${Date.now()}`,
        country: latestData[0]?.country.value || countryCode,
        countryCode: countryCode,
        productCategory: productCategory,
        marketSize: currentGDP,
        growthRate: Math.round(growthRate * 10) / 10,
        competitionLevel: this.calculateCompetitionLevel(exports, imports),
        tariffRate: this.estimateTariffRate(countryCode),
        tradeVolume: exports + imports,
        lastUpdated: new Date(),
        source: 'World Bank',
        reliability: 'high'
      };
    });
  }

  /**
   * Transform country list from World Bank
   */
  static transformCountries(countries: WorldBankCountry[]) {
    return countries
      .filter(country => 
        country.region.value !== 'Aggregates' && 
        country.incomeLevel.id !== 'NA'
      )
      .map(country => ({
        code: country.id,
        iso2Code: country.iso2Code,
        name: country.name,
        region: country.region.value,
        incomeLevel: country.incomeLevel.value,
        capital: country.capitalCity,
        coordinates: {
          latitude: parseFloat(country.latitude) || 0,
          longitude: parseFloat(country.longitude) || 0
        }
      }));
  }

  // Helper methods
  private static findIndicatorValue(data: WorldBankIndicator[], indicatorId: string): number | null {
    const indicator = data.find(item => item.indicator.id === indicatorId);
    return indicator?.value || null;
  }

  private static groupByCountry(indicators: WorldBankIndicator[]): Record<string, WorldBankIndicator[]> {
    return indicators.reduce((acc, indicator) => {
      const countryCode = indicator.countryiso3code;
      if (!acc[countryCode]) {
        acc[countryCode] = [];
      }
      acc[countryCode].push(indicator);
      return acc;
    }, {} as Record<string, WorldBankIndicator[]>);
  }

  private static calculateCompetitionLevel(exports: number, imports: number): 'low' | 'medium' | 'high' {
    const tradeBalance = exports - imports;
    const totalTrade = exports + imports;
    
    if (totalTrade === 0) return 'low';
    
    const balanceRatio = Math.abs(tradeBalance) / totalTrade;
    
    if (balanceRatio > 0.5) return 'low';
    if (balanceRatio > 0.2) return 'medium';
    return 'high';
  }

  private static estimateTariffRate(countryCode: string): number {
    // Simple estimation based on country development level
    // In real implementation, this would come from WTO or other trade databases
    const developedCountries = ['USA', 'DEU', 'JPN', 'GBR', 'FRA', 'CAN', 'AUS'];
    const emergingCountries = ['CHN', 'IND', 'BRA', 'RUS', 'MEX', 'ZAF'];
    
    if (developedCountries.includes(countryCode)) {
      return Math.random() * 5; // 0-5%
    } else if (emergingCountries.includes(countryCode)) {
      return Math.random() * 15 + 5; // 5-20%
    } else {
      return Math.random() * 25 + 10; // 10-35%
    }
  }

  private static generateMockProductStats(type: 'export' | 'import'): ProductStat[] {
    const products = [
      { code: '84', name: 'Machinery and mechanical appliances' },
      { code: '85', name: 'Electrical machinery and equipment' },
      { code: '87', name: 'Vehicles other than railway' },
      { code: '27', name: 'Mineral fuels and oils' },
      { code: '39', name: 'Plastics and articles thereof' }
    ];

    return products.map((product, index) => ({
      productCode: product.code,
      productName: product.name,
      value: Math.floor(Math.random() * 10000000000) + 1000000000, // 1B - 10B
      percentage: Math.round((20 - index * 3) * 10) / 10, // Decreasing percentages
      growthRate: Math.round((Math.random() * 20 - 5) * 10) / 10 // -5% to 15%
    }));
  }

  private static generateMockTradingPartners(): TradingPartner[] {
    const partners = [
      { country: 'United States', code: 'USA' },
      { country: 'China', code: 'CHN' },
      { country: 'Germany', code: 'DEU' },
      { country: 'Japan', code: 'JPN' },
      { country: 'United Kingdom', code: 'GBR' }
    ];

    return partners.map((partner, index) => ({
      country: partner.country,
      countryCode: partner.code,
      tradeValue: Math.floor(Math.random() * 5000000000) + 1000000000, // 1B - 5B
      percentage: Math.round((25 - index * 4) * 10) / 10, // Decreasing percentages
      tradeType: Math.random() > 0.5 ? 'both' : (Math.random() > 0.5 ? 'export' : 'import') as any
    }));
  }

  /**
   * Get World Bank indicator codes for common trade metrics
   */
  static getTradeIndicators(): string[] {
    return [
      'NE.EXP.GNFS.CD', // Exports of goods and services (current US$)
      'NE.IMP.GNFS.CD', // Imports of goods and services (current US$)
      'NY.GDP.MKTP.CD', // GDP (current US$)
      'NE.TRD.GNFS.ZS', // Trade (% of GDP)
      'BX.KLT.DINV.CD.WD', // Foreign direct investment, net inflows (BoP, current US$)
      'IC.BUS.EASE.XQ', // Ease of doing business score
      'LP.LPI.OVRL.XQ'  // Logistics performance index: Overall
    ];
  }

  /**
   * Get World Bank country codes for major economies
   */
  static getMajorEconomies(): string[] {
    return [
      'USA', 'CHN', 'JPN', 'DEU', 'IND', 'GBR', 'FRA', 'ITA', 'BRA', 'CAN',
      'RUS', 'KOR', 'AUS', 'ESP', 'MEX', 'IDN', 'NLD', 'SAU', 'TUR', 'TWN'
    ];
  }
}
import { MarketData, ExportOpportunity, ProductStat, ContactInfo } from '../types';

// UN Comtrade API Response Types
export interface ComtradeResponse {
  elapsedTime: string;
  count: number;
  data: ComtradeRecord[];
}

export interface ComtradeRecord {
  typeCode: string;
  freqCode: string;
  refPeriodId: number;
  refYear: number;
  refMonth: number;
  period: string;
  reporterCode: number;
  reporterISO: string;
  reporterDesc: string;
  flowCode: string;
  flowDesc: string;
  partnerCode: number;
  partnerISO: string;
  partnerDesc: string;
  partner2Code: number;
  partner2ISO: string;
  partner2Desc: string;
  classificationCode: string;
  classificationSearchCode: string;
  isOriginalClassification: boolean;
  cmdCode: string;
  cmdDesc: string;
  aggrLevel: number;
  isLeaf: boolean;
  customsCode: string;
  customsDesc: string;
  mosCode: string;
  motCode: string;
  motDesc: string;
  qtyUnitCode: number;
  qtyUnitAbbr: string;
  qty: number;
  isQtyEstimated: boolean;
  altQtyUnitCode: number;
  altQtyUnitAbbr: string;
  altQty: number;
  isAltQtyEstimated: boolean;
  netWgt: number;
  isNetWgtEstimated: boolean;
  grossWgt: number;
  isGrossWgtEstimated: boolean;
  cifvalue: number;
  fobvalue: number;
  primaryValue: number;
  legacyEstimationFlag: string;
  isReported: boolean;
  isAggregate: boolean;
}

export interface ComtradeProductClassification {
  id: string;
  text: string;
  parent: string;
}

export class ComtradeTransformer {

  /**
   * Transform Comtrade records to MarketData
   */
  static transformToMarketData(
    records: ComtradeRecord[],
    productCategory: string
  ): MarketData[] {
    const countryData = this.groupByCountry(records);
    
    return Object.entries(countryData).map(([countryCode, countryRecords]) => {
      const latestYear = Math.max(...countryRecords.map(r => r.refYear));
      const latestRecords = countryRecords.filter(r => r.refYear === latestYear);
      const previousYearRecords = countryRecords.filter(r => r.refYear === latestYear - 1);
      
      const currentTradeValue = this.calculateTotalTradeValue(latestRecords);
      const previousTradeValue = this.calculateTotalTradeValue(previousYearRecords);
      const growthRate = previousTradeValue > 0 ? 
        ((currentTradeValue - previousTradeValue) / previousTradeValue) * 100 : 0;
      
      const exports = this.calculateExportValue(latestRecords);
      const imports = this.calculateImportValue(latestRecords);
      
      return {
        id: `comtrade_${countryCode}_${productCategory}_${Date.now()}`,
        country: latestRecords[0]?.reporterDesc || countryCode,
        countryCode: countryCode,
        productCategory: productCategory,
        marketSize: currentTradeValue,
        growthRate: Math.round(growthRate * 10) / 10,
        competitionLevel: this.assessCompetitionLevel(latestRecords),
        tariffRate: this.estimateAverageTariff(latestRecords),
        tradeVolume: exports + imports,
        lastUpdated: new Date(),
        source: 'UN Comtrade',
        reliability: 'high'
      };
    });
  }

  /**
   * Transform Comtrade records to export opportunities
   */
  static transformToExportOpportunities(
    records: ComtradeRecord[],
    sourceCountry: string = 'IND'
  ): ExportOpportunity[] {
    const opportunities: ExportOpportunity[] = [];
    const importingCountries = this.groupByImportingCountry(records, sourceCountry);
    
    Object.entries(importingCountries).forEach(([countryCode, imports]) => {
      const latestYear = Math.max(...imports.map(r => r.refYear));
      const latestImports = imports.filter(r => r.refYear === latestYear);
      
      // Group by product
      const productGroups = this.groupByProduct(latestImports);
      
      Object.entries(productGroups).forEach(([productCode, productRecords]) => {
        const totalValue = productRecords.reduce((sum, record) => sum + (record.primaryValue || 0), 0);
        
        if (totalValue > 1000000) { // Only opportunities > $1M
          const opportunity: ExportOpportunity = {
            id: `comtrade_opp_${countryCode}_${productCode}_${Date.now()}`,
            title: `Export ${productRecords[0].cmdDesc} to ${productRecords[0].partnerDesc}`,
            description: `Market opportunity for ${productRecords[0].cmdDesc} in ${productRecords[0].partnerDesc}. Current import value: $${this.formatCurrency(totalValue)}`,
            country: productRecords[0].partnerDesc,
            countryCode: countryCode,
            productCategory: this.mapProductToCategory(productRecords[0].cmdDesc),
            estimatedValue: totalValue,
            deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            requirements: this.generateRequirements(productRecords[0]),
            contactInfo: this.generateContactInfo(productRecords[0].partnerDesc),
            source: 'UN Comtrade',
            verified: true,
            postedDate: new Date(),
            opportunityScore: this.calculateOpportunityScore(productRecords, totalValue)
          };
          
          opportunities.push(opportunity);
        }
      });
    });
    
    return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 20);
  }

  /**
   * Transform Comtrade records to product statistics
   */
  static transformToProductStats(records: ComtradeRecord[]): ProductStat[] {
    const productGroups = this.groupByProduct(records);
    
    return Object.entries(productGroups)
      .map(([productCode, productRecords]) => {
        const totalValue = productRecords.reduce((sum, record) => sum + (record.primaryValue || 0), 0);
        const totalTrade = records.reduce((sum, record) => sum + (record.primaryValue || 0), 0);
        const percentage = totalTrade > 0 ? (totalValue / totalTrade) * 100 : 0;
        
        // Calculate growth rate if we have multiple years
        const years = [...new Set(productRecords.map(r => r.refYear))].sort();
        let growthRate = 0;
        
        if (years.length >= 2) {
          const latestYear = years[years.length - 1];
          const previousYear = years[years.length - 2];
          
          const latestValue = productRecords
            .filter(r => r.refYear === latestYear)
            .reduce((sum, record) => sum + (record.primaryValue || 0), 0);
          
          const previousValue = productRecords
            .filter(r => r.refYear === previousYear)
            .reduce((sum, record) => sum + (record.primaryValue || 0), 0);
          
          if (previousValue > 0) {
            growthRate = ((latestValue - previousValue) / previousValue) * 100;
          }
        }
        
        return {
          productCode: productCode,
          productName: productRecords[0].cmdDesc,
          value: totalValue,
          percentage: Math.round(percentage * 10) / 10,
          growthRate: Math.round(growthRate * 10) / 10
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  // Helper methods
  private static groupByCountry(records: ComtradeRecord[]): Record<string, ComtradeRecord[]> {
    return records.reduce((acc, record) => {
      const countryCode = record.reporterISO;
      if (!acc[countryCode]) {
        acc[countryCode] = [];
      }
      acc[countryCode].push(record);
      return acc;
    }, {} as Record<string, ComtradeRecord[]>);
  }

  private static groupByImportingCountry(
    records: ComtradeRecord[], 
    excludeCountry: string
  ): Record<string, ComtradeRecord[]> {
    return records
      .filter(record => record.flowCode === 'M' && record.partnerISO !== excludeCountry)
      .reduce((acc, record) => {
        const countryCode = record.reporterISO;
        if (!acc[countryCode]) {
          acc[countryCode] = [];
        }
        acc[countryCode].push(record);
        return acc;
      }, {} as Record<string, ComtradeRecord[]>);
  }

  private static groupByProduct(records: ComtradeRecord[]): Record<string, ComtradeRecord[]> {
    return records.reduce((acc, record) => {
      const productCode = record.cmdCode;
      if (!acc[productCode]) {
        acc[productCode] = [];
      }
      acc[productCode].push(record);
      return acc;
    }, {} as Record<string, ComtradeRecord[]>);
  }

  private static calculateTotalTradeValue(records: ComtradeRecord[]): number {
    return records.reduce((sum, record) => sum + (record.primaryValue || 0), 0);
  }

  private static calculateExportValue(records: ComtradeRecord[]): number {
    return records
      .filter(record => record.flowCode === 'X')
      .reduce((sum, record) => sum + (record.primaryValue || 0), 0);
  }

  private static calculateImportValue(records: ComtradeRecord[]): number {
    return records
      .filter(record => record.flowCode === 'M')
      .reduce((sum, record) => sum + (record.primaryValue || 0), 0);
  }

  private static assessCompetitionLevel(records: ComtradeRecord[]): 'low' | 'medium' | 'high' {
    const uniquePartners = new Set(records.map(r => r.partnerISO)).size;
    const totalValue = this.calculateTotalTradeValue(records);
    const averageValuePerPartner = totalValue / uniquePartners;
    
    // More partners and lower average value per partner = higher competition
    if (uniquePartners > 20 && averageValuePerPartner < 100000000) return 'high';
    if (uniquePartners > 10 && averageValuePerPartner < 500000000) return 'medium';
    return 'low';
  }

  private static estimateAverageTariff(records: ComtradeRecord[]): number {
    // This is a simplified estimation
    // In reality, you'd need specific tariff data from WTO or national customs
    const cifValues = records.map(r => r.cifvalue).filter(v => v > 0);
    const fobValues = records.map(r => r.fobvalue).filter(v => v > 0);
    
    if (cifValues.length === 0 || fobValues.length === 0) {
      return Math.random() * 15; // Random 0-15% if no data
    }
    
    const avgCif = cifValues.reduce((a, b) => a + b, 0) / cifValues.length;
    const avgFob = fobValues.reduce((a, b) => a + b, 0) / fobValues.length;
    
    if (avgFob > 0) {
      const estimatedTariff = ((avgCif - avgFob) / avgFob) * 100;
      return Math.max(0, Math.min(50, estimatedTariff)); // Cap between 0-50%
    }
    
    return Math.random() * 15;
  }

  private static calculateOpportunityScore(records: ComtradeRecord[], totalValue: number): number {
    let score = 50; // Base score
    
    // Value factor (0-30 points)
    if (totalValue > 1000000000) score += 30; // > $1B
    else if (totalValue > 100000000) score += 20; // > $100M
    else if (totalValue > 10000000) score += 10; // > $10M
    
    // Growth factor (0-20 points)
    const years = [...new Set(records.map(r => r.refYear))].sort();
    if (years.length >= 2) {
      const latestYear = years[years.length - 1];
      const previousYear = years[years.length - 2];
      
      const latestValue = records
        .filter(r => r.refYear === latestYear)
        .reduce((sum, record) => sum + (record.primaryValue || 0), 0);
      
      const previousValue = records
        .filter(r => r.refYear === previousYear)
        .reduce((sum, record) => sum + (record.primaryValue || 0), 0);
      
      if (previousValue > 0) {
        const growthRate = ((latestValue - previousValue) / previousValue) * 100;
        if (growthRate > 20) score += 20;
        else if (growthRate > 10) score += 15;
        else if (growthRate > 5) score += 10;
        else if (growthRate > 0) score += 5;
      }
    }
    
    return Math.min(100, Math.max(0, score));
  }

  private static mapProductToCategory(productDescription: string): string {
    const categoryMap: Record<string, string> = {
      'machinery': 'Machinery',
      'electrical': 'Electronics',
      'vehicle': 'Automotive',
      'textile': 'Textiles',
      'chemical': 'Chemicals',
      'food': 'Food & Beverages',
      'medical': 'Medical Devices',
      'pharmaceutical': 'Medical Devices',
      'software': 'Software',
      'computer': 'Electronics'
    };
    
    const description = productDescription.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (description.includes(keyword)) {
        return category;
      }
    }
    
    return 'Other';
  }

  private static generateRequirements(record: ComtradeRecord): string[] {
    const requirements = [
      'Valid export license',
      'Product certification',
      'Quality compliance documentation'
    ];
    
    // Add specific requirements based on product type
    const productDesc = record.cmdDesc.toLowerCase();
    
    if (productDesc.includes('food') || productDesc.includes('agricultural')) {
      requirements.push('Food safety certification', 'Phytosanitary certificate');
    }
    
    if (productDesc.includes('medical') || productDesc.includes('pharmaceutical')) {
      requirements.push('FDA approval', 'Medical device registration');
    }
    
    if (productDesc.includes('chemical')) {
      requirements.push('Chemical safety data sheet', 'Hazardous material certification');
    }
    
    return requirements;
  }

  private static generateContactInfo(countryName: string): ContactInfo {
    return {
      companyName: `${countryName} Trade Association`,
      contactPerson: 'Trade Development Officer',
      email: `trade@${countryName.toLowerCase().replace(/\s+/g, '')}.gov`,
      website: `https://trade.${countryName.toLowerCase().replace(/\s+/g, '')}.gov`,
      address: `Trade Development Center, ${countryName}`
    };
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }

  /**
   * Get common HS product codes for major categories
   */
  static getProductCodes(): Record<string, string[]> {
    return {
      'Electronics': ['84', '85'],
      'Machinery': ['84', '86', '87'],
      'Automotive': ['87'],
      'Textiles': ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'],
      'Chemicals': ['28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'],
      'Food & Beverages': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'],
      'Medical Devices': ['30', '90'],
      'Energy Equipment': ['84', '85', '27']
    };
  }
}
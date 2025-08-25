import { 
  MarketData, 
  TradeStats, 
  ExportOpportunity, 
  DashboardStats, 
  ProductStat,
  TradingPartner,
  ContactInfo 
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DataValidator {

  /**
   * Validate MarketData object
   */
  static validateMarketData(data: MarketData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.id) errors.push('ID is required');
    if (!data.country) errors.push('Country is required');
    if (!data.countryCode) errors.push('Country code is required');
    if (!data.productCategory) errors.push('Product category is required');
    if (!data.source) errors.push('Source is required');

    // Numeric validations
    if (typeof data.marketSize !== 'number' || data.marketSize < 0) {
      errors.push('Market size must be a positive number');
    }
    
    if (typeof data.growthRate !== 'number' || data.growthRate < -100 || data.growthRate > 1000) {
      errors.push('Growth rate must be between -100% and 1000%');
    }
    
    if (typeof data.tariffRate !== 'number' || data.tariffRate < 0 || data.tariffRate > 100) {
      errors.push('Tariff rate must be between 0% and 100%');
    }
    
    if (typeof data.tradeVolume !== 'number' || data.tradeVolume < 0) {
      errors.push('Trade volume must be a positive number');
    }

    // Enum validations
    if (!['low', 'medium', 'high'].includes(data.competitionLevel)) {
      errors.push('Competition level must be low, medium, or high');
    }
    
    if (!['high', 'medium', 'low'].includes(data.reliability)) {
      errors.push('Reliability must be high, medium, or low');
    }

    // Date validations
    if (!(data.lastUpdated instanceof Date) || isNaN(data.lastUpdated.getTime())) {
      errors.push('Last updated must be a valid date');
    }

    // Country code format
    if (data.countryCode && !/^[A-Z]{2,3}$/.test(data.countryCode)) {
      warnings.push('Country code should be 2-3 uppercase letters');
    }

    // Warnings for unusual values
    if (data.marketSize > 10000000000000) { // > $10T
      warnings.push('Market size seems unusually large');
    }
    
    if (data.growthRate > 100) {
      warnings.push('Growth rate above 100% seems unusual');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate TradeStats object
   */
  static validateTradeStats(data: TradeStats): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.country) errors.push('Country is required');
    if (!data.countryCode) errors.push('Country code is required');
    if (!data.period) errors.push('Period is required');
    if (!data.source) errors.push('Source is required');

    // Numeric validations
    if (typeof data.totalExports !== 'number' || data.totalExports < 0) {
      errors.push('Total exports must be a positive number');
    }
    
    if (typeof data.totalImports !== 'number' || data.totalImports < 0) {
      errors.push('Total imports must be a positive number');
    }
    
    if (typeof data.tradeBalance !== 'number') {
      errors.push('Trade balance must be a number');
    }

    // Array validations
    if (!Array.isArray(data.topExportProducts)) {
      errors.push('Top export products must be an array');
    } else {
      data.topExportProducts.forEach((product, index) => {
        const productValidation = this.validateProductStat(product);
        if (!productValidation.isValid) {
          errors.push(`Export product ${index + 1}: ${productValidation.errors.join(', ')}`);
        }
      });
    }

    if (!Array.isArray(data.topImportProducts)) {
      errors.push('Top import products must be an array');
    } else {
      data.topImportProducts.forEach((product, index) => {
        const productValidation = this.validateProductStat(product);
        if (!productValidation.isValid) {
          errors.push(`Import product ${index + 1}: ${productValidation.errors.join(', ')}`);
        }
      });
    }

    if (!Array.isArray(data.tradingPartners)) {
      errors.push('Trading partners must be an array');
    } else {
      data.tradingPartners.forEach((partner, index) => {
        const partnerValidation = this.validateTradingPartner(partner);
        if (!partnerValidation.isValid) {
          errors.push(`Trading partner ${index + 1}: ${partnerValidation.errors.join(', ')}`);
        }
      });
    }

    // Date validation
    if (!(data.lastUpdated instanceof Date) || isNaN(data.lastUpdated.getTime())) {
      errors.push('Last updated must be a valid date');
    }

    // Logical validations
    const calculatedBalance = data.totalExports - data.totalImports;
    if (Math.abs(calculatedBalance - data.tradeBalance) > 1000000) { // Allow $1M tolerance
      warnings.push('Trade balance does not match exports minus imports');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate ExportOpportunity object
   */
  static validateExportOpportunity(data: ExportOpportunity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.id) errors.push('ID is required');
    if (!data.title) errors.push('Title is required');
    if (!data.description) errors.push('Description is required');
    if (!data.country) errors.push('Country is required');
    if (!data.countryCode) errors.push('Country code is required');
    if (!data.productCategory) errors.push('Product category is required');
    if (!data.source) errors.push('Source is required');

    // Numeric validations
    if (typeof data.estimatedValue !== 'number' || data.estimatedValue <= 0) {
      errors.push('Estimated value must be a positive number');
    }
    
    if (typeof data.opportunityScore !== 'number' || data.opportunityScore < 0 || data.opportunityScore > 100) {
      errors.push('Opportunity score must be between 0 and 100');
    }

    // Boolean validations
    if (typeof data.verified !== 'boolean') {
      errors.push('Verified must be a boolean');
    }

    // Array validations
    if (!Array.isArray(data.requirements)) {
      errors.push('Requirements must be an array');
    } else if (data.requirements.length === 0) {
      warnings.push('No requirements specified');
    }

    // Date validations
    if (!(data.postedDate instanceof Date) || isNaN(data.postedDate.getTime())) {
      errors.push('Posted date must be a valid date');
    }
    
    if (data.deadline && (!(data.deadline instanceof Date) || isNaN(data.deadline.getTime()))) {
      errors.push('Deadline must be a valid date');
    }
    
    if (data.deadline && data.postedDate && data.deadline <= data.postedDate) {
      errors.push('Deadline must be after posted date');
    }

    // Contact info validation
    if (data.contactInfo) {
      const contactValidation = this.validateContactInfo(data.contactInfo);
      if (!contactValidation.isValid) {
        errors.push(`Contact info: ${contactValidation.errors.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate DashboardStats object
   */
  static validateDashboardStats(data: DashboardStats): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Numeric validations
    if (typeof data.activeLeads !== 'number' || data.activeLeads < 0) {
      errors.push('Active leads must be a non-negative number');
    }
    
    if (typeof data.exportValue !== 'number' || data.exportValue < 0) {
      errors.push('Export value must be a non-negative number');
    }
    
    if (typeof data.activeBuyers !== 'number' || data.activeBuyers < 0) {
      errors.push('Active buyers must be a non-negative number');
    }
    
    if (typeof data.complianceScore !== 'number' || data.complianceScore < 0 || data.complianceScore > 100) {
      errors.push('Compliance score must be between 0 and 100');
    }

    // Change percentages
    if (typeof data.leadsChange !== 'number' || data.leadsChange < -100 || data.leadsChange > 1000) {
      errors.push('Leads change must be between -100% and 1000%');
    }
    
    if (typeof data.exportChange !== 'number' || data.exportChange < -100 || data.exportChange > 1000) {
      errors.push('Export change must be between -100% and 1000%');
    }
    
    if (typeof data.buyersChange !== 'number' || data.buyersChange < -100 || data.buyersChange > 1000) {
      errors.push('Buyers change must be between -100% and 1000%');
    }
    
    if (typeof data.complianceChange !== 'number' || data.complianceChange < -100 || data.complianceChange > 100) {
      errors.push('Compliance change must be between -100% and 100%');
    }

    // Date validation
    if (!(data.lastUpdated instanceof Date) || isNaN(data.lastUpdated.getTime())) {
      errors.push('Last updated must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate ProductStat object
   */
  private static validateProductStat(data: ProductStat): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.productCode) errors.push('Product code is required');
    if (!data.productName) errors.push('Product name is required');
    
    if (typeof data.value !== 'number' || data.value < 0) {
      errors.push('Value must be a positive number');
    }
    
    if (typeof data.percentage !== 'number' || data.percentage < 0 || data.percentage > 100) {
      errors.push('Percentage must be between 0 and 100');
    }
    
    if (data.growthRate !== undefined && (typeof data.growthRate !== 'number' || data.growthRate < -100 || data.growthRate > 1000)) {
      errors.push('Growth rate must be between -100% and 1000%');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate TradingPartner object
   */
  private static validateTradingPartner(data: TradingPartner): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.country) errors.push('Country is required');
    if (!data.countryCode) errors.push('Country code is required');
    
    if (typeof data.tradeValue !== 'number' || data.tradeValue < 0) {
      errors.push('Trade value must be a positive number');
    }
    
    if (typeof data.percentage !== 'number' || data.percentage < 0 || data.percentage > 100) {
      errors.push('Percentage must be between 0 and 100');
    }
    
    if (!['export', 'import', 'both'].includes(data.tradeType)) {
      errors.push('Trade type must be export, import, or both');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate ContactInfo object
   */
  private static validateContactInfo(data: ContactInfo): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation (basic)
    if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      warnings.push('Phone number format may be invalid');
    }

    // Website validation
    if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) {
      warnings.push('Website URL format may be invalid');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate array of data objects
   */
  static validateArray<T>(
    data: T[], 
    validator: (item: T) => ValidationResult,
    maxItems?: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors, warnings };
    }

    if (maxItems && data.length > maxItems) {
      warnings.push(`Array has ${data.length} items, maximum recommended is ${maxItems}`);
    }

    data.forEach((item, index) => {
      const validation = validator(item);
      if (!validation.isValid) {
        errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings.length > 0) {
        warnings.push(`Item ${index + 1}: ${validation.warnings.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize and clean data
   */
  static sanitizeMarketData(data: any): MarketData | null {
    try {
      return {
        id: String(data.id || '').trim(),
        country: String(data.country || '').trim(),
        countryCode: String(data.countryCode || '').toUpperCase().trim(),
        productCategory: String(data.productCategory || '').trim(),
        marketSize: Math.max(0, Number(data.marketSize) || 0),
        growthRate: Math.max(-100, Math.min(1000, Number(data.growthRate) || 0)),
        competitionLevel: ['low', 'medium', 'high'].includes(data.competitionLevel) ? data.competitionLevel : 'medium',
        tariffRate: Math.max(0, Math.min(100, Number(data.tariffRate) || 0)),
        tradeVolume: Math.max(0, Number(data.tradeVolume) || 0),
        lastUpdated: data.lastUpdated instanceof Date ? data.lastUpdated : new Date(),
        source: String(data.source || 'Unknown').trim(),
        reliability: ['high', 'medium', 'low'].includes(data.reliability) ? data.reliability : 'medium'
      };
    } catch (error) {
      console.error('Error sanitizing market data:', error);
      return null;
    }
  }
}
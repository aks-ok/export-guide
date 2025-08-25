// Data Transformers and Validators

export { WorldBankTransformer } from './WorldBankTransformer';
export { ComtradeTransformer } from './ComtradeTransformer';
export { DataValidator } from './DataValidator';

// Re-export types for convenience
export type {
  WorldBankResponse,
  WorldBankIndicator,
  WorldBankCountry
} from './WorldBankTransformer';

export type {
  ComtradeResponse,
  ComtradeRecord,
  ComtradeProductClassification
} from './ComtradeTransformer';

export type {
  ValidationResult
} from './DataValidator';

// Utility functions for data transformation
export class DataTransformUtils {
  
  /**
   * Convert currency values to USD (simplified)
   */
  static convertToUSD(amount: number, fromCurrency: string = 'USD'): number {
    // In a real implementation, this would use current exchange rates
    const exchangeRates: Record<string, number> = {
      'USD': 1,
      'EUR': 1.1,
      'GBP': 1.25,
      'JPY': 0.0067,
      'CNY': 0.14,
      'INR': 0.012,
      'CAD': 0.74,
      'AUD': 0.67
    };
    
    return amount * (exchangeRates[fromCurrency] || 1);
  }

  /**
   * Format large numbers for display
   */
  static formatLargeNumber(num: number): string {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  }

  /**
   * Calculate percentage change
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Normalize country codes to ISO 3166-1 alpha-3
   */
  static normalizeCountryCode(code: string): string {
    const codeMap: Record<string, string> = {
      'US': 'USA',
      'UK': 'GBR',
      'CN': 'CHN',
      'JP': 'JPN',
      'DE': 'DEU',
      'FR': 'FRA',
      'IT': 'ITA',
      'ES': 'ESP',
      'CA': 'CAN',
      'AU': 'AUS',
      'IN': 'IND',
      'BR': 'BRA',
      'RU': 'RUS',
      'KR': 'KOR',
      'MX': 'MEX',
      'ID': 'IDN',
      'NL': 'NLD',
      'SA': 'SAU',
      'TR': 'TUR',
      'TW': 'TWN'
    };
    
    const upperCode = code.toUpperCase();
    return codeMap[upperCode] || upperCode;
  }

  /**
   * Clean and validate product category names
   */
  static normalizeProductCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'electronic': 'Electronics',
      'electronics': 'Electronics',
      'machinery': 'Machinery',
      'machine': 'Machinery',
      'automotive': 'Automotive',
      'automobile': 'Automotive',
      'vehicle': 'Automotive',
      'textile': 'Textiles',
      'textiles': 'Textiles',
      'clothing': 'Textiles',
      'apparel': 'Textiles',
      'chemical': 'Chemicals',
      'chemicals': 'Chemicals',
      'pharmaceutical': 'Medical Devices',
      'medical': 'Medical Devices',
      'food': 'Food & Beverages',
      'beverage': 'Food & Beverages',
      'agriculture': 'Food & Beverages',
      'software': 'Software',
      'it': 'Software',
      'technology': 'Electronics',
      'energy': 'Energy Equipment',
      'construction': 'Construction Materials'
    };
    
    const lowerCategory = category.toLowerCase().trim();
    return categoryMap[lowerCategory] || this.capitalizeWords(category);
  }

  /**
   * Capitalize words in a string
   */
  static capitalizeWords(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Generate a unique ID for data objects
   */
  static generateId(prefix: string = 'data'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * Merge multiple data arrays and remove duplicates
   */
  static mergeAndDeduplicate<T extends { id: string }>(arrays: T[][]): T[] {
    const merged = arrays.flat();
    const seen = new Set<string>();
    
    return merged.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  /**
   * Sort data by multiple criteria
   */
  static multiSort<T>(
    data: T[], 
    sortCriteria: Array<{ key: keyof T; direction: 'asc' | 'desc' }>
  ): T[] {
    return [...data].sort((a, b) => {
      for (const criterion of sortCriteria) {
        const aVal = a[criterion.key];
        const bVal = b[criterion.key];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (comparison !== 0) {
          return criterion.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Filter data by date range
   */
  static filterByDateRange<T extends { lastUpdated: Date }>(
    data: T[],
    startDate?: Date,
    endDate?: Date
  ): T[] {
    return data.filter(item => {
      if (startDate && item.lastUpdated < startDate) return false;
      if (endDate && item.lastUpdated > endDate) return false;
      return true;
    });
  }

  /**
   * Group data by a specific field
   */
  static groupBy<T, K extends keyof T>(data: T[], key: K): Record<string, T[]> {
    return data.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Calculate statistics for numeric data
   */
  static calculateStats(numbers: number[]): {
    min: number;
    max: number;
    mean: number;
    median: number;
    sum: number;
    count: number;
  } {
    if (numbers.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, sum: 0, count: 0 };
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median,
      sum,
      count: numbers.length
    };
  }
}
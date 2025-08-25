// Import for internal use
import { worldBankService } from './WorldBankService';

// API Services
export { WorldBankService, worldBankService } from './WorldBankService';

// Service registry for managing multiple API services
export class ApiServiceRegistry {
  private static services: Map<string, any> = new Map();

  public static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  public static get<T>(name: string): T | undefined {
    return this.services.get(name);
  }

  public static getAll(): Map<string, any> {
    return new Map(this.services);
  }

  public static remove(name: string): boolean {
    return this.services.delete(name);
  }

  public static clear(): void {
    this.services.clear();
  }

  public static has(name: string): boolean {
    return this.services.has(name);
  }

  public static async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, service] of Array.from(this.services.entries())) {
      try {
        if (typeof service.healthCheck === 'function') {
          results[name] = await service.healthCheck();
        } else {
          results[name] = true; // Assume healthy if no health check method
        }
      } catch (error) {
        console.warn(`Health check failed for service ${name}:`, error);
        results[name] = false;
      }
    }
    
    return results;
  }
}

// Initialize and register services
export const initializeApiServices = () => {
  // Register World Bank service
  ApiServiceRegistry.register('worldBank', worldBankService);
  
  console.log('API Services initialized:', Array.from(ApiServiceRegistry.getAll().keys()));
};

// Utility functions for service management
export const getServiceHealth = async (): Promise<{
  overall: boolean;
  services: Record<string, boolean>;
  timestamp: Date;
}> => {
  const serviceHealth = await ApiServiceRegistry.healthCheckAll();
  const overall = Object.values(serviceHealth).every(healthy => healthy);
  
  return {
    overall,
    services: serviceHealth,
    timestamp: new Date()
  };
};

export const getServiceStats = (): Record<string, any> => {
  const stats: Record<string, any> = {};
  
  for (const [name, service] of Array.from(ApiServiceRegistry.getAll().entries())) {
    if (typeof service.getUsageStats === 'function') {
      stats[name] = service.getUsageStats();
    }
  }
  
  return stats;
};
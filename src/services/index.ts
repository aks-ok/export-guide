// Main exports for the services layer

import { cacheManager } from './CacheManager';

import { cacheManager } from './CacheManager';

import { cacheManager } from './CacheManager';

import { apiConfig } from './ApiService';

import { setupGlobalErrorHandling } from './ErrorHandler';

import { apiConfig } from './ApiService';

import { apiConfig } from './ApiService';

import { apiConfig } from './ApiService';

import { apiConfig } from './ApiService';

import { BaseApiService } from './ApiService';

// Types
export * from './types';

// Core Services
export { BaseApiService, apiConfig } from './ApiService';
export { LocalStorageCacheManager, cacheManager } from './CacheManager';
export { ErrorHandler, errorHandler, useErrorHandler, setupGlobalErrorHandling } from './ErrorHandler';
export { DashboardService, dashboardService } from './DashboardService';

// Service Factory
export class ServiceFactory {
  private static services: Map<string, any> = new Map();

  public static getService<T>(serviceName: string, factory: () => T): T {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, factory());
    }
    return this.services.get(serviceName);
  }

  public static clearServices(): void {
    this.services.clear();
  }

  public static hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }
}

// Utility functions
export const createApiService = (baseURL: string) => {
  return new BaseApiService(baseURL);
};

export const getEnvironmentConfig = () => {
  return {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isRealDataEnabled: apiConfig.isRealDataEnabled(),
    shouldFallbackToMock: apiConfig.shouldFallbackToMock(),
    isDebugMode: apiConfig.isDebugMode(),
    cacheTTL: apiConfig.getCacheTTL()
  };
};

// Initialize services
export const initializeServices = () => {
  // Setup global error handling
  setupGlobalErrorHandling();
  
  // Log initialization
  if (apiConfig.isDebugMode()) {
    console.log('🚀 Export Guide Services Initialized');
    console.log('Configuration:', getEnvironmentConfig());
    console.log('Cache Stats:', cacheManager.getStats());
  }
};

// Service health check
export const checkServicesHealth = async () => {
  const health = {
    cache: true,
    apis: {} as Record<string, boolean>
  };

  try {
    // Check cache
    cacheManager.set('health_check', 'test', 1000);
    const testValue = cacheManager.get('health_check');
    health.cache = testValue === 'test';
  } catch (error) {
    health.cache = false;
  }

  return health;
};
import { CacheManager, CacheEntry, CacheStats } from './types';

export class LocalStorageCacheManager implements CacheManager {
  private readonly prefix = 'export_guide_cache_';
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly maxSize = 50 * 1024 * 1024; // 50MB in bytes
  
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0
  };

  constructor() {
    this.cleanExpiredEntries();
  }

  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const item = localStorage.getItem(cacheKey);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(item);
      
      // Check if expired
      if (this.isEntryExpired(cacheEntry)) {
        localStorage.removeItem(cacheKey);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return cacheEntry.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: new Date(),
        ttl: ttl || this.defaultTTL,
        key: cacheKey
      };

      const serialized = JSON.stringify(entry);
      
      // Check size limits
      if (this.getCurrentCacheSize() + serialized.length > this.maxSize) {
        this.evictOldestEntries();
      }

      localStorage.setItem(cacheKey, serialized);
      this.stats.sets++;
    } catch (error) {
      console.warn('Cache set error:', error);
      // If localStorage is full, try to clear some space
      if (error instanceof DOMException && error.code === 22) {
        this.evictOldestEntries();
        try {
          localStorage.setItem(this.getCacheKey(key), JSON.stringify({
            data,
            timestamp: new Date(),
            ttl: ttl || this.defaultTTL,
            key: this.getCacheKey(key)
          }));
          this.stats.sets++;
        } catch (retryError) {
          console.error('Cache set retry failed:', retryError);
        }
      }
    }
  }

  invalidate(pattern: string): void {
    try {
      const keys = this.getAllCacheKeys();
      const regex = new RegExp(pattern);
      
      keys.forEach(key => {
        if (regex.test(key)) {
          localStorage.removeItem(key);
          this.stats.invalidations++;
        }
      });
    } catch (error) {
      console.warn('Cache invalidate error:', error);
    }
  }

  clear(): void {
    try {
      const keys = this.getAllCacheKeys();
      keys.forEach(key => localStorage.removeItem(key));
      this.stats = { hits: 0, misses: 0, sets: 0, invalidations: 0 };
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  isExpired(key: string): boolean {
    try {
      const cacheKey = this.getCacheKey(key);
      const item = localStorage.getItem(cacheKey);
      
      if (!item) return true;

      const cacheEntry: CacheEntry<any> = JSON.parse(item);
      return this.isEntryExpired(cacheEntry);
    } catch (error) {
      console.warn('Cache isExpired error:', error);
      return true;
    }
  }

  getStats(): CacheStats {
    const entries = this.getAllCacheEntries();
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: entries.length,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      totalSize: this.getCurrentCacheSize(),
      oldestEntry: entries.length > 0 ? 
        new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) : undefined,
      newestEntry: entries.length > 0 ? 
        new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) : undefined
    };
  }

  // Private helper methods
  private getCacheKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getAllCacheKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private getAllCacheEntries(): CacheEntry<any>[] {
    const entries: CacheEntry<any>[] = [];
    const keys = this.getAllCacheKeys();
    
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry = JSON.parse(item);
          entry.timestamp = new Date(entry.timestamp);
          entries.push(entry);
        }
      } catch (error) {
        console.warn('Error parsing cache entry:', error);
      }
    });
    
    return entries;
  }

  private isEntryExpired(entry: CacheEntry<any>): boolean {
    const now = new Date().getTime();
    const entryTime = new Date(entry.timestamp).getTime();
    return (now - entryTime) > entry.ttl;
  }

  private getCurrentCacheSize(): number {
    let totalSize = 0;
    const keys = this.getAllCacheKeys();
    
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    });
    
    return totalSize;
  }

  private evictOldestEntries(): void {
    const entries = this.getAllCacheEntries();
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  private cleanExpiredEntries(): void {
    const entries = this.getAllCacheEntries();
    
    entries.forEach(entry => {
      if (this.isEntryExpired(entry)) {
        localStorage.removeItem(entry.key);
      }
    });
  }

  // Utility methods for debugging
  public debugInfo(): void {
    console.group('Cache Debug Info');
    console.log('Stats:', this.getStats());
    console.log('All entries:', this.getAllCacheEntries());
    console.log('Current size (bytes):', this.getCurrentCacheSize());
    console.log('Max size (bytes):', this.maxSize);
    console.groupEnd();
  }

  public exportCache(): string {
    const entries = this.getAllCacheEntries();
    return JSON.stringify(entries, null, 2);
  }

  public importCache(data: string): void {
    try {
      const entries: CacheEntry<any>[] = JSON.parse(data);
      entries.forEach(entry => {
        if (!this.isEntryExpired(entry)) {
          localStorage.setItem(entry.key, JSON.stringify(entry));
        }
      });
    } catch (error) {
      console.error('Cache import error:', error);
    }
  }
}

// Singleton instance
export const cacheManager = new LocalStorageCacheManager();
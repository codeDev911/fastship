/**
 * Persistent Distance Cache
 * 
 * Saves distance calculations to disk for persistence across server restarts.
 * Cache entries expire after 30 days.
 * 
 * Cache file structure:
 * {
 *   "pickupCity_pickupState__deliveryCity_deliveryState": {
 *     "pickupCity": "Karachi",
 *     "pickupState": "Sindh",
 *     "deliveryCity": "Lahore", 
 *     "deliveryState": "Punjab",
 *     "distance": 1287.5,
 *     "duration": 18900,
 *     "method": "openroute",
 *     "savedAt": 1713222000000,
 *     "updatedAt": 1713222000000
 *   }
 * }
 */

import * as fs from 'fs';
import * as path from 'path';

interface CacheEntry {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  distance: number;
  duration: number;
  method: 'openroute' | 'haversine';
  savedAt: number;
  updatedAt: number;
}

interface CacheData {
  [key: string]: CacheEntry;
}

const CACHE_DIR = path.join(process.cwd(), 'lib', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'distance-cache.json');
const CACHE_EXPIRY_DAYS = 30;
const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read cache file from disk
 */
function readCacheFile(): CacheData {
  try {
    ensureCacheDir();
    if (!fs.existsSync(CACHE_FILE)) {
      return {};
    }
    const content = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading cache file:', error);
    return {};
  }
}

/**
 * Write cache file to disk
 */
function writeCacheFile(data: CacheData): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cache file:', error);
  }
}

/**
 * Generate cache key from route details
 */
function getCacheKey(
  pickupCity: string,
  pickupState: string,
  deliveryCity: string,
  deliveryState: string
): string {
  return `${pickupCity}_${pickupState}__${deliveryCity}_${deliveryState}`;
}

/**
 * Check if cache entry is still valid (not expired)
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  const age = now - entry.updatedAt;
  return age < CACHE_EXPIRY_MS;
}

/**
 * Get distance from persistent cache
 * @returns CacheEntry if found and valid, null otherwise
 */
export function getFromPersistentCache(
  pickupCity: string,
  pickupState: string,
  deliveryCity: string,
  deliveryState: string
): CacheEntry | null {
  try {
    const cacheKey = getCacheKey(pickupCity, pickupState, deliveryCity, deliveryState);
    const cacheData = readCacheFile();
    const entry = cacheData[cacheKey];

    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid
    if (!isCacheValid(entry)) {
      console.log(`[persistent-cache] Cache expired for ${cacheKey}`);
      // Remove expired entry
      delete cacheData[cacheKey];
      writeCacheFile(cacheData);
      return null;
    }

    return entry;
  } catch (error) {
    console.error('Error getting from persistent cache:', error);
    return null;
  }
}

/**
 * Save distance to persistent cache
 */
export function saveToPersistentCache(
  pickupCity: string,
  pickupState: string,
  deliveryCity: string,
  deliveryState: string,
  distance: number,
  duration: number,
  method: 'openroute' | 'haversine'
): void {
  try {
    const cacheKey = getCacheKey(pickupCity, pickupState, deliveryCity, deliveryState);
    const cacheData = readCacheFile();
    const now = Date.now();

    const entry: CacheEntry = {
      pickupCity,
      pickupState,
      deliveryCity,
      deliveryState,
      distance,
      duration,
      method,
      savedAt: now,
      updatedAt: now,
    };

    cacheData[cacheKey] = entry;
    writeCacheFile(cacheData);

    console.log(`[persistent-cache] Saved to cache: ${cacheKey}`, {
      distance: distance?.toFixed(2),
      method,
    });
  } catch (error) {
    console.error('Error saving to persistent cache:', error);
  }
}

/**
 * Clear all expired cache entries
 */
export function cleanupExpiredCache(): void {
  try {
    const cacheData = readCacheFile();
    let removedCount = 0;

    Object.keys(cacheData).forEach((key) => {
      const entry = cacheData[key];
      if (!isCacheValid(entry)) {
        delete cacheData[key];
        removedCount++;
      }
    });

    if (removedCount > 0) {
      writeCacheFile(cacheData);
      console.log(`[persistent-cache] Cleaned up ${removedCount} expired entries`);
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Clear all cache
 */
export function clearPersistentCache(): void {
  try {
    ensureCacheDir();
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('[persistent-cache] Cache cleared');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getPersistentCacheStats(): {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  averageAgeInDays: number;
} {
  try {
    const cacheData = readCacheFile();
    const entries = Object.values(cacheData);
    let validCount = 0;
    let totalAge = 0;

    entries.forEach((entry) => {
      if (isCacheValid(entry)) {
        validCount++;
        totalAge += Date.now() - entry.updatedAt;
      }
    });

    const expiredCount = entries.length - validCount;
    const averageAgeInDays =
      validCount > 0
        ? Math.floor(totalAge / validCount / (1000 * 60 * 60 * 24))
        : 0;

    return {
      totalEntries: entries.length,
      validEntries: validCount,
      expiredEntries: expiredCount,
      averageAgeInDays,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      averageAgeInDays: 0,
    };
  }
}

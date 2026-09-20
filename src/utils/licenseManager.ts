import { Feature, LicenseEdition, LicenseInfo, LicenseStatus } from '../types';
import {
  ProductionLicenseManager,
  maskLicenseKey,
  normalizeLicenseKey,
  isValidLicenseFormat,
  getOrCreateDeviceId,
  getOrCreateBusinessId,
  PRODUCTION_LICENSE_INVENTORY,
  LICENSE_STORAGE_KEY,
  DEVICE_ID_KEY,
} from './cryptoLicense';

export {
  maskLicenseKey,
  normalizeLicenseKey,
  isValidLicenseFormat,
  getOrCreateDeviceId,
  getOrCreateBusinessId,
  PRODUCTION_LICENSE_INVENTORY,
  LICENSE_STORAGE_KEY,
  DEVICE_ID_KEY,
};

// FREE Version Structural Boundaries & Ceilings
export const FREE_LIMITS = {
  MAX_PRODUCTS: 100,
  MAX_CUSTOMERS: 100,
  MAX_SUPPLIERS: 100,
  MAX_INVOICES: 500,
  MAX_SALES: 500,
  MAX_PURCHASES: 500,
  MAX_SCANNER_HISTORY: 1000,
};

// Default FREE License State
export const DEFAULT_FREE_LICENSE: LicenseInfo = {
  licenseId: 'HANOUTI40-FREE-EDITION',
  edition: 'FREE',
  status: 'NOT_ACTIVATED',
  licenseType: 'Version Gratuite / Free Starter',
};

// Case-insensitive letter validation for reset password 'karim40'
export function isValidResetPassword(input: string): boolean {
  if (!input) return false;
  // Strict rule: No leading/trailing spaces or accidental extra characters
  // Must be exactly 7 characters: 5 letters case-insensitive 'karim' + exact digits '40'
  if (input.length !== 7) return false;
  const letters = input.slice(0, 5).toLowerCase();
  const digits = input.slice(5);
  return letters === 'karim' && digits === '40';
}

/**
 * Central Production License Manager
 * Backed by cryptographic verification and the 20 production licenses inventory.
 */
export class LicenseManager {
  static getActiveLicense(): LicenseInfo {
    return ProductionLicenseManager.getActiveLicense();
  }

  static isProActive(): boolean {
    return ProductionLicenseManager.isProActive();
  }

  /**
   * Activate a production license key (H40-PRO-XXXX-XXXX-XXXX)
   */
  static activateLicenseKey(
    rawKey: string,
    options?: { deviceType?: 'ANDROID' | 'WINDOWS'; deviceName?: string }
  ): {
    success: boolean;
    message: string;
    license?: LicenseInfo;
    status?: LicenseStatus;
  } {
    return ProductionLicenseManager.activateKey(rawKey, options);
  }

  /**
   * Deactivate license on current device
   */
  static deactivateLicense(): void {
    ProductionLicenseManager.deactivateCurrentDevice();
  }
}

/**
 * Feature Entitlement Manager:
 * Central service to check whether an operation or view is permitted.
 */
export class FeatureAccessManager {
  static isAllowed(feature: Feature, currentLicense?: LicenseInfo): boolean {
    const lic = currentLicense || LicenseManager.getActiveLicense();
    const isPro = lic.edition === 'PRO' && lic.status === 'ACTIVE';

    if (isPro) return true;

    // In FREE edition, check if feature is strictly PRO-only
    switch (feature) {
      case Feature.UNLIMITED_PRODUCTS:
      case Feature.UNLIMITED_CUSTOMERS:
      case Feature.UNLIMITED_SUPPLIERS:
      case Feature.UNLIMITED_INVOICES:
      case Feature.UNLIMITED_SALES:
      case Feature.UNLIMITED_PURCHASES:
      case Feature.ADVANCED_DASHBOARD:
      case Feature.ADVANCED_REPORTS:
      case Feature.EXPORT_ALL_PDF:
      case Feature.FULL_PDF_REPORTS:
      case Feature.STATEMENTS_PDF:
      case Feature.INVENTORY_PDF:
      case Feature.PROFIT_LOSS_PDF:
      case Feature.ADVANCED_ANALYTICS:
      case Feature.HID_SCANNER:
      case Feature.STOCK_ALERTS:
      case Feature.EXPIRY_TRACKING:
      case Feature.CUSTOM_INVOICE_TEMPLATES:
      case Feature.COMPANY_BRANDING:
      case Feature.AUTOMATIC_BACKUP:
        return false;
      default:
        return true;
    }
  }

  // Verify numerical limits for FREE tier
  static checkLimit(
    limitType: keyof typeof FREE_LIMITS,
    currentCount: number,
    currentLicense?: LicenseInfo
  ): { allowed: boolean; maxLimit: number; message?: string } {
    const lic = currentLicense || LicenseManager.getActiveLicense();
    if (lic.edition === 'PRO' && lic.status === 'ACTIVE') {
      return { allowed: true, maxLimit: Infinity };
    }

    const maxLimit = FREE_LIMITS[limitType];
    if (currentCount >= maxLimit) {
      return {
        allowed: false,
        maxLimit,
        message: `Cette fonctionnalité a atteint la limite de la version GRATUITE (${maxLimit} max). Passez à Hanouti 40 PRO pour un accès illimité.`,
      };
    }

    return { allowed: true, maxLimit };
  }
}

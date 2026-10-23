import { Injectable, signal, computed } from '@angular/core';

export interface Tenant {
  id: string; // 'tenant-1' | 'tenant-2'
  name: string;
  code: string;
  description?: string;
  color?: string;
}

export interface UserAccount {
  id: string; // 'user-1a' | 'user-1b' | 'user-2a' | 'user-2b' | 'admin'
  username: string;
  displayName: string;
  tenantId: string;
  role: string;
  fieldCountLabel?: string;
  password: string;
  avatarLetter: string;
}

export interface ConfigurableField {
  key: string;
  label: string;
  category: 'core' | 'codes' | 'system' | 'custom';
  description?: string;
  isCustom?: boolean;
  type?: 'text' | 'number' | 'boolean' | 'select';
  required?: boolean;
}

export const DEFAULT_COUNTRY_FIELDS: ConfigurableField[] = [
  { key: 'name', label: 'Country Name', category: 'core', required: true, description: 'Official Country Name' },
  { key: 'isDefault', label: 'Default Country', category: 'system', required: false, description: 'System-wide default toggle' },
  { key: 'isoCode2', label: 'ISO Country Code 2', category: 'codes', required: true, description: '2-letter country code (e.g. US, AE)' },
  { key: 'isoCode3', label: 'ISO Country Code 3', category: 'codes', required: false, description: '3-letter country code (e.g. USA, ARE)' },
  { key: 'isoNumeric', label: 'ISO Numeric', category: 'codes', required: false, description: '3-digit numeric code (e.g. 840, 784)' },
  { key: 'isd', label: 'ISD Code', category: 'core', required: true, description: 'International dialing code (e.g. +1, +971)' },
  { key: 'currencyCode', label: 'Currency Code', category: 'core', required: false, description: 'Currency standard code (e.g. USD, EUR, AED)' },
  { key: 'currencySymbol', label: 'Currency Symbol', category: 'core', required: false, description: 'Currency symbol (e.g. $, €, د.إ)' },
  { key: 'continent', label: 'Continent', category: 'core', required: false, description: 'Geographical continent' },
  { key: 'subregion', label: 'Subregion', category: 'core', required: false, description: 'Geographical sub-region or zone' },
  { key: 'status', label: 'Status', category: 'system', required: true, description: 'Record status (Active / Inactive)' },
  { key: 'currency', label: 'Default Currency', category: 'core', required: true, description: 'Default transaction currency' },
  { key: 'nationality', label: 'Nationality', category: 'core', required: false, description: 'Demonym or nationality name' },
  { key: 'capital', label: 'Capital City', category: 'core', required: false, description: 'National capital city' },
  { key: 'flag', label: 'Country Flag', category: 'core', required: false, description: 'National flag display & upload' },
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Tenant 1 (GCC Global Corp)',
    code: 'T1',
    description: 'Primary Enterprise Holding Corporation',
    color: '#0284c7',
  },
  {
    id: 'tenant-2',
    name: 'Tenant 2 (Rapid Tech Logistics)',
    code: 'T2',
    description: 'Logistics & Supply Chain Subsidiary',
    color: '#0d9488',
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-1a',
    username: 'user1a@gcc.com',
    displayName: 'User 1A',
    tenantId: 'tenant-1',
    role: 'Operations Manager',
    fieldCountLabel: '6 Fields',
    password: 'User1A@123',
    avatarLetter: '1A',
  },
  {
    id: 'user-1b',
    username: 'user1b@gcc.com',
    displayName: 'User 1B',
    tenantId: 'tenant-1',
    role: 'Data Entry Clerk',
    fieldCountLabel: '4 Fields',
    password: 'User1B@123',
    avatarLetter: '1B',
  },
  {
    id: 'user-2a',
    username: 'user2a@rapid.com',
    displayName: 'User 2A',
    tenantId: 'tenant-2',
    role: 'Regional Lead',
    fieldCountLabel: '7 Fields',
    password: 'User2A@123',
    avatarLetter: '2A',
  },
  {
    id: 'user-2b',
    username: 'user2b@rapid.com',
    displayName: 'User 2B',
    tenantId: 'tenant-2',
    role: 'Support Specialist',
    fieldCountLabel: '5 Fields',
    password: 'User2B@123',
    avatarLetter: '2B',
  },
  {
    id: 'admin',
    username: 'admin@gcc.com',
    displayName: 'Admin (System Admin)',
    tenantId: 'tenant-1',
    role: 'Super Administrator',
    fieldCountLabel: 'All Fields',
    password: '!VKaIPxQTFKM6ANB',
    avatarLetter: 'A',
  },
];

const STORAGE_KEY_TENANT_SETTINGS = 'rapiderp_tenant_field_settings_v2';
const STORAGE_KEY_USER_PERMISSIONS = 'rapiderp_user_field_permissions_v2';
const STORAGE_KEY_ACTIVE_USER_ID = 'rapiderp_active_user_id_v2';
const STORAGE_KEY_CUSTOM_FIELDS = 'rapiderp_custom_fields_v2';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  readonly tenants = signal<Tenant[]>(INITIAL_TENANTS);
  readonly users = signal<UserAccount[]>(INITIAL_USERS);

  // Custom fields added at runtime
  customFields = signal<ConfigurableField[]>(this.loadStoredCustomFields());

  // All configurable fields = built-in defaults + any custom fields
  allFields = computed<ConfigurableField[]>(() => {
    return [...DEFAULT_COUNTRY_FIELDS, ...this.customFields()];
  });

  // Active User & Active Tenant
  activeUserId = signal<string>(this.getInitialActiveUserId());

  activeUser = computed<UserAccount>(() => {
    const uid = this.activeUserId();
    const found = this.users().find((u) => u.id === uid || u.username === uid);
    return found || this.users()[0];
  });

  activeTenantId = computed<string>(() => {
    return this.activeUser().tenantId;
  });

  activeTenant = computed<Tenant>(() => {
    const tid = this.activeTenantId();
    const found = this.tenants().find((t) => t.id === tid);
    return found || this.tenants()[0];
  });

  // Concept 1: Tenant-wise configurable fields from Setting Table
  // tenantSettings[tenantId][fieldKey] = true | false
  // By default all fields are true (all checked, all visible by default)
  tenantSettings = signal<Record<string, Record<string, boolean>>>(this.loadStoredTenantSettings());

  // Concept 2: User permission-wise show or hide field from User Permission Table
  // userPermissions[userId][fieldKey] = true | false
  userPermissions = signal<Record<string, Record<string, boolean>>>(this.loadStoredUserPermissions());

  // UI state for Setting & Permission configuration modals
  isConfigModalOpen = signal<boolean>(false);
  activeConfigTab = signal<'tenantSettings' | 'userPermissions' | 'addField'>('tenantSettings');
  selectedTenantIdForConfig = signal<string>('tenant-1');
  selectedUserIdForConfig = signal<string>('user-1a');

  constructor() {
    // If active user is stored, synchronize
    const initUid = this.getInitialActiveUserId();
    this.activeUserId.set(initUid);
  }

  // ---------------------------------------------------------------------------
  // Core Field Visibility Logic (Combining Concept 1 and Concept 2)
  // ---------------------------------------------------------------------------

  /**
   * Check if a field is enabled for a given tenant in the Tenant Setting Table
   */
  isFieldAllowedForTenant(tenantId: string, fieldKey: string): boolean {
    const settings = this.tenantSettings()[tenantId];
    if (!settings) return true; // default true
    return settings[fieldKey] !== false; // checked by default
  }

  /**
   * Check if a field is permitted for a given user in the User Permission Table
   */
  isFieldPermittedForUser(userId: string, fieldKey: string): boolean {
    const perms = this.userPermissions()[userId];
    if (!perms) return true; // default true if not configured
    return perms[fieldKey] !== false;
  }

  /**
   * Final check: Is field visible in Country Master for the CURRENT active user and tenant?
   * Rule:
   * 1. Must be allowed for the tenant (Tenant Setting Table == true). If false, hidden for all tenant users.
   * 2. Must be permitted for the user (User Permission Table == true).
   */
  isFieldVisible(fieldKey: string): boolean {
    const tenantId = this.activeTenantId();
    const userId = this.activeUserId();

    // Admin has super-access to see everything unless explicitly previewing as a tenant user
    if (userId === 'admin') {
      return true;
    }

    // 1. Tenant Setting Table check
    const tenantAllowed = this.isFieldAllowedForTenant(tenantId, fieldKey);
    if (!tenantAllowed) {
      return false; // If tenant disabled it, user cannot see it
    }

    // 2. User Permission Table check
    const userAllowed = this.isFieldPermittedForUser(userId, fieldKey);
    return userAllowed;
  }

  /**
   * Get all currently visible fields for the active user & tenant
   */
  getVisibleFields(): ConfigurableField[] {
    return this.allFields().filter((f) => this.isFieldVisible(f.key));
  }

  /**
   * Count of visible fields for active user
   */
  visibleFieldCount = computed<number>(() => {
    // depend on reactive signals
    const fields = this.allFields();
    // read activeUser and tenantSettings/userPermissions
    const tenantId = this.activeTenantId();
    const userId = this.activeUserId();
    const tSettings = this.tenantSettings()[tenantId] || {};
    const uPerms = this.userPermissions()[userId] || {};

    if (userId === 'admin') return fields.length;

    let count = 0;
    for (const f of fields) {
      const tAllowed = tSettings[f.key] !== false;
      const uAllowed = uPerms[f.key] !== false;
      if (tAllowed && uAllowed) {
        count++;
      }
    }
    return count;
  });

  // ---------------------------------------------------------------------------
  // User & Tenant Switching
  // ---------------------------------------------------------------------------

  switchUser(userId: string): void {
    const user = this.users().find((u) => u.id === userId || u.username === userId);
    if (user) {
      this.activeUserId.set(user.id);
      this.selectedUserIdForConfig.set(user.id);
      this.selectedTenantIdForConfig.set(user.tenantId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ACTIVE_USER_ID, user.id);
        localStorage.setItem('rapid_erp_user', user.username);
        sessionStorage.setItem('rapid_erp_user', user.username);
      }
    }
  }

  switchTenant(tenantId: string): void {
    const tenant = this.tenants().find((t) => t.id === tenantId);
    if (!tenant) return;

    // Pick first user of that tenant
    const firstUser = this.users().find((u) => u.tenantId === tenantId);
    if (firstUser) {
      this.switchUser(firstUser.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Mutation Methods for Setting Table & Permission Table
  // ---------------------------------------------------------------------------

  setTenantFieldSetting(tenantId: string, fieldKey: string, allowed: boolean): void {
    this.tenantSettings.update((curr) => {
      const updated = { ...curr };
      updated[tenantId] = {
        ...(updated[tenantId] || {}),
        [fieldKey]: allowed,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TENANT_SETTINGS, JSON.stringify(updated));
      }
      return updated;
    });
  }

  setUserFieldPermission(userId: string, fieldKey: string, permitted: boolean): void {
    this.userPermissions.update((curr) => {
      const updated = { ...curr };
      updated[userId] = {
        ...(updated[userId] || {}),
        [fieldKey]: permitted,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER_PERMISSIONS, JSON.stringify(updated));
      }
      return updated;
    });
  }

  toggleTenantFieldSetting(tenantId: string, fieldKey: string): void {
    const current = this.isFieldAllowedForTenant(tenantId, fieldKey);
    this.setTenantFieldSetting(tenantId, fieldKey, !current);
  }

  toggleUserFieldPermission(userId: string, fieldKey: string): void {
    const current = this.isFieldPermittedForUser(userId, fieldKey);
    this.setUserFieldPermission(userId, fieldKey, !current);
  }

  setAllTenantFields(tenantId: string, allowed: boolean): void {
    const fields = this.allFields();
    this.tenantSettings.update((curr) => {
      const updated = { ...curr };
      const tenantMap: Record<string, boolean> = {};
      fields.forEach((f) => {
        tenantMap[f.key] = allowed;
      });
      updated[tenantId] = tenantMap;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TENANT_SETTINGS, JSON.stringify(updated));
      }
      return updated;
    });
  }

  setAllUserFields(userId: string, permitted: boolean): void {
    const fields = this.allFields();
    this.userPermissions.update((curr) => {
      const updated = { ...curr };
      const userMap: Record<string, boolean> = {};
      fields.forEach((f) => {
        userMap[f.key] = permitted;
      });
      updated[userId] = userMap;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER_PERMISSIONS, JSON.stringify(updated));
      }
      return updated;
    });
  }

  // ---------------------------------------------------------------------------
  // Adding New Fields Dynamically
  // ---------------------------------------------------------------------------

  addNewField(field: {
    name: string;
    key?: string;
    type?: 'text' | 'number' | 'boolean' | 'select';
    category?: 'core' | 'codes' | 'system' | 'custom';
    required?: boolean;
    description?: string;
  }): ConfigurableField {
    const cleanLabel = field.name.trim();
    const cleanKey =
      (field.key || cleanLabel.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')).trim() ||
      `custom_${Date.now()}`;

    const newField: ConfigurableField = {
      key: cleanKey,
      label: cleanLabel,
      type: field.type || 'text',
      category: field.category || 'custom',
      required: !!field.required,
      description: field.description || `Custom configured field: ${cleanLabel}`,
      isCustom: true,
    };

    this.customFields.update((curr) => {
      const updated = [...curr.filter((f) => f.key !== newField.key), newField];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CUSTOM_FIELDS, JSON.stringify(updated));
      }
      return updated;
    });

    // Enable for all tenants and users by default
    this.tenants().forEach((t) => {
      this.setTenantFieldSetting(t.id, newField.key, true);
    });
    this.users().forEach((u) => {
      this.setUserFieldPermission(u.id, newField.key, true);
    });

    return newField;
  }

  removeCustomField(fieldKey: string): void {
    this.customFields.update((curr) => {
      const updated = curr.filter((f) => f.key !== fieldKey);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CUSTOM_FIELDS, JSON.stringify(updated));
      }
      return updated;
    });
  }

  // ---------------------------------------------------------------------------
  // Reset Configuration to Client-Specified Defaults
  // ---------------------------------------------------------------------------

  resetToDefaults(): void {
    const defaultTenantSettings = this.createDefaultTenantSettings();
    const defaultUserPermissions = this.createDefaultUserPermissions();

    this.tenantSettings.set(defaultTenantSettings);
    this.userPermissions.set(defaultUserPermissions);
    this.customFields.set([]);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_TENANT_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_USER_PERMISSIONS);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_FIELDS);
    }
  }

  // ---------------------------------------------------------------------------
  // Modal Helpers
  // ---------------------------------------------------------------------------

  openConfigModal(tab: 'tenantSettings' | 'userPermissions' | 'addField' = 'tenantSettings'): void {
    this.activeConfigTab.set(tab);
    this.isConfigModalOpen.set(true);
  }

  closeConfigModal(): void {
    this.isConfigModalOpen.set(false);
  }

  // ---------------------------------------------------------------------------
  // Private Storage & Default Creators
  // ---------------------------------------------------------------------------

  private createDefaultTenantSettings(): Record<string, Record<string, boolean>> {
    // By default: all fields TRUE for all tenants ("You keep it all checked, all visible by default all you keep given")
    const t1: Record<string, boolean> = {};
    const t2: Record<string, boolean> = {};

    DEFAULT_COUNTRY_FIELDS.forEach((f) => {
      t1[f.key] = true;
      t2[f.key] = true;
    });

    return {
      'tenant-1': t1,
      'tenant-2': t2,
    };
  }

  private createDefaultUserPermissions(): Record<string, Record<string, boolean>> {
    // Client requirements exact specifications:
    // User 1A (Tenant 1): Exactly 6 fields
    // User 1B (Tenant 1): Exactly 4 fields
    // User 2A (Tenant 2): 7 fields
    // User 2B (Tenant 2): 5 fields
    // Admin: All fields

    const user1aPerms: Record<string, boolean> = {};
    const user1bPerms: Record<string, boolean> = {};
    const user2aPerms: Record<string, boolean> = {};
    const user2bPerms: Record<string, boolean> = {};
    const adminPerms: Record<string, boolean> = {};

    // First mark all false by default for user 1a & 1b
    DEFAULT_COUNTRY_FIELDS.forEach((f) => {
      user1aPerms[f.key] = false;
      user1bPerms[f.key] = false;
      user2aPerms[f.key] = false;
      user2bPerms[f.key] = false;
      adminPerms[f.key] = true;
    });

    // User 1A: 6 fields: Country Name, Default Country, ISO Country Code 2, ISD Code, Continent, Status
    const user1aFields = ['name', 'isDefault', 'isoCode2', 'isd', 'continent', 'status'];
    user1aFields.forEach((k) => (user1aPerms[k] = true));

    // User 1B: 4 fields: Country Name, ISO Code 2, Phone Dial Code, Default Currency
    const user1bFields = ['name', 'isoCode2', 'isd', 'currency'];
    user1bFields.forEach((k) => (user1bPerms[k] = true));

    // User 2A: 7 fields
    const user2aFields = ['name', 'isoCode2', 'isoCode3', 'isoNumeric', 'isd', 'currency', 'status'];
    user2aFields.forEach((k) => (user2aPerms[k] = true));

    // User 2B: 5 fields
    const user2bFields = ['name', 'isoCode2', 'isd', 'currency', 'isDefault'];
    user2bFields.forEach((k) => (user2bPerms[k] = true));

    return {
      'user-1a': user1aPerms,
      'user-1b': user1bPerms,
      'user-2a': user2aPerms,
      'user-2b': user2bPerms,
      admin: adminPerms,
    };
  }

  private loadStoredTenantSettings(): Record<string, Record<string, boolean>> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_TENANT_SETTINGS);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load stored tenant settings, using defaults', e);
      }
    }
    return this.createDefaultTenantSettings();
  }

  private loadStoredUserPermissions(): Record<string, Record<string, boolean>> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_USER_PERMISSIONS);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load stored user permissions, using defaults', e);
      }
    }
    return this.createDefaultUserPermissions();
  }

  private loadStoredCustomFields(): ConfigurableField[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_FIELDS);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load stored custom fields', e);
      }
    }
    return [];
  }

  private getInitialActiveUserId(): string {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER_ID);
      if (storedId && INITIAL_USERS.some((u) => u.id === storedId)) {
        return storedId;
      }
      const storedUser = sessionStorage.getItem('rapid_erp_user') || localStorage.getItem('rapid_erp_user');
      if (storedUser) {
        const match = INITIAL_USERS.find((u) => u.username === storedUser);
        if (match) return match.id;
      }
    }
    // Default to user-1a for immediate demonstration of the 6-fields requirement!
    return 'user-1a';
  }
}

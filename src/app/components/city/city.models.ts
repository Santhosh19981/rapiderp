export interface CityMaster {
  id: string; // City ID e.g. CT-1001
  code: string; // City Code e.g. DXB-CT, LAX
  name: string; // City Name e.g. Dubai City, Los Angeles
  nameAr?: string; // Arabic City Name e.g. مدينة دبي
  country: string; // Lookup from Country Master e.g. United Arab Emirates
  countryCode?: string; // e.g. AE
  state: string; // Lookup from State Master; filtered by Country e.g. Dubai
  stateCode?: string; // e.g. DXB
  description?: string; // Additional city information
  isDefault: boolean; // Set as default where applicable
  status: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  createdAt: string;
  updatedAt: string;
  draftedAt?: string | null;
  translations?: Record<string, string>;
  customFields?: Record<string, any>;
}

export interface CityStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
}

export interface CityHistoryEntry {
  id: string;
  cityId: string;
  cityName: string;
  date: string;
  user: string;
  action: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  exportFormat?: 'PDF' | 'CSV' | 'XLS' | 'DOC' | 'Print' | 'None';
}

export interface CityFilter {
  search: string;
  status: string;
  country: string;
  state: string;
  isDefault: string;
}

export interface MinimizedCityForm {
  id: string;
  mode: 'add' | 'edit' | 'view';
  cityId: string | null;
  title: string;
  formState: Partial<CityMaster>;
}


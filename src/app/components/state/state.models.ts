export type StateType = 'State' | 'Emirate' | 'Province' | 'Territory' | 'Region';

export interface StateMaster {
  id: string; // State ID e.g. ST-1001
  code: string; // State Code e.g. DXB, CA
  name: string; // State Name e.g. Dubai, California
  nameAr?: string; // Arabic State Name e.g. دبي
  country: string; // Country Name e.g. United Arab Emirates
  countryCode?: string; // e.g. AE
  stateType?: StateType; // State, Emirate, Province, Territory, Region
  abbreviation?: string; // e.g. DXB, AUH, CA, NY
  capitalCity?: string; // Lookup from City Master
  description?: string; // Additional information
  isDefault: boolean; // Default State toggle
  status: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  createdAt: string;
  updatedAt: string;
  draftedAt?: string | null;
  translations?: Record<string, string>;
  customFields?: Record<string, any>;
}

export interface StateStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
}

export interface StateHistoryEntry {
  id: string;
  stateId: string;
  stateName: string;
  date: string;
  user: string;
  action: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  exportFormat?: 'PDF' | 'CSV' | 'XLS' | 'DOC' | 'Print' | 'None';
}

export interface StateFilter {
  search: string;
  status: string;
  country: string;
  stateType: string;
  isDefault: string;
}

export interface MinimizedStateForm {
  id: string;
  mode: 'add' | 'edit' | 'view';
  stateId: string | null;
  title: string;
  formState: Partial<StateMaster>;
}


export interface Country {
  id: string;
  name: string;
  code: string;
  isd: string;
  currency: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  isDefault: boolean;
  continent?: string;
  population?: string;
  states?: number;
  cities?: number;
  areas?: number;
  flag?: string;
  actionMessage?: string;
  createdAt: string;
  updatedAt: string;
  draftedAt?: string | null;
  deletedAt?: string | null;
  isUpdated?: boolean;
  // Country name in other languages, keyed by language code (ar, hi, ur, bn)
  translations?: Record<string, string>;
}

export interface CountryStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  updated: number;
  deleted: number;
}

export interface CountryHistoryEntry {
  id: string;
  countryId: string;
  countryName: string;
  date: string;
  user: string;
  action: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  exportFormat?: 'PDF' | 'CSV' | 'XLS' | 'DOC' | 'Print' | 'None';
}

export interface CountryFilter {
  search: string;
  status: string;
  continent: string;
  currency: string;
  isDefault: string;
}

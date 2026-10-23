export interface Country {
  id: string;
  name: string;
  code: string;
  isd: string;
  currency: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  approval?: 'Approved' | 'Pending' | 'Rejected';
  isDefault: boolean;
  isoCode2?: string;
  isoCode3?: string;
  isoNumeric?: string;
  nationality?: string;
  continent?: string;
  capital?: string;
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
  customFields?: Record<string, any>;
}

export interface CountryLookupRecord {
  name: string;
  code: string;
  isoCode2?: string;
  isoCode3: string;
  isoNumeric: string;
  nationality: string;
  isd: string;
  currency: string;
  continent: string;
  capital?: string;
  flag?: string;
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

// Snapshot of an Add/Edit/View form parked in the minimized tab bar
export interface MinimizedCountryForm {
  id: string; // 'add' or 'edit-<countryId>' or 'view-<countryId>'
  mode: 'add' | 'edit' | 'view';
  countryId: string | null;
  title: string;
  state: {
    code: string;
    isoCode2?: string;
    isoCode3?: string;
    isoNumeric?: string;
    nationality?: string;
    isd: string;
    name: string;
    currency: string;
    isDefault: 'Yes' | 'No';
    status: 'Active' | 'Inactive' | 'Draft' | 'Delete';
    flag: string | null;
    continent: string;
    capital?: string;
    translations: Record<string, string>;
    customFields?: Record<string, any>;
    flagTab: 'drop' | 'upload' | 'attachment' | 'gallery';
    keepOnPage: boolean;
    pdfOnSubmit: boolean;
    printOnSubmit: boolean;
  };
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const DEFAULT_CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'RO' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
];


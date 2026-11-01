import { Injectable, signal, computed } from '@angular/core';
import { CityMaster, CityStats, CityHistoryEntry, MinimizedCityForm } from './city.models';

const INITIAL_CITIES: CityMaster[] = [
  {
    id: 'CT-1001',
    code: 'DXB-CT',
    name: 'Dubai City',
    nameAr: 'مدينة دبي',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Dubai',
    stateCode: 'DXB',
    description: 'Metropolitan economic and tourism center of Dubai.',
    isDefault: true,
    status: 'Active',
    createdAt: '2023-01-15',
    updatedAt: '2023-11-20',
  },
  {
    id: 'CT-1002',
    code: 'AUH-CT',
    name: 'Abu Dhabi City',
    nameAr: 'مدينة أبو ظبي',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Abu Dhabi',
    stateCode: 'AUH',
    description: 'Federal capital city of the United Arab Emirates.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-01-18',
    updatedAt: '2023-10-15',
  },
  {
    id: 'CT-1003',
    code: 'ALN',
    name: 'Al Ain',
    nameAr: 'العين',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Abu Dhabi',
    stateCode: 'AUH',
    description: 'Garden city and major historic center in Abu Dhabi emirate.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-01-20',
    updatedAt: '2023-09-10',
  },
  {
    id: 'CT-1004',
    code: 'SHJ-CT',
    name: 'Sharjah City',
    nameAr: 'مدينة الشارقة',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Sharjah',
    stateCode: 'SHJ',
    description: 'Center of art, heritage, and education in the UAE.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-05',
    updatedAt: '2023-09-12',
  },
  {
    id: 'CT-1005',
    code: 'AJM-CT',
    name: 'Ajman City',
    nameAr: 'مدينة عجمان',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Ajman',
    stateCode: 'AJM',
    description: 'Coastal trading and industrial port city.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-10',
    updatedAt: '2023-08-25',
  },
  {
    id: 'CT-1006',
    code: 'RAK-CT',
    name: 'Ras Al Khaimah City',
    nameAr: 'مدينة رأس الخيمة',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Ras Al Khaimah',
    stateCode: 'RAK',
    description: 'Northern hub with ports, ceramics, and mountain eco-tourism.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-14',
    updatedAt: '2023-07-19',
  },
  {
    id: 'CT-1007',
    code: 'FUJ-CT',
    name: 'Fujairah City',
    nameAr: 'مدينة الفجيرة',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    state: 'Fujairah',
    stateCode: 'FUJ',
    description: 'Deep-water bunkering hub and regional transport link.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-20',
    updatedAt: '2023-06-11',
  },
  {
    id: 'CT-1008',
    code: 'LAX',
    name: 'Los Angeles',
    nameAr: 'لوس أنجلوس',
    country: 'United States',
    countryCode: 'US',
    state: 'California',
    stateCode: 'CA',
    description: 'Major entertainment and commercial center in Southern California.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-01',
    updatedAt: '2023-11-05',
  },
  {
    id: 'CT-1009',
    code: 'SFO',
    name: 'San Francisco',
    nameAr: 'سان فرانسيسكو',
    country: 'United States',
    countryCode: 'US',
    state: 'California',
    stateCode: 'CA',
    description: 'Global tech hub and financial center of Northern California.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-02',
    updatedAt: '2023-10-20',
  },
  {
    id: 'CT-1010',
    code: 'NYC',
    name: 'New York City',
    nameAr: 'مدينة نيويورك',
    country: 'United States',
    countryCode: 'US',
    state: 'New York',
    stateCode: 'NY',
    description: 'Most populated city in the United States and premier financial hub.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-05',
    updatedAt: '2023-10-30',
  },
  {
    id: 'CT-1011',
    code: 'HOU',
    name: 'Houston',
    nameAr: 'هيوستن',
    country: 'United States',
    countryCode: 'US',
    state: 'Texas',
    stateCode: 'TX',
    description: 'Energy capital of the world and aerospace center.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-10',
    updatedAt: '2023-09-22',
  },
  {
    id: 'CT-1012',
    code: 'TOR',
    name: 'Toronto',
    nameAr: 'تورونتو',
    country: 'Canada',
    countryCode: 'CA',
    state: 'Ontario',
    stateCode: 'ON',
    description: 'Canada’s largest city and leading financial institution center.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-15',
    updatedAt: '2023-10-01',
  },
  {
    id: 'CT-1013',
    code: 'BOM',
    name: 'Mumbai',
    nameAr: 'مومباي',
    country: 'India',
    countryCode: 'IN',
    state: 'Maharashtra',
    stateCode: 'MH',
    description: 'Financial capital and most populous city of India.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-04-01',
    updatedAt: '2023-11-12',
  },
  {
    id: 'CT-1014',
    code: 'SYD',
    name: 'Sydney',
    nameAr: 'سيدني',
    country: 'Australia',
    countryCode: 'AU',
    state: 'New South Wales',
    stateCode: 'NSW',
    description: 'Harbour city and economic engine of New South Wales.',
    isDefault: false,
    status: 'Draft',
    createdAt: '2023-04-10',
    updatedAt: '2023-08-14',
  },
  {
    id: 'CT-1015',
    code: 'MUC',
    name: 'Munich',
    nameAr: 'ميونيخ',
    country: 'Germany',
    countryCode: 'DE',
    state: 'Bavaria',
    stateCode: 'BY',
    description: 'Bavarian capital renowned for engineering and research.',
    isDefault: false,
    status: 'Inactive',
    createdAt: '2023-05-15',
    updatedAt: '2023-09-08',
  },
];

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private readonly STORAGE_KEY = 'rapiderp_cities_master';

  public cities = signal<CityMaster[]>(this.loadCities());
  public minimizedForms = signal<MinimizedCityForm[]>([]);
  public history = signal<CityHistoryEntry[]>([]);

  public stats = computed<CityStats>(() => {
    const list = this.cities().filter((c) => c.status !== 'Deleted');
    const total = list.length;
    const active = list.filter((c) => c.status === 'Active').length;
    const inactive = list.filter((c) => c.status === 'Inactive').length;
    const draft = list.filter((c) => c.status === 'Draft').length;
    return { total, active, inactive, draft };
  });

  private loadCities(): CityMaster[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_CITIES;
  }

  private save(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cities()));
    } catch {
      // ignore
    }
  }

  generateCityId(): string {
    const existing = this.cities();
    const nums = existing
      .map((c) => {
        const match = c.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
    return `CT-${next}`;
  }

  generateCityCode(name: string): string {
    if (!name || !name.trim()) {
      return `CT-${Math.floor(10 + Math.random() * 90)}`;
    }
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (clean.length >= 3) {
      return clean.substring(0, 3);
    }
    return (clean + 'XX').substring(0, 3);
  }

  getCityById(id: string): CityMaster | undefined {
    return this.cities().find((c) => c.id === id);
  }

  addCity(data: Partial<CityMaster>): CityMaster {
    const newId = data.id || this.generateCityId();
    const now = new Date().toISOString().split('T')[0];

    if (data.isDefault) {
      this.clearOtherDefaults();
    }

    const cityRecord: CityMaster = {
      id: newId,
      code: data.code || this.generateCityCode(data.name || ''),
      name: data.name || '',
      nameAr: data.nameAr || '',
      country: data.country || 'United Arab Emirates',
      countryCode: data.countryCode || 'AE',
      state: data.state || 'Dubai',
      stateCode: data.stateCode || 'DXB',
      description: data.description || '',
      isDefault: !!data.isDefault,
      status: data.status || 'Active',
      createdAt: now,
      updatedAt: now,
      translations: data.translations || {},
      customFields: data.customFields || {},
    };

    this.cities.update((prev) => [cityRecord, ...prev]);
    this.save();
    this.addHistory(cityRecord.id, cityRecord.name, 'Created City', cityRecord.status);
    return cityRecord;
  }

  updateCity(id: string, data: Partial<CityMaster>): boolean {
    const idx = this.cities().findIndex((c) => c.id === id);
    if (idx === -1) return false;

    if (data.isDefault) {
      this.clearOtherDefaults(id);
    }

    const now = new Date().toISOString().split('T')[0];
    this.cities.update((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        ...data,
        updatedAt: now,
      };
      return copy;
    });
    this.save();
    this.addHistory(id, data.name || this.cities()[idx].name, 'Updated City', (data.status as any) || 'Active');
    return true;
  }

  deleteCity(id: string): boolean {
    const item = this.getCityById(id);
    if (!item) return false;
    this.cities.update((prev) => prev.filter((c) => c.id !== id));
    this.save();
    this.addHistory(id, item.name, 'Deleted City', 'Deleted');
    return true;
  }

  duplicateCity(id: string): CityMaster | null {
    const original = this.getCityById(id);
    if (!original) return null;
    const newRecord: Partial<CityMaster> = {
      ...original,
      id: this.generateCityId(),
      code: `${original.code}-COPY`,
      name: `${original.name} (Copy)`,
      nameAr: original.nameAr ? `${original.nameAr} (نسخة)` : '',
      isDefault: false,
    };
    return this.addCity(newRecord);
  }

  private clearOtherDefaults(excludeId?: string): void {
    this.cities.update((prev) =>
      prev.map((c) => (c.id !== excludeId && c.isDefault ? { ...c, isDefault: false } : c))
    );
  }

  addHistory(
    cityId: string,
    cityName: string,
    action: string,
    status: 'Active' | 'Inactive' | 'Draft' | 'Deleted',
    exportFormat: 'PDF' | 'CSV' | 'XLS' | 'DOC' | 'Print' | 'None' = 'None'
  ): void {
    const newEntry: CityHistoryEntry = {
      id: 'hist-' + Date.now(),
      cityId,
      cityName,
      date: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      user: 'Admin (System)',
      action,
      status,
      exportFormat,
    };
    this.history.update((list) => [newEntry, ...list.slice(0, 40)]);
  }

  exportData(format: 'pdf' | 'csv' | 'xlsx' | 'print', filteredList?: CityMaster[]): void {
    const data = filteredList || this.cities();
    this.addHistory(
      'export',
      'All Cities',
      `Exported ${data.length} records as ${format.toUpperCase()}`,
      'Active',
      format.toUpperCase() as any
    );

    if (format === 'csv') {
      const headers = ['City ID', 'City Code', 'City Name', 'Country', 'State', 'Default', 'Status'];
      const rows = data.map((c) => [
        c.id,
        c.code,
        `"${c.name}"`,
        `"${c.country}"`,
        `"${c.state}"`,
        c.isDefault ? 'Yes' : 'No',
        c.status,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `rapid_erp_cities_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'print') {
      window.print();
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapid_erp_cities_${format}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}


import { Injectable, signal, computed } from '@angular/core';
import { StateMaster, StateStats, StateHistoryEntry, MinimizedStateForm } from './state.models';

const INITIAL_STATES: StateMaster[] = [
  {
    id: 'ST-1001',
    code: 'DXB',
    name: 'Dubai',
    nameAr: 'دبي',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    stateType: 'Emirate',
    abbreviation: 'DXB',
    capitalCity: 'Dubai',
    description: 'Commercial hub and most populous emirate of the UAE.',
    isDefault: true,
    status: 'Active',
    createdAt: '2023-01-15',
    updatedAt: '2023-11-20',
  },
  {
    id: 'ST-1002',
    code: 'AUH',
    name: 'Abu Dhabi',
    nameAr: 'أبو ظبي',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    stateType: 'Emirate',
    abbreviation: 'AUH',
    capitalCity: 'Abu Dhabi',
    description: 'Capital emirate and government center of the UAE.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-01-18',
    updatedAt: '2023-10-15',
  },
  {
    id: 'ST-1003',
    code: 'SHJ',
    name: 'Sharjah',
    nameAr: 'الشارقة',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    stateType: 'Emirate',
    abbreviation: 'SHJ',
    capitalCity: 'Sharjah',
    description: 'Cultural capital and third-largest emirate of the UAE.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-05',
    updatedAt: '2023-09-12',
  },
  {
    id: 'ST-1004',
    code: 'AJM',
    name: 'Ajman',
    nameAr: 'عجمان',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    stateType: 'Emirate',
    abbreviation: 'AJM',
    capitalCity: 'Ajman',
    description: 'Central emirate on the Arabian Gulf coast.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-10',
    updatedAt: '2023-08-25',
  },
  {
    id: 'ST-1005',
    code: 'RAK',
    name: 'Ras Al Khaimah',
    nameAr: 'رأس الخيمة',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    stateType: 'Emirate',
    abbreviation: 'RAK',
    capitalCity: 'Ras Al Khaimah',
    description: 'Northernmost emirate renowned for industry and tourism.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-14',
    updatedAt: '2023-07-19',
  },
  {
    id: 'ST-1006',
    code: 'FUJ',
    name: 'Fujairah',
    nameAr: 'الفجيرة',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    stateType: 'Emirate',
    abbreviation: 'FUJ',
    capitalCity: 'Fujairah',
    description: 'Eastern coastal emirate on the Gulf of Oman.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-20',
    updatedAt: '2023-06-11',
  },
  {
    id: 'ST-1007',
    code: 'UAQ',
    name: 'Umm Al Quwain',
    nameAr: 'أم القيوين',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    stateType: 'Emirate',
    abbreviation: 'UAQ',
    capitalCity: 'Umm Al Quwain',
    description: 'Peaceful emirate with rich archaeological heritage.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-02-22',
    updatedAt: '2023-05-18',
  },
  {
    id: 'ST-1008',
    code: 'CA',
    name: 'California',
    nameAr: 'كاليفورنيا',
    country: 'United States',
    countryCode: 'US',
    stateType: 'State',
    abbreviation: 'CA',
    capitalCity: 'Sacramento',
    description: 'Most populous US state and major global economic hub.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-01',
    updatedAt: '2023-11-05',
  },
  {
    id: 'ST-1009',
    code: 'NY',
    name: 'New York',
    nameAr: 'نيويورك',
    country: 'United States',
    countryCode: 'US',
    stateType: 'State',
    abbreviation: 'NY',
    capitalCity: 'Albany',
    description: 'East coast financial and commercial powerhouse.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-05',
    updatedAt: '2023-10-30',
  },
  {
    id: 'ST-1010',
    code: 'TX',
    name: 'Texas',
    nameAr: 'تكساس',
    country: 'United States',
    countryCode: 'US',
    stateType: 'State',
    abbreviation: 'TX',
    capitalCity: 'Austin',
    description: 'Second-largest US state by area and population.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-10',
    updatedAt: '2023-09-22',
  },
  {
    id: 'ST-1011',
    code: 'ON',
    name: 'Ontario',
    nameAr: 'أونتاريو',
    country: 'Canada',
    countryCode: 'CA',
    stateType: 'Province',
    abbreviation: 'ON',
    capitalCity: 'Toronto',
    description: 'Most populous Canadian province, home to the capital Ottawa.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-03-15',
    updatedAt: '2023-10-01',
  },
  {
    id: 'ST-1012',
    code: 'MH',
    name: 'Maharashtra',
    nameAr: 'ماهاراشترا',
    country: 'India',
    countryCode: 'IN',
    stateType: 'State',
    abbreviation: 'MH',
    capitalCity: 'Mumbai',
    description: 'Western industrial hub and financial gateway of India.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-04-01',
    updatedAt: '2023-11-12',
  },
  {
    id: 'ST-1013',
    code: 'NSW',
    name: 'New South Wales',
    nameAr: 'نيو ساوث ويلز',
    country: 'Australia',
    countryCode: 'AU',
    stateType: 'State',
    abbreviation: 'NSW',
    capitalCity: 'Sydney',
    description: 'East coast state containing Sydney and Newcastle.',
    isDefault: false,
    status: 'Inactive',
    createdAt: '2023-04-10',
    updatedAt: '2023-08-14',
  },
  {
    id: 'ST-1014',
    code: 'ENG',
    name: 'England',
    nameAr: 'إنجلترا',
    country: 'United Kingdom',
    countryCode: 'GB',
    stateType: 'Region',
    abbreviation: 'ENG',
    capitalCity: 'London',
    description: 'Constituent nation of the United Kingdom.',
    isDefault: false,
    status: 'Draft',
    createdAt: '2023-05-01',
    updatedAt: '2023-05-01',
  },
  {
    id: 'ST-1015',
    code: 'BY',
    name: 'Bavaria',
    nameAr: 'بافاريا',
    country: 'Germany',
    countryCode: 'DE',
    stateType: 'State',
    abbreviation: 'BY',
    capitalCity: 'Munich',
    description: 'Southern German state famous for manufacturing and heritage.',
    isDefault: false,
    status: 'Active',
    createdAt: '2023-05-15',
    updatedAt: '2023-09-08',
  },
];

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private readonly STORAGE_KEY = 'rapiderp_states_master';

  public states = signal<StateMaster[]>(this.loadStates());
  public minimizedForms = signal<MinimizedStateForm[]>([]);
  public history = signal<StateHistoryEntry[]>([]);

  public stats = computed<StateStats>(() => {
    const list = this.states().filter((s) => s.status !== 'Deleted');
    const total = list.length;
    const active = list.filter((s) => s.status === 'Active').length;
    const inactive = list.filter((s) => s.status === 'Inactive').length;
    const draft = list.filter((s) => s.status === 'Draft').length;
    return { total, active, inactive, draft };
  });

  private loadStates(): StateMaster[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_STATES;
  }

  private save(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.states()));
    } catch {
      // ignore
    }
  }

  generateStateId(): string {
    const existing = this.states();
    const nums = existing
      .map((s) => {
        const match = s.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
    return `ST-${next}`;
  }

  generateStateCode(name: string): string {
    if (!name || !name.trim()) {
      return `ST-${Math.floor(10 + Math.random() * 90)}`;
    }
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (clean.length >= 3) {
      return clean.substring(0, 3);
    }
    return (clean + 'XX').substring(0, 3);
  }

  getStateById(id: string): StateMaster | undefined {
    return this.states().find((s) => s.id === id);
  }

  addState(data: Partial<StateMaster>): StateMaster {
    const newId = data.id || this.generateStateId();
    const now = new Date().toISOString().split('T')[0];

    if (data.isDefault) {
      this.clearOtherDefaults();
    }

    const stateRecord: StateMaster = {
      id: newId,
      code: data.code || this.generateStateCode(data.name || ''),
      name: data.name || '',
      nameAr: data.nameAr || '',
      country: data.country || 'United Arab Emirates',
      countryCode: data.countryCode || 'AE',
      stateType: data.stateType || 'Emirate',
      abbreviation: data.abbreviation || data.code || '',
      capitalCity: data.capitalCity || '',
      description: data.description || '',
      isDefault: !!data.isDefault,
      status: data.status || 'Active',
      createdAt: now,
      updatedAt: now,
      translations: data.translations || {},
      customFields: data.customFields || {},
    };

    this.states.update((prev) => [stateRecord, ...prev]);
    this.save();
    this.addHistory(stateRecord.id, stateRecord.name, 'Created State', stateRecord.status);
    return stateRecord;
  }

  updateState(id: string, data: Partial<StateMaster>): boolean {
    const idx = this.states().findIndex((s) => s.id === id);
    if (idx === -1) return false;

    if (data.isDefault) {
      this.clearOtherDefaults(id);
    }

    const now = new Date().toISOString().split('T')[0];
    this.states.update((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        ...data,
        updatedAt: now,
      };
      return copy;
    });
    this.save();
    this.addHistory(id, data.name || this.states()[idx].name, 'Updated State', (data.status as any) || 'Active');
    return true;
  }

  deleteState(id: string): boolean {
    const item = this.getStateById(id);
    if (!item) return false;
    this.states.update((prev) => prev.filter((s) => s.id !== id));
    this.save();
    this.addHistory(id, item.name, 'Deleted State', 'Deleted');
    return true;
  }

  duplicateState(id: string): StateMaster | null {
    const original = this.getStateById(id);
    if (!original) return null;
    const newRecord: Partial<StateMaster> = {
      ...original,
      id: this.generateStateId(),
      code: `${original.code}-COPY`,
      name: `${original.name} (Copy)`,
      nameAr: original.nameAr ? `${original.nameAr} (نسخة)` : '',
      isDefault: false,
    };
    return this.addState(newRecord);
  }

  private clearOtherDefaults(excludeId?: string): void {
    this.states.update((prev) =>
      prev.map((s) => (s.id !== excludeId && s.isDefault ? { ...s, isDefault: false } : s))
    );
  }

  addHistory(
    stateId: string,
    stateName: string,
    action: string,
    status: 'Active' | 'Inactive' | 'Draft' | 'Deleted',
    exportFormat: 'PDF' | 'CSV' | 'XLS' | 'DOC' | 'Print' | 'None' = 'None'
  ): void {
    const newEntry: StateHistoryEntry = {
      id: 'hist-' + Date.now(),
      stateId,
      stateName,
      date: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      user: 'Admin (System)',
      action,
      status,
      exportFormat,
    };
    this.history.update((list) => [newEntry, ...list.slice(0, 40)]);
  }

  exportData(format: 'pdf' | 'csv' | 'xlsx' | 'print', filteredList?: StateMaster[]): void {
    const data = filteredList || this.states();
    this.addHistory(
      'export',
      'All States',
      `Exported ${data.length} records as ${format.toUpperCase()}`,
      'Active',
      format.toUpperCase() as any
    );

    if (format === 'csv') {
      const headers = ['State ID', 'State Code', 'State Name', 'Country', 'State Type', 'Abbreviation', 'Capital City', 'Default', 'Status'];
      const rows = data.map((s) => [
        s.id,
        s.code,
        `"${s.name}"`,
        `"${s.country}"`,
        s.stateType || '',
        s.abbreviation || '',
        `"${s.capitalCity || ''}"`,
        s.isDefault ? 'Yes' : 'No',
        s.status,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `rapid_erp_states_${Date.now()}.csv`);
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
      link.download = `rapid_erp_states_${format}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}


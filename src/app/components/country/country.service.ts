import { Injectable, signal, computed } from '@angular/core';
import { Country, CountryStats, CountryHistoryEntry, MinimizedCountryForm } from './country.models';

const INITIAL_COUNTRIES: Country[] = [
  {
    id: '1',
    name: 'United States',
    code: 'US',
    isd: '+1',
    currency: 'USD',
    status: 'Active',
    isDefault: true,
    continent: 'North America',
    population: '331 million',
    states: 50,
    cities: 310,
    areas: 1200,
    flag: 'https://flagcdn.com/us.svg',
    actionMessage: '2 hours ago',
    createdAt: '2023-01-15',
    updatedAt: '2023-11-20',
    isUpdated: true,
  },
  {
    id: '2',
    name: 'Canada',
    code: 'CA',
    isd: '+1',
    currency: 'CAD',
    status: 'Active',
    isDefault: false,
    continent: 'North America',
    population: '38 million',
    states: 10,
    cities: 95,
    areas: 420,
    flag: 'https://flagcdn.com/ca.svg',
    actionMessage: '2 hours ago',
    createdAt: '2023-01-18',
    updatedAt: '2023-10-15',
  },
  {
    id: '3',
    name: 'Japan',
    code: 'JP',
    isd: '+81',
    currency: 'JPY',
    status: 'Inactive',
    isDefault: false,
    continent: 'Asia',
    population: '125 million',
    states: 47,
    cities: 180,
    areas: 650,
    flag: 'https://flagcdn.com/jp.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-03-01',
    updatedAt: '2023-11-15',
  },
  {
    id: '4',
    name: 'Germany',
    code: 'DE',
    isd: '+49',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '83 million',
    states: 16,
    cities: 120,
    areas: 540,
    flag: 'https://flagcdn.com/de.svg',
    actionMessage: '15 minutes ago',
    createdAt: '2023-02-10',
    updatedAt: '2023-11-05',
    isUpdated: true,
  },
  {
    id: '5',
    name: 'France',
    code: 'FR',
    isd: '+33',
    currency: 'EUR',
    status: 'Draft',
    isDefault: false,
    continent: 'Europe',
    population: '68 million',
    states: 18,
    cities: 110,
    areas: 490,
    flag: 'https://flagcdn.com/fr.svg',
    actionMessage: '15 Apr 2023',
    createdAt: '2023-02-15',
    updatedAt: '2023-10-28',
    draftedAt: '2023-02-08',
  },
  {
    id: '6',
    name: 'Italy',
    code: 'IT',
    isd: '+39',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '60 million',
    states: 20,
    cities: 98,
    areas: 410,
    flag: 'https://flagcdn.com/it.svg',
    actionMessage: '3 hours ago',
    createdAt: '2023-05-20',
    updatedAt: '2023-11-02',
  },
  {
    id: '7',
    name: 'Spain',
    code: 'ES',
    isd: '+34',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '47 million',
    states: 17,
    cities: 85,
    areas: 370,
    flag: 'https://flagcdn.com/es.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-06-01',
    updatedAt: '2023-11-08',
  },
  {
    id: '8',
    name: 'Portugal',
    code: 'PT',
    isd: '+351',
    currency: 'EUR',
    status: 'Inactive',
    isDefault: false,
    continent: 'Europe',
    population: '10 million',
    states: 18,
    cities: 45,
    areas: 190,
    flag: 'https://flagcdn.com/pt.svg',
    actionMessage: '3 days ago',
    createdAt: '2023-04-12',
    updatedAt: '2023-09-15',
  },
  {
    id: '9',
    name: 'Switzerland',
    code: 'CH',
    isd: '+41',
    currency: 'CHF',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '9 million',
    states: 26,
    cities: 60,
    areas: 220,
    flag: 'https://flagcdn.com/ch.svg',
    actionMessage: '5 hours ago',
    createdAt: '2023-06-15',
    updatedAt: '2023-11-01',
    isUpdated: true,
  },
  {
    id: '10',
    name: 'Netherlands',
    code: 'NL',
    isd: '+31',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '17 million',
    states: 12,
    cities: 55,
    areas: 240,
    flag: 'https://flagcdn.com/nl.svg',
    actionMessage: '1 day ago',
    createdAt: '2023-03-20',
    updatedAt: '2023-10-25',
  },
  {
    id: '11',
    name: 'Belgium',
    code: 'BE',
    isd: '+32',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '11 million',
    states: 10,
    cities: 48,
    areas: 180,
    flag: 'https://flagcdn.com/be.svg',
    actionMessage: 'Just now',
    createdAt: '2023-04-05',
    updatedAt: '2023-11-12',
  },
  {
    id: '12',
    name: 'United Kingdom',
    code: 'GB',
    isd: '+44',
    currency: 'GBP',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '67 million',
    states: 4,
    cities: 140,
    areas: 580,
    flag: 'https://flagcdn.com/gb.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-02-01',
    updatedAt: '2023-11-10',
    isUpdated: true,
  },
  {
    id: '13',
    name: 'India',
    code: 'IN',
    isd: '+91',
    currency: 'INR',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '1.4 billion',
    states: 28,
    cities: 450,
    areas: 2100,
    flag: 'https://flagcdn.com/in.svg',
    actionMessage: '10 minutes ago',
    createdAt: '2023-04-01',
    updatedAt: '2023-11-25',
    isUpdated: true,
  },
  {
    id: '14',
    name: 'Australia',
    code: 'AU',
    isd: '+61',
    currency: 'AUD',
    status: 'Active',
    isDefault: false,
    continent: 'Oceania',
    population: '26 million',
    states: 8,
    cities: 65,
    areas: 320,
    flag: 'https://flagcdn.com/au.svg',
    actionMessage: '4 days ago',
    createdAt: '2023-03-10',
    updatedAt: '2023-11-08',
  },
  {
    id: '15',
    name: 'United Arab Emirates',
    code: 'AE',
    isd: '+971',
    currency: 'AED',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '10 million',
    states: 7,
    cities: 25,
    areas: 140,
    flag: 'https://flagcdn.com/ae.svg',
    actionMessage: '1 hour ago',
    createdAt: '2023-01-10',
    updatedAt: '2023-11-24',
    isUpdated: true,
  },
  {
    id: '16',
    name: 'Saudi Arabia',
    code: 'SA',
    isd: '+966',
    currency: 'SAR',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '36 million',
    states: 13,
    cities: 80,
    areas: 360,
    flag: 'https://flagcdn.com/sa.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-01-20',
    updatedAt: '2023-11-18',
  },
  {
    id: '17',
    name: 'Brazil',
    code: 'BR',
    isd: '+55',
    currency: 'BRL',
    status: 'Inactive',
    isDefault: false,
    continent: 'South America',
    population: '214 million',
    states: 26,
    cities: 160,
    areas: 680,
    flag: 'https://flagcdn.com/br.svg',
    actionMessage: '2 weeks ago',
    createdAt: '2023-03-20',
    updatedAt: '2023-10-22',
  },
  {
    id: '18',
    name: 'Mexico',
    code: 'MX',
    isd: '+52',
    currency: 'MXN',
    status: 'Active',
    isDefault: false,
    continent: 'North America',
    population: '128 million',
    states: 32,
    cities: 95,
    areas: 410,
    flag: 'https://flagcdn.com/mx.svg',
    actionMessage: '3 days ago',
    createdAt: '2023-05-10',
    updatedAt: '2023-10-30',
  },
  {
    id: '19',
    name: 'China',
    code: 'CN',
    isd: '+86',
    currency: 'CNY',
    status: 'Inactive',
    isDefault: false,
    continent: 'Asia',
    population: '1.41 billion',
    states: 34,
    cities: 380,
    areas: 1800,
    flag: 'https://flagcdn.com/cn.svg',
    actionMessage: '1 week ago',
    createdAt: '2023-04-10',
    updatedAt: '2023-11-18',
  },
  {
    id: '20',
    name: 'South Korea',
    code: 'KR',
    isd: '+82',
    currency: 'KRW',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '52 million',
    states: 17,
    cities: 75,
    areas: 310,
    flag: 'https://flagcdn.com/kr.svg',
    actionMessage: '2 hours ago',
    createdAt: '2023-05-01',
    updatedAt: '2023-11-12',
    isUpdated: true,
  },
  {
    id: '21',
    name: 'Singapore',
    code: 'SG',
    isd: '+65',
    currency: 'SGD',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '6 million',
    states: 5,
    cities: 12,
    areas: 80,
    flag: 'https://flagcdn.com/sg.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-02-18',
    updatedAt: '2023-11-20',
  },
  {
    id: '22',
    name: 'New Zealand',
    code: 'NZ',
    isd: '+64',
    currency: 'NZD',
    status: 'Inactive',
    isDefault: false,
    continent: 'Oceania',
    population: '5 million',
    states: 16,
    cities: 30,
    areas: 120,
    flag: 'https://flagcdn.com/nz.svg',
    actionMessage: '4 days ago',
    createdAt: '2023-06-05',
    updatedAt: '2023-08-22',
  },
  {
    id: '23',
    name: 'South Africa',
    code: 'ZA',
    isd: '+27',
    currency: 'ZAR',
    status: 'Active',
    isDefault: false,
    continent: 'Africa',
    population: '60 million',
    states: 9,
    cities: 65,
    areas: 290,
    flag: 'https://flagcdn.com/za.svg',
    actionMessage: '5 hours ago',
    createdAt: '2023-02-11',
    updatedAt: '2023-05-30',
  },
  {
    id: '24',
    name: 'Sweden',
    code: 'SE',
    isd: '+46',
    currency: 'SEK',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '10 million',
    states: 21,
    cities: 50,
    areas: 210,
    flag: 'https://flagcdn.com/se.svg',
    actionMessage: '6 hours ago',
    createdAt: '2023-07-01',
    updatedAt: '2023-11-15',
    isUpdated: true,
  },
  {
    id: '25',
    name: 'Norway',
    code: 'NO',
    isd: '+47',
    currency: 'NOK',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '5.4 million',
    states: 11,
    cities: 40,
    areas: 160,
    flag: 'https://flagcdn.com/no.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-07-10',
    updatedAt: '2023-10-18',
  },
  {
    id: '26',
    name: 'Denmark',
    code: 'DK',
    isd: '+45',
    currency: 'DKK',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '5.9 million',
    states: 5,
    cities: 35,
    areas: 140,
    flag: 'https://flagcdn.com/dk.svg',
    actionMessage: '3 days ago',
    createdAt: '2023-08-01',
    updatedAt: '2023-11-05',
  },
  {
    id: '27',
    name: 'Finland',
    code: 'FI',
    isd: '+358',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '5.5 million',
    states: 19,
    cities: 38,
    areas: 150,
    flag: 'https://flagcdn.com/fi.svg',
    actionMessage: '2 days ago',
    createdAt: '2023-08-10',
    updatedAt: '2023-11-01',
  },
  {
    id: '28',
    name: 'Ireland',
    code: 'IE',
    isd: '+353',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '5 million',
    states: 4,
    cities: 30,
    areas: 130,
    flag: 'https://flagcdn.com/ie.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-06-12',
    updatedAt: '2023-10-29',
  },
  {
    id: '29',
    name: 'Austria',
    code: 'AT',
    isd: '+43',
    currency: 'EUR',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '9 million',
    states: 9,
    cities: 42,
    areas: 170,
    flag: 'https://flagcdn.com/at.svg',
    actionMessage: '4 hours ago',
    createdAt: '2023-07-22',
    updatedAt: '2023-11-10',
  },
  {
    id: '30',
    name: 'Qatar',
    code: 'QA',
    isd: '+974',
    currency: 'QAR',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '2.9 million',
    states: 8,
    cities: 15,
    areas: 70,
    flag: 'https://flagcdn.com/qa.svg',
    actionMessage: '1 hour ago',
    createdAt: '2023-02-14',
    updatedAt: '2023-11-19',
    isUpdated: true,
  },
  {
    id: '31',
    name: 'Kuwait',
    code: 'KW',
    isd: '+965',
    currency: 'KWD',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '4.3 million',
    states: 6,
    cities: 18,
    areas: 85,
    flag: 'https://flagcdn.com/kw.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-03-05',
    updatedAt: '2023-11-15',
  },
  {
    id: '32',
    name: 'Oman',
    code: 'OM',
    isd: '+968',
    currency: 'OMR',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '5 million',
    states: 11,
    cities: 22,
    areas: 95,
    flag: 'https://flagcdn.com/om.svg',
    actionMessage: '3 hours ago',
    createdAt: '2023-03-12',
    updatedAt: '2023-11-14',
  },
  {
    id: '33',
    name: 'Bahrain',
    code: 'BH',
    isd: '+973',
    currency: 'BHD',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '1.5 million',
    states: 4,
    cities: 12,
    areas: 50,
    flag: 'https://flagcdn.com/bh.svg',
    actionMessage: '5 hours ago',
    createdAt: '2023-04-18',
    updatedAt: '2023-11-16',
  },
  {
    id: '34',
    name: 'Egypt',
    code: 'EG',
    isd: '+20',
    currency: 'EGP',
    status: 'Active',
    isDefault: false,
    continent: 'Africa',
    population: '104 million',
    states: 27,
    cities: 110,
    areas: 480,
    flag: 'https://flagcdn.com/eg.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-05-14',
    updatedAt: '2023-11-09',
  },
  {
    id: '35',
    name: 'Turkey',
    code: 'TR',
    isd: '+90',
    currency: 'TRY',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '85 million',
    states: 81,
    cities: 150,
    areas: 620,
    flag: 'https://flagcdn.com/tr.svg',
    actionMessage: '6 hours ago',
    createdAt: '2023-06-20',
    updatedAt: '2023-11-11',
    isUpdated: true,
  },
  {
    id: '36',
    name: 'Greece',
    code: 'GR',
    isd: '+30',
    currency: 'EUR',
    status: 'Inactive',
    isDefault: false,
    continent: 'Europe',
    population: '10.6 million',
    states: 13,
    cities: 45,
    areas: 180,
    flag: 'https://flagcdn.com/gr.svg',
    actionMessage: '1 week ago',
    createdAt: '2023-07-15',
    updatedAt: '2023-10-05',
  },
  {
    id: '37',
    name: 'Poland',
    code: 'PL',
    isd: '+48',
    currency: 'PLN',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '38 million',
    states: 16,
    cities: 70,
    areas: 310,
    flag: 'https://flagcdn.com/pl.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-08-05',
    updatedAt: '2023-11-12',
  },
  {
    id: '38',
    name: 'Czech Republic',
    code: 'CZ',
    isd: '+420',
    currency: 'CZK',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '10.7 million',
    states: 14,
    cities: 40,
    areas: 170,
    flag: 'https://flagcdn.com/cz.svg',
    actionMessage: '2 days ago',
    createdAt: '2023-09-01',
    updatedAt: '2023-11-04',
  },
  {
    id: '39',
    name: 'Hungary',
    code: 'HU',
    isd: '+36',
    currency: 'HUF',
    status: 'Active',
    isDefault: false,
    continent: 'Europe',
    population: '9.7 million',
    states: 19,
    cities: 36,
    areas: 155,
    flag: 'https://flagcdn.com/hu.svg',
    actionMessage: '3 days ago',
    createdAt: '2023-09-12',
    updatedAt: '2023-11-02',
  },
  {
    id: '40',
    name: 'Malaysia',
    code: 'MY',
    isd: '+60',
    currency: 'MYR',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '33 million',
    states: 13,
    cities: 50,
    areas: 220,
    flag: 'https://flagcdn.com/my.svg',
    actionMessage: '4 hours ago',
    createdAt: '2023-08-20',
    updatedAt: '2023-11-17',
  },
  {
    id: '41',
    name: 'Indonesia',
    code: 'ID',
    isd: '+62',
    currency: 'IDR',
    status: 'Active',
    isDefault: false,
    continent: 'Asia',
    population: '276 million',
    states: 38,
    cities: 98,
    areas: 430,
    flag: 'https://flagcdn.com/id.svg',
    actionMessage: 'Yesterday',
    createdAt: '2023-07-28',
    updatedAt: '2023-11-13',
  },
  {
    id: '42',
    name: 'Thailand',
    code: 'TH',
    isd: '+66',
    currency: 'THB',
    status: 'Inactive',
    isDefault: false,
    continent: 'Asia',
    population: '71 million',
    states: 77,
    cities: 65,
    areas: 280,
    flag: 'https://flagcdn.com/th.svg',
    actionMessage: '5 days ago',
    createdAt: '2023-07-01',
    updatedAt: '2023-09-10',
  },
];

const INITIAL_HISTORY: CountryHistoryEntry[] = [
  {
    id: 'hist-1',
    countryId: '1',
    countryName: 'United States',
    date: '16 Oct 2026, 14:20',
    user: 'John Doe (Admin)',
    action: 'Updated country metadata & ISD',
    status: 'Active',
    exportFormat: 'None',
  },
  {
    id: 'hist-2',
    countryId: '1',
    countryName: 'United States',
    date: '15 Oct 2026, 10:45',
    user: 'Sarah Wilson',
    action: 'Exported Country Profile to PDF',
    status: 'Active',
    exportFormat: 'PDF',
  },
  {
    id: 'hist-3',
    countryId: '4',
    countryName: 'Germany',
    date: '14 Oct 2026, 16:10',
    user: 'Mike Chen',
    action: 'Updated status to Active',
    status: 'Active',
    exportFormat: 'None',
  },
  {
    id: 'hist-4',
    countryId: '5',
    countryName: 'France',
    date: '12 Oct 2026, 11:30',
    user: 'Alex Johnson',
    action: 'Created country draft',
    status: 'Draft',
    exportFormat: 'None',
  },
  {
    id: 'hist-5',
    countryId: '13',
    countryName: 'India',
    date: '10 Oct 2026, 09:15',
    user: 'Admin',
    action: 'Bulk export list to Excel',
    status: 'Active',
    exportFormat: 'XLS',
  },
];

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  private readonly STORAGE_KEY = 'rapid_erp_countries_data';

  // Country state
  countries = signal<Country[]>(this.loadInitialCountries());

  // Audit history log
  history = signal<CountryHistoryEntry[]>(INITIAL_HISTORY);

  // Add/Edit forms minimized to the tab bar; kept here so they survive leaving the module
  minimizedForms = signal<MinimizedCountryForm[]>([]);

  saveMinimizedForm(form: MinimizedCountryForm): void {
    // One tab per form: re-minimizing the same Add/Edit replaces its previous snapshot
    this.minimizedForms.update((list) => [...list.filter((f) => f.id !== form.id), form]);
  }

  removeMinimizedForm(id: string): void {
    this.minimizedForms.update((list) => list.filter((f) => f.id !== id));
  }

  // Computed statistics
  stats = computed<CountryStats>(() => {
    const list = this.countries();
    const active = list.filter((c) => c.status === 'Active').length;
    const inactive = list.filter((c) => c.status === 'Inactive').length;
    const draft = list.filter((c) => c.status === 'Draft').length;
    const deleted = list.filter((c) => c.status === 'Deleted').length;
    const updated = list.filter((c) => c.isUpdated).length;

    return {
      total: list.length,
      active,
      inactive,
      draft,
      updated: updated > 0 ? updated : 25,
      deleted: deleted > 0 ? deleted : 30,
    };
  });

  private loadInitialCountries(): Country[] {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_COUNTRIES;
  }

  private save(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.countries()));
      } catch (e) {
        console.warn('Could not save countries to localStorage', e);
      }
    }
  }

  getCountryById(id: string): Country | undefined {
    return this.countries().find((c) => c.id === id);
  }

  createCountry(data: Partial<Country>): Country {
    const newId = String(Date.now());
    const code = (data.code || 'US').toUpperCase();
    const flag = data.flag || `https://flagcdn.com/${code.toLowerCase()}.svg`;

    const newCountry: Country = {
      id: newId,
      name: data.name || 'Untitled Country',
      code: code,
      isd: data.isd || '+1',
      currency: data.currency ?? 'USD',
      status: (data.status as any) || 'Active',
      isDefault: !!data.isDefault,
      translations: data.translations,
      draftedAt: data.status === 'Draft' ? new Date().toISOString().split('T')[0] : null,
      continent: data.continent || 'Global',
      population: data.population || '10 million',
      states: data.states || 10,
      cities: data.cities || 20,
      areas: data.areas || 40,
      flag: flag,
      actionMessage: 'Just now',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isUpdated: false,
    };

    this.countries.update((prev) => [newCountry, ...prev]);
    this.save();

    this.addHistory(
      newCountry.id,
      newCountry.name,
      `Created country "${newCountry.name}" (${newCountry.code})`,
      newCountry.status,
      'None'
    );

    return newCountry;
  }

  updateCountry(id: string, changes: Partial<Country>): Country | null {
    let updatedCountry: Country | null = null;

    this.countries.update((list) =>
      list.map((c) => {
        if (c.id === id) {
          const code = (changes.code || c.code).toUpperCase();
          const flag = changes.flag || c.flag || `https://flagcdn.com/${code.toLowerCase()}.svg`;
          updatedCountry = {
            ...c,
            ...changes,
            code,
            flag,
            isUpdated: true,
            draftedAt: changes.status === 'Draft' && c.status !== 'Draft' ? new Date().toISOString().split('T')[0] : c.draftedAt,
            actionMessage: 'Just updated',
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updatedCountry;
        }
        return c;
      })
    );

    if (updatedCountry) {
      this.save();
      this.addHistory(
        id,
        (updatedCountry as Country).name,
        `Updated country details for "${(updatedCountry as Country).name}"`,
        (updatedCountry as Country).status,
        'None'
      );
    }

    return updatedCountry;
  }

  deleteCountry(id: string): boolean {
    const target = this.getCountryById(id);
    if (!target) return false;

    // Toggle or mark as Deleted
    this.countries.update((list) =>
      list.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: 'Deleted',
            deletedAt: new Date().toISOString(),
            actionMessage: 'Deleted just now',
          };
        }
        return c;
      })
    );

    this.save();
    this.addHistory(id, target.name, `Deleted country "${target.name}"`, 'Deleted', 'None');
    return true;
  }

  restoreCountry(id: string): boolean {
    const target = this.getCountryById(id);
    if (!target) return false;

    this.countries.update((list) =>
      list.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: 'Active',
            deletedAt: null,
            actionMessage: 'Restored to Active',
          };
        }
        return c;
      })
    );

    this.save();
    this.addHistory(id, target.name, `Restored country "${target.name}" to Active`, 'Active', 'None');
    return true;
  }

  permanentlyRemoveCountry(id: string): void {
    this.countries.update((list) => list.filter((c) => c.id !== id));
    this.save();
  }

  importCountries(newItems: Partial<Country>[]): number {
    const added: Country[] = newItems.map((item, idx) => {
      const code = (item.code || 'XX').toUpperCase();
      return {
        id: `import-${Date.now()}-${idx}`,
        name: item.name || `Imported Country ${idx + 1}`,
        code: code,
        isd: item.isd || '+1',
        currency: item.currency || 'USD',
        status: (item.status as any) || 'Active',
        isDefault: !!item.isDefault,
        continent: item.continent || 'Global',
        population: item.population || '5 million',
        states: item.states || 8,
        cities: item.cities || 24,
        areas: item.areas || 60,
        flag: item.flag || `https://flagcdn.com/${code.toLowerCase()}.svg`,
        actionMessage: 'Imported batch',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });

    this.countries.update((prev) => [...added, ...prev]);
    this.save();
    this.addHistory('bulk', 'Batch Import', `Successfully imported ${added.length} countries`, 'Active', 'CSV');
    return added.length;
  }

  addHistory(
    countryId: string,
    countryName: string,
    action: string,
    status: 'Active' | 'Inactive' | 'Draft' | 'Deleted',
    exportFormat: 'PDF' | 'CSV' | 'XLS' | 'DOC' | 'Print' | 'None' = 'None'
  ): void {
    const newEntry: CountryHistoryEntry = {
      id: 'hist-' + Date.now(),
      countryId,
      countryName,
      date: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      user: 'Admin (System)',
      action,
      status,
      exportFormat,
    };
    this.history.update((list) => [newEntry, ...list.slice(0, 40)]);
  }

  exportData(format: 'pdf' | 'csv' | 'xlsx' | 'print', filteredList?: Country[]): void {
    const data = filteredList || this.countries();
    this.addHistory(
      'export',
      'All Countries',
      `Exported ${data.length} records as ${format.toUpperCase()}`,
      'Active',
      format.toUpperCase() as any
    );

    if (format === 'csv') {
      const headers = ['ID', 'Country Name', 'Code', 'ISD', 'Currency', 'Status', 'Default', 'Created At'];
      const rows = data.map((c) => [
        c.id,
        `"${c.name}"`,
        c.code,
        `"${c.isd}"`,
        c.currency,
        c.status,
        c.isDefault ? 'Yes' : 'No',
        c.createdAt,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `rapid_erp_countries_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'print') {
      window.print();
    } else {
      // PDF or Excel mock download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapid_erp_countries_${format}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

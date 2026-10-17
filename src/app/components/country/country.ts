import {
  Component,
  inject,
  signal,
  computed,
  effect,
  untracked,
  HostListener,
  ViewChild,
  ElementRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CountryService } from './country.service';
import { Country, CountryHistoryEntry, MinimizedCountryForm } from './country.models';
import { NavigationService } from '../../services/navigation.service';
import { DropdownOption, SelectDropdown } from '../select-dropdown/select-dropdown';

export type CountryViewMode = 'grid' | 'list' | 'add' | 'edit' | 'view';

export type FormStatus = 'Active' | 'Inactive' | 'Draft' | 'Delete';

export type FilterFieldKey = 'name' | 'code' | 'isd' | 'currency' | 'status' | 'isDefault' | 'continent';

export type ListSortKey =
  | 'name'
  | 'code'
  | 'isd'
  | 'currency'
  | 'states'
  | 'cities'
  | 'areas'
  | 'continent'
  | 'population'
  | 'isDefault'
  | 'createdAt'
  | 'updatedAt'
  | 'draftedAt'
  | 'status';

export type ExportFieldKey =
  | 'name' | 'code' | 'isd' | 'currency' | 'status' | 'isDefault'
  | 'continent' | 'states' | 'cities' | 'createdAt' | 'updatedAt' | 'draftedAt';

export interface ExportField {
  key: ExportFieldKey;
  label: string;
}

export type ExportButtonId = 'excel' | 'pdf' | 'csv' | 'print' | 'docs' | 'whatsapp' | 'email';

export interface ListColumn {
  key: ListSortKey;
  label: string;
}

export type ImportFieldKey = 'name' | 'code' | 'isd' | 'currency' | 'status' | 'continent';

export interface ImportField {
  key: ImportFieldKey;
  label: string;
  required: boolean;
  aliases: string[];
}

export interface GalleryFlag {
  code: string;
  name: string;
  flagUrl: string;
}

@Component({
  selector: 'app-country',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectDropdown],
  templateUrl: './country.html',
  styleUrl: './country.css',
})
export class CountryComponent implements OnInit {
  public countryService = inject(CountryService);
  public navService = inject(NavigationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('flagFileInput') flagFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('importFileInput') importFileInput?: ElementRef<HTMLInputElement>;

  // Current view mode: 'grid' | 'list' | 'add' | 'edit' | 'view'
  viewMode = signal<CountryViewMode>('grid');

  // Active filter tab: 'all' | 'active' | 'inactive' | 'draft' | 'updated' | 'deleted'
  activeFilterTab = signal<string>('all');

  // Search query
  searchQuery = signal<string>('');
  isSearchListening = signal<boolean>(false);

  // Filter side panel: checkbox values per field. Draft = what's ticked in the panel,
  // applied = what filters the data (null = no field filter).
  isFilterPanelOpen = signal<boolean>(false);
  filterSearch = signal<string>('');
  readonly filterFieldDefs: { key: FilterFieldKey; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'isd', label: 'ISD' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'isDefault', label: 'Default' },
    { key: 'continent', label: 'Continent' },
  ];
  filterDraft = signal<Record<FilterFieldKey, Set<string>> | null>(null);
  appliedFilter = signal<Partial<Record<FilterFieldKey, Set<string>>> | null>(null);

  // Grid lazy loading: 20 cards first, 20 more each time the bottom is reached
  readonly gridPageSize = 20;
  gridVisibleCount = signal<number>(20);
  isLoadingMore = signal<boolean>(false);

  // Export & Import & History & Delete modals
  isExportPanelOpen = signal<boolean>(false);
  exportSearch = signal<string>('');
  exportFields = signal<Set<ExportFieldKey>>(new Set());
  readonly exportFieldDefs: ExportField[] = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'isd', label: 'ISD' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'isDefault', label: 'Default' },
    { key: 'continent', label: 'Continent' },
    { key: 'states', label: 'States' },
    { key: 'cities', label: 'Cities' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'draftedAt', label: 'Drafted At' },
  ];
  readonly exportButtons: { id: ExportButtonId; label: string; color: string }[] = [
    { id: 'excel', label: 'Export to Excel', color: '#16a34a' },
    { id: 'pdf', label: 'Export to PDF', color: '#dc2626' },
    { id: 'csv', label: 'Export to CSV', color: '#2563eb' },
    { id: 'print', label: 'Export to Print', color: '#4b5563' },
    { id: 'docs', label: 'Export to Docs', color: '#9333ea' },
    { id: 'whatsapp', label: 'Export to WhatsApp', color: '#22c55e' },
    { id: 'email', label: 'Export to Email', color: '#3b82f6' },
  ];

  // WhatsApp / Email share dialog
  shareChannel = signal<'whatsapp' | 'email' | null>(null);
  readonly shareFrom = signal<string>('+8801711111111');
  readonly whatsappContacts = [
    { name: 'Rashed', phone: '+8801711111111' },
    { name: 'Someone', phone: '+87687098987' },
    { name: 'John Cena', phone: '+676767667' },
    { name: 'King', phone: '+88017732765' },
  ];
  readonly shareAttachmentOptions: { id: 'pdf' | 'excel' | 'csv' | 'docs'; label: string }[] = [
    { id: 'pdf', label: 'PDF' },
    { id: 'excel', label: 'Excel' },
    { id: 'csv', label: 'CSV' },
    { id: 'docs', label: 'Doc' },
  ];
  shareContacts = signal<Set<string>>(new Set());
  shareAttachments = signal<Set<'pdf' | 'excel' | 'csv' | 'docs'>>(new Set(['pdf']));
  emailTo = signal<string>('');
  emailCc = signal<string>('');
  emailBcc = signal<string>('');
  emailSubject = signal<string>('');
  shareBody = signal<string>('');
  isImportModalOpen = signal<boolean>(false);
  isHistoryModalOpen = signal<boolean>(false);
  isDeleteModalOpen = signal<boolean>(false);
  selectedCountryForDelete = signal<Country | null>(null);

  // Currently viewed or edited country
  currentCountryId = signal<string | null>(null);
  selectedCountry = computed(() => {
    const id = this.currentCountryId();
    if (!id) return null;
    return this.countryService.getCountryById(id) || null;
  });

  viewCountry = computed<Country>(() => {
    const sc = this.selectedCountry();
    if (sc) return sc;
    return {
      id: this.currentCountryId() || '0',
      name: this.formName() || 'Country',
      code: this.formCode() || 'US',
      isd: this.formIsd() || '+1',
      currency: this.formCurrency() || 'USD',
      status: (this.formStatus() === 'Delete' ? 'Deleted' : this.formStatus()) as any,
      isDefault: this.formDefault() === 'Yes',
      flag: this.formFlag() || `https://flagcdn.com/${(this.formCode() || 'us').toLowerCase()}.svg`,
      continent: this.formContinent() || '',
      translations: this.formTranslations() || {},
      actionMessage: 'Updated',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };
  });

  // Country Form State for Add / Edit
  formCode = signal<string>('US');
  formIsd = signal<string>('+1');
  formName = signal<string>('United States');
  formCurrency = signal<string>('USD');
  formDefault = signal<'Yes' | 'No'>('No');
  formStatus = signal<FormStatus>('Active');
  formFlag = signal<string | null>('https://flagcdn.com/us.svg');
  formContinent = signal<string>('North America');
  formTranslations = signal<Record<string, string>>({});

  // Form field focus tracking for floating label
  isCodeFocused = signal<boolean>(false);
  isIsdFocused = signal<boolean>(false);
  isNameFocused = signal<boolean>(false);

  // Create allows Active/Draft only; Inactive and Delete are edit-only
  statusOptions = computed<DropdownOption[]>(() => {
    const active = { value: 'Active', label: 'Active', description: 'Set active country' };
    const draft = { value: 'Draft', label: 'Draft', description: 'Set draft country' };
    if (this.viewMode() !== 'edit') return [active, draft];
    return [
      active,
      { value: 'Inactive', label: 'Inactive', description: 'Set inactive country' },
      draft,
      { value: 'Delete', label: 'Delete', description: 'Set delete country' },
    ];
  });

  readonly defaultOptions: DropdownOption[] = [
    { value: 'Yes', label: 'Yes', description: 'Set default country' },
    { value: 'No', label: 'No', description: 'Remove default country' },
  ];

  // Import "Match Fields": not mapped + every CSV column
  importColumnOptions = computed<DropdownOption[]>(() => [
    { value: -1, label: '— Not mapped —' },
    ...this.importHeaders().map((h, i) => ({ value: i, label: h || `Column ${i + 1}`, description: `Column ${i + 1}` })),
  ]);

  // Name translations popover
  readonly translationLanguages = [
    { code: 'ar', label: 'Arabic', dir: 'rtl' },
    { code: 'hi', label: 'Hindi', dir: 'ltr' },
    { code: 'ur', label: 'Urdu', dir: 'rtl' },
    { code: 'bn', label: 'Bangla', dir: 'ltr' },
  ];
  isTranslationOpen = signal<boolean>(false);
  translationDraft = signal<Record<string, string>>({});
  translationCount = computed(() => Object.values(this.formTranslations()).filter((v) => v.trim()).length);

  // Read-only action history for the record being edited / viewed
  isActionListOpen = signal<boolean>(false);
  countryActions = computed<CountryHistoryEntry[]>(() => {
    const id = this.currentCountryId();
    if (!id) return [];
    return this.countryService.history().filter((h) => h.countryId === id);
  });

  // Form footer switches (Keep / PDF / Print)
  keepOnPage = signal<boolean>(false);
  pdfOnSubmit = signal<boolean>(false);
  printOnSubmit = signal<boolean>(false);
  isResetModalOpen = signal<boolean>(false);

  // View page footer switches + export prompt
  viewPdf = signal<boolean>(false);
  viewPrint = signal<boolean>(false);
  isExportPromptOpen = signal<boolean>(false);

  // Field speech listening signals
  activeListeningField = signal<string | null>(null);
  private speechRecognitionObj: any = null;

  // Flag uploader sub-tab
  flagTab = signal<'drop' | 'attachment' | 'gallery'>('drop');
  isDraggingFlag = signal<boolean>(false);

  // Popular flags gallery for 1-click select
  galleryFlags: GalleryFlag[] = [
    { code: 'US', name: 'United States', flagUrl: 'https://flagcdn.com/us.svg' },
    { code: 'GB', name: 'United Kingdom', flagUrl: 'https://flagcdn.com/gb.svg' },
    { code: 'CA', name: 'Canada', flagUrl: 'https://flagcdn.com/ca.svg' },
    { code: 'DE', name: 'Germany', flagUrl: 'https://flagcdn.com/de.svg' },
    { code: 'FR', name: 'France', flagUrl: 'https://flagcdn.com/fr.svg' },
    { code: 'IT', name: 'Italy', flagUrl: 'https://flagcdn.com/it.svg' },
    { code: 'ES', name: 'Spain', flagUrl: 'https://flagcdn.com/es.svg' },
    { code: 'JP', name: 'Japan', flagUrl: 'https://flagcdn.com/jp.svg' },
    { code: 'IN', name: 'India', flagUrl: 'https://flagcdn.com/in.svg' },
    { code: 'AU', name: 'Australia', flagUrl: 'https://flagcdn.com/au.svg' },
    { code: 'AE', name: 'United Arab Emirates', flagUrl: 'https://flagcdn.com/ae.svg' },
    { code: 'SA', name: 'Saudi Arabia', flagUrl: 'https://flagcdn.com/sa.svg' },
    { code: 'SG', name: 'Singapore', flagUrl: 'https://flagcdn.com/sg.svg' },
    { code: 'BR', name: 'Brazil', flagUrl: 'https://flagcdn.com/br.svg' },
    { code: 'KR', name: 'South Korea', flagUrl: 'https://flagcdn.com/kr.svg' },
    { code: 'TR', name: 'Turkey', flagUrl: 'https://flagcdn.com/tr.svg' },
  ];

  // Country Code Presets with predefined ISD & Currencies
  countryPresets = [
    { code: 'US', name: 'United States', isd: '+1', currency: 'USD', continent: 'North America' },
    { code: 'CA', name: 'Canada', isd: '+1', currency: 'CAD', continent: 'North America' },
    { code: 'GB', name: 'United Kingdom', isd: '+44', currency: 'GBP', continent: 'Europe' },
    { code: 'DE', name: 'Germany', isd: '+49', currency: 'EUR', continent: 'Europe' },
    { code: 'FR', name: 'France', isd: '+33', currency: 'EUR', continent: 'Europe' },
    { code: 'IT', name: 'Italy', isd: '+39', currency: 'EUR', continent: 'Europe' },
    { code: 'ES', name: 'Spain', isd: '+34', currency: 'EUR', continent: 'Europe' },
    { code: 'PT', name: 'Portugal', isd: '+351', currency: 'EUR', continent: 'Europe' },
    { code: 'CH', name: 'Switzerland', isd: '+41', currency: 'CHF', continent: 'Europe' },
    { code: 'NL', name: 'Netherlands', isd: '+31', currency: 'EUR', continent: 'Europe' },
    { code: 'BE', name: 'Belgium', isd: '+32', currency: 'EUR', continent: 'Europe' },
    { code: 'JP', name: 'Japan', isd: '+81', currency: 'JPY', continent: 'Asia' },
    { code: 'IN', name: 'India', isd: '+91', currency: 'INR', continent: 'Asia' },
    { code: 'AU', name: 'Australia', isd: '+61', currency: 'AUD', continent: 'Oceania' },
    { code: 'AE', name: 'United Arab Emirates', isd: '+971', currency: 'AED', continent: 'Asia' },
    { code: 'SA', name: 'Saudi Arabia', isd: '+966', currency: 'SAR', continent: 'Asia' },
    { code: 'SG', name: 'Singapore', isd: '+65', currency: 'SGD', continent: 'Asia' },
    { code: 'BR', name: 'Brazil', isd: '+55', currency: 'BRL', continent: 'South America' },
    { code: 'MX', name: 'Mexico', isd: '+52', currency: 'MXN', continent: 'North America' },
    { code: 'CN', name: 'China', isd: '+86', currency: 'CNY', continent: 'Asia' },
    { code: 'KR', name: 'South Korea', isd: '+82', currency: 'KRW', continent: 'Asia' },
    { code: 'NZ', name: 'New Zealand', isd: '+64', currency: 'NZD', continent: 'Oceania' },
    { code: 'ZA', name: 'South Africa', isd: '+27', currency: 'ZAR', continent: 'Africa' },
    { code: 'SE', name: 'Sweden', isd: '+46', currency: 'SEK', continent: 'Europe' },
    { code: 'NO', name: 'Norway', isd: '+47', currency: 'NOK', continent: 'Europe' },
    { code: 'DK', name: 'Denmark', isd: '+45', currency: 'DKK', continent: 'Europe' },
    { code: 'FI', name: 'Finland', isd: '+358', currency: 'EUR', continent: 'Europe' },
    { code: 'IE', name: 'Ireland', isd: '+353', currency: 'EUR', continent: 'Europe' },
    { code: 'AT', name: 'Austria', isd: '+43', currency: 'EUR', continent: 'Europe' },
    { code: 'QA', name: 'Qatar', isd: '+974', currency: 'QAR', continent: 'Asia' },
    { code: 'KW', name: 'Kuwait', isd: '+965', currency: 'KWD', continent: 'Asia' },
    { code: 'OM', name: 'Oman', isd: '+968', currency: 'OMR', continent: 'Asia' },
    { code: 'BH', name: 'Bahrain', isd: '+973', currency: 'BHD', continent: 'Asia' },
    { code: 'EG', name: 'Egypt', isd: '+20', currency: 'EGP', continent: 'Africa' },
    { code: 'TR', name: 'Turkey', isd: '+90', currency: 'TRY', continent: 'Europe' },
    { code: 'GR', name: 'Greece', isd: '+30', currency: 'EUR', continent: 'Europe' },
    { code: 'PL', name: 'Poland', isd: '+48', currency: 'PLN', continent: 'Europe' },
    { code: 'CZ', name: 'Czech Republic', isd: '+420', currency: 'CZK', continent: 'Europe' },
    { code: 'HU', name: 'Hungary', isd: '+36', currency: 'HUF', continent: 'Europe' },
    { code: 'MY', name: 'Malaysia', isd: '+60', currency: 'MYR', continent: 'Asia' },
    { code: 'ID', name: 'Indonesia', isd: '+62', currency: 'IDR', continent: 'Asia' },
    { code: 'TH', name: 'Thailand', isd: '+66', currency: 'THB', continent: 'Asia' },
  ];

  // Toast feedback message
  toastMessage = signal<string | null>(null);

  // Import wizard state
  importStep = signal<1 | 2 | 3>(1);
  importFileName = signal<string | null>(null);
  importRowCount = signal<number>(0);
  isImporting = signal<boolean>(false);
  isImportDragging = signal<boolean>(false);
  importError = signal<string | null>(null);
  importHeaders = signal<string[]>([]);
  importRows = signal<string[][]>([]);
  // Country field key -> CSV column index (-1 = not mapped)
  importMapping = signal<Record<ImportFieldKey, number>>(this.emptyImportMapping());
  importProgress = signal<number>(0);
  importResult = signal<{ imported: number; skipped: number } | null>(null);

  readonly importSteps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: 'Upload File' },
    { n: 2, label: 'Match Fields' },
    { n: 3, label: 'In Progress' },
  ];

  readonly importFields: ImportField[] = [
    { key: 'name', label: 'Country Name', required: true, aliases: ['name', 'country', 'countryname'] },
    { key: 'code', label: 'Code', required: true, aliases: ['code', 'countrycode', 'iso', 'isocode'] },
    { key: 'isd', label: 'ISD', required: false, aliases: ['isd', 'isdcode', 'dialcode', 'phonecode', 'callingcode'] },
    { key: 'currency', label: 'Currency', required: false, aliases: ['currency', 'currencycode'] },
    { key: 'status', label: 'Status', required: false, aliases: ['status'] },
    { key: 'continent', label: 'Continent', required: false, aliases: ['continent', 'region'] },
  ];

  importMissingRequired = computed(() => {
    const mapping = this.importMapping();
    return this.importFields.filter((f) => f.required && mapping[f.key] < 0).map((f) => f.label);
  });

  // First few mapped rows shown on the Match Fields step
  importPreviewRows = computed(() => {
    const mapping = this.importMapping();
    return this.importRows()
      .slice(0, 3)
      .map((row) => this.importFields.map((f) => (mapping[f.key] >= 0 ? row[mapping[f.key]] ?? '' : '')));
  });

  // Close translation / action / visibility popovers on outside click or Escape
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if ((event.target as Element | null)?.closest('[data-popover]')) return;
    this.closePopovers();
  }

  @HostListener('document:keydown.escape')
  closePopovers(): void {
    this.isTranslationOpen.set(false);
    this.isActionListOpen.set(false);
    this.isPageSizeMenuOpen.set(false);
    this.isCustomPageSizeOpen.set(false);
    this.isPageDropdownOpen.set(false);
    this.activeColumnMenu.set(null);
    this.columnMenuPos.set(null);
    if (this.editingCell()) {
      this.cancelCellEdit();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.activeColumnMenu()) {
      this.closeColumnMenu();
    }
  }

  getPercentage(key: 'active' | 'inactive' | 'draft' | 'deleted'): number {
    const stats = this.countryService.stats();
    if (!stats.total) return 0;
    return Math.round((stats[key] / stats.total) * 100);
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((qp) => {
      const mode = (qp.get('mode') || qp.get('view')) as CountryViewMode | null;
      const tab = qp.get('tab');
      const id = qp.get('id');

      if (id && id !== this.currentCountryId()) {
        this.currentCountryId.set(id);
        const c = this.countryService.countries().find((item) => item.id === id);
        if (c) {
          this.loadCountryIntoForm(c);
        }
      }

      if (mode && ['grid', 'list', 'add', 'edit', 'view'].includes(mode)) {
        if (this.viewMode() !== mode) {
          this.selectedCell.set(null);
          this.editingCell.set(null);
          if (mode === 'add') {
            this.clearForm();
          } else if ((mode === 'edit' || mode === 'view') && !this.formCode()) {
            const c = this.selectedCountry();
            if (c) this.loadCountryIntoForm(c);
          }
          this.viewMode.set(mode);
        }
      }

      if (tab && ['all', 'active', 'inactive', 'draft', 'deleted'].includes(tab)) {
        if (this.activeFilterTab() !== tab) {
          this.activeFilterTab.set(tab);
        }
      }
    });
  }

  // Filtered Countries List computed dynamically
  filteredCountries = computed<Country[]>(() => {
    let list = this.countryService.countries();

    // 1. Stat Tab Filter
    const tab = this.activeFilterTab();
    if (tab === 'active') {
      list = list.filter((c) => c.status === 'Active');
    } else if (tab === 'inactive') {
      list = list.filter((c) => c.status === 'Inactive');
    } else if (tab === 'draft') {
      list = list.filter((c) => c.status === 'Draft');
    } else if (tab === 'deleted') {
      list = list.filter((c) => c.status === 'Deleted');
    } else if (tab === 'updated') {
      list = list.filter((c) => c.isUpdated);
    }

    // 2. Search query filter
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.isd.toLowerCase().includes(q) ||
          c.currency.toLowerCase().includes(q) ||
          (c.continent && c.continent.toLowerCase().includes(q))
      );
    }

    // 3. Filter panel: a row must match every restricted field
    const applied = this.appliedFilter();
    if (applied) {
      const entries = Object.entries(applied) as [FilterFieldKey, Set<string>][];
      list = list.filter((c) => entries.every(([key, allowed]) => allowed.has(this.filterValue(c, key))));
    }

    // 4. Column Header Filters (Image 4 replica)
    const colFilters = this.appliedColumnFilters();
    for (const [colKey, allowedSet] of Object.entries(colFilters)) {
      if (allowedSet && allowedSet.size > 0) {
        list = list.filter((c) => {
          let val = (c as any)[colKey];
          if (val === null || val === undefined || val === '') val = '—';
          if (this.dateColumns.includes(colKey as any)) {
            val = this.formatDate(val);
          }
          return allowedSet.has(String(val));
        });
      }
    }

    return list;
  });

  // Grid shows only the loaded slice of the filtered list
  gridCountries = computed(() => this.filteredCountries().slice(0, this.gridVisibleCount()));
  hasMoreGrid = computed(() => this.gridVisibleCount() < this.filteredCountries().length);

  // Any change to search / tabs / filters starts the grid again from the first 20
  private resetGridPaging = effect(() => {
    this.filteredCountries();
    untracked(() => {
      this.gridVisibleCount.set(this.gridPageSize);
      this.isLoadingMore.set(false);
    });
  });

  onGridScroll(event: Event): void {
    if (this.viewMode() !== 'grid') return;
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 120) return;
    this.loadMoreGrid();
  }

  loadMoreGrid(): void {
    if (this.isLoadingMore() || !this.hasMoreGrid()) return;
    this.isLoadingMore.set(true);
    // Short delay so the loader is visible, as with a paged API
    setTimeout(() => {
      this.gridVisibleCount.update((n) => n + this.gridPageSize);
      this.isLoadingMore.set(false);
    }, 600);
  }

  // ---- Filter panel ----
  filterValue(c: Country, key: FilterFieldKey): string {
    if (key === 'isDefault') return c.isDefault ? 'Yes' : 'No';
    const v = c[key];
    return v ? String(v) : '—';
  }

  // Every distinct value per field across all countries (independent of the current filter)
  filterValueOptions = computed<Record<FilterFieldKey, string[]>>(() => {
    const all = this.countryService.countries();
    const result = {} as Record<FilterFieldKey, string[]>;
    for (const f of this.filterFieldDefs) {
      const values = [...new Set(all.map((c) => this.filterValue(c, f.key)))];
      // Name keeps list order (as on the cards); the rest sort alphabetically
      result[f.key] = f.key === 'name' ? values : values.sort((a, b) => a.localeCompare(b));
    }
    return result;
  });

  // Fields/values shown for the current panel search (field label or value match)
  visibleFilterFields = computed(() => {
    const q = this.filterSearch().trim().toLowerCase();
    const options = this.filterValueOptions();
    return this.filterFieldDefs
      .map((f) => {
        const labelMatch = !q || f.label.toLowerCase().includes(q);
        const values = labelMatch ? options[f.key] : options[f.key].filter((v) => v.toLowerCase().includes(q));
        return { ...f, values };
      })
      .filter((f) => f.values.length > 0);
  });

  isFilterActive = computed(() => !!this.appliedFilter());

  private fullFilterSelection(): Record<FilterFieldKey, Set<string>> {
    const options = this.filterValueOptions();
    const draft = {} as Record<FilterFieldKey, Set<string>>;
    for (const f of this.filterFieldDefs) draft[f.key] = new Set(options[f.key]);
    return draft;
  }

  toggleFilterPanel(): void {
    if (this.isFilterPanelOpen()) {
      this.isFilterPanelOpen.set(false);
      return;
    }
    // Start from what's applied; untouched fields are fully ticked
    const draft = this.fullFilterSelection();
    const applied = this.appliedFilter();
    if (applied) {
      for (const [key, set] of Object.entries(applied) as [FilterFieldKey, Set<string>][]) draft[key] = new Set(set);
    }
    this.filterDraft.set(draft);
    this.filterSearch.set('');
    this.isExportPanelOpen.set(false);
    this.isFilterPanelOpen.set(true);
  }

  isFilterValueChecked(key: FilterFieldKey, value: string): boolean {
    return !!this.filterDraft()?.[key].has(value);
  }

  filterFieldState(key: FilterFieldKey): 'all' | 'some' | 'none' {
    const set = this.filterDraft()?.[key];
    const total = this.filterValueOptions()[key].length;
    if (!set || set.size === 0) return 'none';
    return set.size >= total ? 'all' : 'some';
  }

  toggleFilterValue(key: FilterFieldKey, value: string): void {
    this.filterDraft.update((d) => {
      if (!d) return d;
      const next = new Set(d[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...d, [key]: next };
    });
  }

  toggleFilterField(key: FilterFieldKey): void {
    const selectAll = this.filterFieldState(key) !== 'all';
    this.filterDraft.update((d) => (d ? { ...d, [key]: selectAll ? new Set(this.filterValueOptions()[key]) : new Set() } : d));
  }

  applyFilterPanel(): void {
    const draft = this.filterDraft();
    if (!draft) return;
    const options = this.filterValueOptions();
    // Only fields with something unticked restrict the data
    const applied: Partial<Record<FilterFieldKey, Set<string>>> = {};
    for (const f of this.filterFieldDefs) {
      if (draft[f.key].size < options[f.key].length) applied[f.key] = new Set(draft[f.key]);
    }
    this.appliedFilter.set(Object.keys(applied).length ? applied : null);
    this.isFilterPanelOpen.set(false);
    this.showToast(Object.keys(applied).length ? 'Filters applied successfully.' : 'Showing all countries.');
  }

  resetFilterPanel(): void {
    this.filterDraft.set(this.fullFilterSelection());
    this.filterSearch.set('');
    this.appliedFilter.set(null);
  }

  // ---- List (table) view ----
  readonly listColumns: ListColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'isd', label: 'ISD' },
    { key: 'currency', label: 'Currency' },
    { key: 'states', label: 'States' },
    { key: 'cities', label: 'Cities' },
    { key: 'areas', label: 'Areas' },
    { key: 'continent', label: 'Continent' },
    { key: 'population', label: 'Population' },
    { key: 'isDefault', label: 'Default' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' },
    { key: 'draftedAt', label: 'Drafted' },
    { key: 'status', label: 'Status' },
  ];
  readonly pageSizeOptions = [10, 25, 50, 75];
  readonly dateColumns: ListSortKey[] = ['createdAt', 'updatedAt', 'draftedAt'];

  hiddenColumns = signal<Set<ListSortKey>>(new Set());
  isVisibilityOpen = signal<boolean>(false);
  visibilitySearch = signal<string>('');
  isSelectColumnVisible = signal<boolean>(true);

  toggleVisibilityPanel(event?: Event): void {
    if (event) event.stopPropagation();
    const next = !this.isVisibilityOpen();
    this.isVisibilityOpen.set(next);
    if (next) {
      this.isFilterPanelOpen.set(false);
      this.isExportPanelOpen.set(false);
    }
  }

  readonly visibilityColumnDefinitions: { key: ListSortKey; label: string }[] = [
    { key: 'name', label: 'Title' },
    { key: 'code', label: 'Code' },
    { key: 'isd', label: 'CallingCode' },
    { key: 'currency', label: 'Currency' },
    { key: 'states', label: 'States' },
    { key: 'cities', label: 'Cities' },
    { key: 'areas', label: 'Areas' },
    { key: 'continent', label: 'Continent' },
    { key: 'population', label: 'Population' },
    { key: 'isDefault', label: 'Default' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' },
    { key: 'draftedAt', label: 'Drafted' },
    { key: 'status', label: 'Status' },
  ];

  filteredVisibilityColumns = computed(() => {
    const q = this.visibilitySearch().toLowerCase().trim();
    if (!q) return this.visibilityColumnDefinitions;
    return this.visibilityColumnDefinitions.filter((c) =>
      c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  });

  isAllColumnsVisible = computed(() => {
    return this.hiddenColumns().size === 0 && this.isSelectColumnVisible();
  });

  toggleAllColumnsVisible(): void {
    if (this.isAllColumnsVisible()) {
      this.hiddenColumns.set(new Set(this.visibilityColumnDefinitions.map((c) => c.key)));
      this.isSelectColumnVisible.set(false);
    } else {
      this.hiddenColumns.set(new Set());
      this.isSelectColumnVisible.set(true);
    }
  }

  // Bulk update and inline/cell editing
  isBulkUpdateModalOpen = signal<boolean>(false);
  bulkUpdateStatusValue = '';
  bulkUpdateCurrencyValue = '';
  editingCountryId = signal<string | null>(null);
  editingCountryName = signal<string>('');
  editingCell = signal<{ id: string; field: string } | null>(null);
  editingCellValue = signal<string>('');
  hasPendingChanges = signal<boolean>(false);

  sortKey = signal<ListSortKey | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');
  pageSize = signal<number>(10);
  page = signal<number>(1);
  selectedIds = signal<Set<string>>(new Set());

  visibleColumns = computed(() => this.listColumns.filter((c) => !this.hiddenColumns().has(c.key)));

  sortedCountries = computed<Country[]>(() => {
    const list = this.filteredCountries();
    const key = this.sortKey();
    if (!key) return list;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedCountries().length / this.pageSize())));
  // Clamp so a shrinking result set (search/filter) never leaves us on an empty page
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  });

  pagedCountries = computed<Country[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedCountries().slice(start, start + this.pageSize());
  });

  pageRangeLabel = computed(() => {
    const total = this.sortedCountries().length;
    if (!total) return 'Showing 0 of 0 Countries';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(start + this.pageSize() - 1, total);
    return `Showing ${start}-${end} of ${total} ${total === 1 ? 'Country' : 'Countries'}`;
  });

  isPageAllSelected = computed(() => {
    const rows = this.pagedCountries();
    return rows.length > 0 && rows.every((c) => this.selectedIds().has(c.id));
  });

  isPagePartlySelected = computed(() => {
    const rows = this.pagedCountries();
    const count = rows.filter((c) => this.selectedIds().has(c.id)).length;
    return count > 0 && count < rows.length;
  });

  toggleSort(key: ListSortKey): void {
    if (this.sortKey() !== key) {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    } else if (this.sortDir() === 'asc') {
      this.sortDir.set('desc');
    } else {
      this.sortKey.set(null);
    }
  }

  // Extended page size options (Image 2 replica)
  isPageSizeMenuOpen = signal<boolean>(false);
  isCustomPageSizeOpen = signal<boolean>(false);
  customPageSizeInput = signal<string>('');
  readonly extendedPageSizes: (number | 'All')[] = ['All', 999, 750, 500, 250, 100];

  togglePageSizeMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isPageSizeMenuOpen.update((v) => !v);
  }

  selectExtendedPageSize(opt: number | 'All'): void {
    if (opt === 'All') {
      this.setPageSize(this.sortedCountries().length || 10000);
    } else {
      this.setPageSize(opt);
    }
    this.isPageSizeMenuOpen.set(false);
    this.isCustomPageSizeOpen.set(false);
  }

  applyCustomPageSize(): void {
    let val = parseInt(this.customPageSizeInput().trim(), 10);
    if (isNaN(val)) return;
    if (val < 10) {
      val = 10;
      this.customPageSizeInput.set('10');
      this.showToast('Minimum page size is 10');
    } else if (val > 999) {
      val = 999;
      this.customPageSizeInput.set('999');
      this.showToast('Maximum page size is 999');
    }
    this.setPageSize(val);
    this.isPageSizeMenuOpen.set(false);
  }

  // Active page dropdown & direct numeric input (Screenshot 4 replica)
  isPageDropdownOpen = signal<boolean>(false);
  pageInputValue = signal<string>('1');

  pagesList = computed<number[]>(() => {
    const total = this.totalPages();
    const arr: number[] = [];
    for (let i = total; i >= 1; i--) {
      arr.push(i);
    }
    return arr;
  });

  togglePageDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.isPageDropdownOpen.update((v) => !v);
  }

  selectPageFromDropdown(page: number): void {
    this.goToPage(page);
    this.pageInputValue.set(String(page));
    this.isPageDropdownOpen.set(false);
  }

  onPageInputKey(val: any): void {
    this.pageInputValue.set(String(val));
  }

  commitPageInput(): void {
    const raw = parseInt(this.pageInputValue().trim(), 10);
    if (!isNaN(raw)) {
      const clamped = Math.max(1, Math.min(this.totalPages(), raw));
      this.goToPage(clamped);
      this.pageInputValue.set(String(clamped));
    } else {
      this.pageInputValue.set(String(this.currentPage()));
    }
    this.isPageDropdownOpen.set(false);
  }

  // Column Header Filter Menu state (Image 4 replica)
  activeColumnMenu = signal<string | null>(null);
  columnMenuPos = signal<{ top: number; left: number } | null>(null);
  columnMenuSearch = signal<string>('');
  columnDraftSelections = signal<Record<string, Set<string>>>({});
  appliedColumnFilters = signal<Record<string, Set<string>>>({});

  openColumnMenu(key: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeColumnMenu() === key) {
      this.closeColumnMenu();
      return;
    }
    this.closePopovers();
    this.activeColumnMenu.set(key);
    this.columnMenuSearch.set('');

    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 240;
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - menuWidth - 16);
    }
    let top = rect.bottom + 6;
    const menuEstimatedHeight = 360;
    if (top + menuEstimatedHeight > window.innerHeight - 16) {
      if (rect.top - menuEstimatedHeight - 6 > 10) {
        top = rect.top - menuEstimatedHeight - 6;
      } else {
        top = Math.max(10, window.innerHeight - menuEstimatedHeight - 16);
      }
    }
    this.columnMenuPos.set({ top, left });

    const distinct = this.getColumnDistinctValues(key);
    const applied = this.appliedColumnFilters()[key];
    const draft = applied ? new Set(applied) : new Set(distinct);
    this.columnDraftSelections.update((prev) => ({ ...prev, [key]: draft }));
  }

  closeColumnMenu(): void {
    this.activeColumnMenu.set(null);
    this.columnMenuPos.set(null);
    this.columnMenuSearch.set('');
  }

  getColumnDistinctValues(key: string): string[] {
    const list = this.countryService.countries();
    const set = new Set<string>();
    list.forEach((c) => {
      let val = (c as any)[key];
      if (val === null || val === undefined || val === '') val = '—';
      if (this.dateColumns.includes(key as any)) {
        val = this.formatDate(val);
      }
      set.add(String(val));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  getFilteredDistinctValues(key: string): string[] {
    const all = this.getColumnDistinctValues(key);
    const q = this.columnMenuSearch().trim().toLowerCase();
    if (!q) return all;
    return all.filter((v) => v.toLowerCase().includes(q));
  }

  isColumnValueSelected(key: string, value: string): boolean {
    return !!this.columnDraftSelections()[key]?.has(value);
  }

  toggleColumnValue(key: string, value: string): void {
    this.columnDraftSelections.update((prev) => {
      const current = new Set(prev[key] || []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [key]: current };
    });
  }

  isColumnAllSelected(key: string): boolean {
    const all = this.getFilteredDistinctValues(key);
    const current = this.columnDraftSelections()[key];
    return all.length > 0 && all.every((v) => current?.has(v));
  }

  toggleColumnSelectAll(key: string): void {
    const all = this.getFilteredDistinctValues(key);
    const selectAll = !this.isColumnAllSelected(key);
    this.columnDraftSelections.update((prev) => {
      const current = new Set(prev[key] || []);
      all.forEach((v) => {
        if (selectAll) current.add(v);
        else current.delete(v);
      });
      return { ...prev, [key]: current };
    });
  }

  applyColumnFilter(key: string): void {
    const draft = this.columnDraftSelections()[key];
    const total = this.getColumnDistinctValues(key);
    this.appliedColumnFilters.update((prev) => {
      const next = { ...prev };
      if (!draft || draft.size >= total.length) {
        delete next[key];
      } else {
        next[key] = new Set(draft);
      }
      return next;
    });
    this.closeColumnMenu();
    this.page.set(1);
  }

  clearColumnFilter(key: string): void {
    this.appliedColumnFilters.update((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    this.columnDraftSelections.update((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    this.closeColumnMenu();
    this.page.set(1);
  }

  isColumnFilterActive(key: string): boolean {
    return !!this.appliedColumnFilters()[key];
  }

  sortColumnDirect(key: ListSortKey, dir: 'asc' | 'desc'): void {
    this.sortKey.set(key);
    this.sortDir.set(dir);
    this.closeColumnMenu();
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  goToPage(target: number | string): void {
    const n = Math.floor(Number(target));
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(Math.max(1, n), this.totalPages());
    this.page.set(clamped);
    this.pageInputValue.set(String(clamped));
  }

  toggleRowSelection(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  togglePageSelection(): void {
    const rows = this.pagedCountries();
    const selectAll = !this.isPageAllSelected();
    this.selectedIds.update((set) => {
      const next = new Set(set);
      rows.forEach((c) => (selectAll ? next.add(c.id) : next.delete(c.id)));
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  bulkDelete(): void {
    const ids = [...this.selectedIds()];
    let count = 0;
    for (const id of ids) {
      const c = this.countryService.getCountryById(id);
      if (c && c.status !== 'Deleted' && this.countryService.deleteCountry(id)) count++;
    }
    this.clearSelection();
    this.showToast(count ? `${count} ${count === 1 ? 'country' : 'countries'} moved to Deleted.` : 'Selected countries are already deleted.');
  }

  openBulkUpdateModal(): void {
    if (this.selectedIds().size === 0 && !this.hasPendingChanges()) {
      this.showToast('Please select at least one country to update.');
      return;
    }
    this.bulkUpdateStatusValue = '';
    this.bulkUpdateCurrencyValue = '';
    this.isBulkUpdateModalOpen.set(true);
  }

  closeBulkUpdateModal(): void {
    this.isBulkUpdateModalOpen.set(false);
  }

  applyBulkUpdate(): void {
    const ids = [...this.selectedIds()];
    let updatedCount = 0;
    for (const id of ids) {
      const c = this.countryService.getCountryById(id);
      if (c) {
        const patch: Partial<Country> = {};
        if (this.bulkUpdateStatusValue) {
          patch.status = this.bulkUpdateStatusValue as any;
        }
        if (this.bulkUpdateCurrencyValue) {
          patch.currency = this.bulkUpdateCurrencyValue;
        }
        if (Object.keys(patch).length > 0) {
          this.countryService.updateCountry(id, patch);
          updatedCount++;
        }
      }
    }
    const editId = this.editingCountryId();
    if (editId) {
      const newName = this.editingCountryName().trim();
      if (newName) {
        this.countryService.updateCountry(editId, { name: newName });
        updatedCount++;
      }
      this.editingCountryId.set(null);
    }
    this.isBulkUpdateModalOpen.set(false);
    this.clearSelection();
    this.hasPendingChanges.set(false);
    this.showToast(updatedCount ? `Updated ${updatedCount} ${updatedCount === 1 ? 'country' : 'countries'} successfully.` : 'No changes were applied.');
  }

  isCellEditing(id: string, field: string): boolean {
    const cur = this.editingCell();
    return cur !== null && cur.id === id && cur.field === field;
  }

  startCellEdit(c: Country, field: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.editingCell.set({ id: c.id, field });
    const val = (c as any)[field];
    this.editingCellValue.set(val !== undefined && val !== null ? String(val) : '');
    this.hasPendingChanges.set(true);
    setTimeout(() => {
      const cellEl = document.getElementById(`cell-${this.selectedCell()?.row ?? 0}-${field}`);
      const inputEl = cellEl?.querySelector<HTMLInputElement>('input');
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 20);
  }

  saveCellEdit(c: Country, field: string, event?: Event): void {
    if (event) event.stopPropagation();
    const cur = this.editingCell();
    if (!cur || cur.id !== c.id || cur.field !== field) return;

    const rawVal = this.editingCellValue().trim();
    let parsedVal: any = rawVal;
    if (field === 'states' || field === 'cities' || field === 'areas') {
      parsedVal = rawVal ? parseInt(rawVal, 10) || 0 : 0;
    } else if (field === 'code' || field === 'currency') {
      parsedVal = rawVal.toUpperCase();
    }

    if ((c as any)[field] !== parsedVal) {
      this.countryService.updateCountry(c.id, { [field]: parsedVal } as any);
      this.showToast(`Updated ${field} to ${parsedVal}`);
    }
    this.editingCell.set(null);
    this.hasPendingChanges.set(false);
  }

  cancelCellEdit(event?: Event): void {
    if (event) event.stopPropagation();
    this.editingCell.set(null);
    this.hasPendingChanges.set(false);
  }

  startInlineEdit(c: Country, event?: Event): void {
    this.startCellEdit(c, 'name', event);
  }

  saveInlineEdit(c: Country, event?: Event): void {
    this.saveCellEdit(c, 'name', event);
  }

  cancelInlineEdit(event?: Event): void {
    this.cancelCellEdit(event);
  }

  // Keyboard arrow keys navigation (Up, Down, Left, Right)
  selectedCell = signal<{ row: number; colKey: string } | null>(null);

  isCellFocused(row: number, colKey: string): boolean {
    const sc = this.selectedCell();
    return sc !== null && sc.row === row && sc.colKey === colKey;
  }

  selectCell(row: number, colKey: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedCell.set({ row, colKey });
  }

  onCellClick(c: Country, row: number, colKey: string, event: Event): void {
    if (event) event.stopPropagation();
    this.selectCell(row, colKey);
  }

  onCellDblClick(c: Country, row: number, colKey: string, event: Event): void {
    if (event) event.stopPropagation();
    this.selectCell(row, colKey);
    if (['name', 'code', 'isd', 'currency', 'states', 'cities', 'areas'].includes(colKey)) {
      this.startCellEdit(c, colKey, event);
    }
  }

  getColumnValueCount(key: string, value: string): number {
    const list = this.countryService.countries();
    return list.filter((c: Country) => {
      const v = (c as any)[key];
      return String(v !== undefined && v !== null ? v : '') === value;
    }).length;
  }

  getFilterValueCount(key: FilterFieldKey, value: string): number {
    const list = this.countryService.countries();
    return list.filter((c: Country) => {
      const v = (c as any)[key];
      return String(v !== undefined && v !== null ? v : '') === value;
    }).length;
  }

  onTableKeyDown(event: KeyboardEvent): void {
    const paged = this.pagedCountries();
    if (paged.length === 0) return;
    const cols = this.visibleColumns().map((c) => c.key);
    if (cols.length === 0) return;

    if (this.editingCell()) {
      if (event.key === 'Escape') {
        this.cancelCellEdit(event);
      }
      return;
    }

    const current = this.selectedCell() ?? { row: 0, colKey: cols[0] };
    let curRow = current.row;
    let curColIdx = cols.indexOf(current.colKey as any);
    if (curColIdx === -1) curColIdx = 0;

    let handled = false;

    switch (event.key) {
      case 'ArrowDown':
        if (curRow < paged.length - 1) {
          curRow++;
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (curRow > 0) {
          curRow--;
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (curColIdx < cols.length - 1) {
          curColIdx++;
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (curColIdx > 0) {
          curColIdx--;
          handled = true;
        }
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          if (curColIdx > 0) {
            curColIdx--;
          } else if (curRow > 0) {
            curRow--;
            curColIdx = cols.length - 1;
          }
        } else {
          if (curColIdx < cols.length - 1) {
            curColIdx++;
          } else if (curRow < paged.length - 1) {
            curRow++;
            curColIdx = 0;
          }
        }
        handled = true;
        break;
      case 'Enter': {
        const country = paged[curRow];
        const colKey = cols[curColIdx];
        if (country && ['name', 'code', 'isd', 'currency', 'states', 'cities', 'areas'].includes(colKey)) {
          this.startCellEdit(country, colKey, event);
          handled = true;
        }
        break;
      }
    }

    if (handled) {
      event.preventDefault();
      const newColKey = cols[curColIdx];
      this.selectedCell.set({ row: curRow, colKey: newColKey });
      setTimeout(() => {
        const cellEl = document.getElementById(`cell-${curRow}-${newColKey}`);
        if (cellEl) {
          cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }, 0);
    }
  }

  toggleColumn(key: ListSortKey): void {
    this.hiddenColumns.update((set) => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  setAllColumnsVisible(visible: boolean): void {
    this.hiddenColumns.set(visible ? new Set() : new Set(this.listColumns.map((c) => c.key)));
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  }

  // Navigation handlers
  switchView(mode: CountryViewMode): void {
    if (mode === 'add') {
      this.clearForm();
    } else if (mode === 'edit' || mode === 'view') {
      // Tabs switch between edit/view of the same record: reload saved values
      const c = this.selectedCountry();
      if (c) this.loadCountryIntoForm(c);
    }
    this.selectedCell.set(null);
    this.editingCell.set(null);
    this.isTranslationOpen.set(false);
    this.isActionListOpen.set(false);
    this.isVisibilityOpen.set(false);
    this.viewMode.set(mode);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        mode: mode === 'grid' ? null : mode,
        id: (mode === 'edit' || mode === 'view') ? this.currentCountryId() : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  setFilterTab(tab: string): void {
    this.activeFilterTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tab: tab === 'all' ? null : tab,
      },
      queryParamsHandling: 'merge',
    });
  }

  openCreate(): void {
    this.switchView('add');
  }

  openView(country: Country): void {
    this.currentCountryId.set(country.id);
    this.loadCountryIntoForm(country);
    this.viewMode.set('view');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'view', id: country.id },
      queryParamsHandling: 'merge',
    });
  }

  openEdit(country: Country, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.currentCountryId.set(country.id);
    this.loadCountryIntoForm(country);
    this.viewMode.set('edit');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'edit', id: country.id },
      queryParamsHandling: 'merge',
    });
  }

  toggleCountryStatus(country: Country, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const newStatus: FormStatus = country.status === 'Active' ? 'Inactive' : 'Active';
    this.countryService.updateCountry(country.id, { status: newStatus });
    this.showToast(`Status changed to ${newStatus} for ${country.name}`);
  }

  loadCountryIntoForm(country: Country): void {
    this.formCode.set(country.code);
    this.formIsd.set(country.isd);
    this.formName.set(country.name);
    this.formCurrency.set(country.currency);
    this.formDefault.set(country.isDefault ? 'Yes' : 'No');
    this.formStatus.set(country.status === 'Deleted' ? 'Delete' : country.status);
    this.formFlag.set(country.flag || `https://flagcdn.com/${country.code.toLowerCase()}.svg`);
    this.formContinent.set(country.continent || '');
    this.formTranslations.set({ ...(country.translations || {}) });
  }

  // Empty form for Create, and the target of the Reset confirmation
  clearForm(): void {
    this.formCode.set('');
    this.formIsd.set('');
    this.formName.set('');
    this.formCurrency.set('');
    this.formDefault.set('No');
    this.formStatus.set('Active');
    this.formFlag.set(null);
    this.formContinent.set('');
    this.formTranslations.set({});
    this.flagTab.set('drop');
    this.isTranslationOpen.set(false);
    this.isActionListOpen.set(false);
  }

  // ---- Minimize Add/Edit/View to the tab bar ----
  minimizeForm(): void {
    const mode = this.viewMode();
    if (mode !== 'add' && mode !== 'edit' && mode !== 'view') return;
    const countryId = mode === 'edit' || mode === 'view' ? this.currentCountryId() : null;
    const name = this.formName().trim() || this.selectedCountry()?.name || '';
    const title =
      mode === 'add'
        ? 'Adding Country'
        : mode === 'edit'
        ? `Edit Country${name ? ' · ' + name : ''}`
        : `Viewing Country${name ? ' · ' + name : ''}`;
    this.countryService.saveMinimizedForm({
      id: mode === 'add' ? 'add' : `${mode}-${countryId}`,
      mode,
      countryId,
      title,
      state: {
        code: this.formCode(),
        isd: this.formIsd(),
        name: this.formName(),
        currency: this.formCurrency(),
        isDefault: this.formDefault(),
        status: this.formStatus(),
        flag: this.formFlag(),
        continent: this.formContinent(),
        translations: { ...this.formTranslations() },
        flagTab: this.flagTab(),
        keepOnPage: this.keepOnPage(),
        pdfOnSubmit: this.pdfOnSubmit(),
        printOnSubmit: this.printOnSubmit(),
      },
    });
    this.switchView('grid');
    this.showToast(
      mode === 'add'
        ? 'Adding Country minimized'
        : mode === 'edit'
        ? 'Edit Country minimized'
        : 'Viewing Country minimized'
    );
  }

  // Reopen a minimized form exactly as it was left
  restoreMinimized(form: MinimizedCountryForm): void {
    if (
      (form.mode === 'edit' || form.mode === 'view') &&
      (!form.countryId || !this.countryService.getCountryById(form.countryId))
    ) {
      this.countryService.removeMinimizedForm(form.id);
      this.showToast('This country no longer exists.');
      return;
    }
    // Switching from another open form: park it first so its input isn't lost
    const mode = this.viewMode();
    if (mode === 'add' || mode === 'edit' || mode === 'view') {
      const openId = mode === 'add' ? 'add' : `${mode}-${this.currentCountryId()}`;
      if (openId !== form.id) this.minimizeForm();
    }
    const s = form.state;
    this.closePopovers();
    this.currentCountryId.set(form.countryId);
    this.formCode.set(s.code);
    this.formIsd.set(s.isd);
    this.formName.set(s.name);
    this.formCurrency.set(s.currency);
    this.formDefault.set(s.isDefault);
    this.formStatus.set(s.status);
    this.formFlag.set(s.flag);
    this.formContinent.set(s.continent);
    this.formTranslations.set({ ...s.translations });
    this.flagTab.set(s.flagTab);
    this.keepOnPage.set(s.keepOnPage);
    this.pdfOnSubmit.set(s.pdfOnSubmit);
    this.printOnSubmit.set(s.printOnSubmit);
    this.isExportPanelOpen.set(false);
    this.isFilterPanelOpen.set(false);
    // Set the mode directly: switchView would reload saved data over the snapshot
    this.viewMode.set(form.mode);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: form.mode, id: form.countryId || null },
      queryParamsHandling: 'merge',
    });
    this.countryService.removeMinimizedForm(form.id);
  }

  exportPdfDirect(): void {
    const c = this.selectedCountry();
    if (c) this.downloadCountryPdf(c);
  }

  exportPrintDirect(): void {
    const c = this.selectedCountry();
    if (c) this.printCountry(c);
  }

  discardMinimized(form: MinimizedCountryForm, event: MouseEvent): void {
    event.stopPropagation();
    this.countryService.removeMinimizedForm(form.id);
  }

  // Code picked from the suggestion list: fill the remaining blanks from the preset
  onCodeChange(value: string): void {
    const code = value.trim().toUpperCase();
    this.formCode.set(code);
    const preset = this.countryPresets.find((p) => p.code === code);
    if (!preset) return;
    if (!this.formName().trim()) this.formName.set(preset.name);
    if (!this.formIsd().trim()) this.formIsd.set(preset.isd);
    if (!this.formCurrency().trim()) this.formCurrency.set(preset.currency);
    if (!this.formContinent().trim()) this.formContinent.set(preset.continent);
    if (!this.formFlag()) this.formFlag.set(`https://flagcdn.com/${code.toLowerCase()}.svg`);
  }

  // Enter moves through the form: Code -> ISD -> Country -> Default -> Status
  focusField(id: string, event?: Event): void {
    event?.preventDefault();
    document.getElementById(id)?.focus();
  }

  // ---- Name translations ----
  toggleTranslations(): void {
    if (this.isTranslationOpen()) {
      this.isTranslationOpen.set(false);
      return;
    }
    this.translationDraft.set({ ...this.formTranslations() });
    this.isTranslationOpen.set(true);
    setTimeout(() => this.focusField(`translation-${this.translationLanguages[0].code}`));
  }

  setTranslationDraft(lang: string, value: string): void {
    this.translationDraft.update((d) => ({ ...d, [lang]: value }));
  }

  onTranslationEnter(index: number, event: Event): void {
    event.preventDefault();
    const next = this.translationLanguages[index + 1];
    if (next) {
      this.focusField(`translation-${next.code}`);
    } else {
      this.saveTranslations();
    }
  }

  saveTranslations(): void {
    const cleaned: Record<string, string> = {};
    for (const [lang, value] of Object.entries(this.translationDraft())) {
      if (value.trim()) cleaned[lang] = value.trim();
    }
    this.formTranslations.set(cleaned);
    this.isTranslationOpen.set(false);
    setTimeout(() => this.focusField('country-default'));
  }

  translationLabel(code: string): string {
    return this.translationLanguages.find((l) => l.code === code)?.label ?? code;
  }

  latestAction = computed(() => this.countryActions()[0] ?? null);

  // Speech-to-Text for any input field
  toggleVoiceInput(fieldName: string): void {
    if (this.activeListeningField() === fieldName) {
      this.stopVoiceInput();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.speechRecognitionObj = new SpeechRecognition();
        this.speechRecognitionObj.continuous = false;
        this.speechRecognitionObj.interimResults = false;
        this.speechRecognitionObj.lang = 'en-US';

        this.speechRecognitionObj.onstart = () => {
          this.activeListeningField.set(fieldName);
        };

        this.speechRecognitionObj.onresult = (e: any) => {
          const text = e.results[0][0].transcript;
          this.applySpokenText(fieldName, text);
          this.activeListeningField.set(null);
        };

        this.speechRecognitionObj.onerror = () => {
          this.simulateVoiceForField(fieldName);
        };

        this.speechRecognitionObj.onend = () => {
          this.activeListeningField.set(null);
        };

        this.speechRecognitionObj.start();
      } catch {
        this.simulateVoiceForField(fieldName);
      }
    } else {
      this.simulateVoiceForField(fieldName);
    }
  }

  private simulateVoiceForField(fieldName: string): void {
    this.activeListeningField.set(fieldName);
    setTimeout(() => {
      let sample = 'United Arab Emirates';
      if (fieldName === 'code') sample = 'AE';
      if (fieldName === 'isd') sample = '+971';
      if (fieldName === 'currency') sample = 'AED';
      if (fieldName === 'search') sample = 'Germany';

      this.applySpokenText(fieldName, sample);
      this.activeListeningField.set(null);
    }, 1100);
  }

  private applySpokenText(fieldName: string, text: string): void {
    const clean = text.trim();
    if (fieldName === 'search') {
      this.searchQuery.set(clean);
    } else if (fieldName === 'code') {
      const codeUpper = clean.slice(0, 3).toUpperCase();
      this.formCode.set(codeUpper);
    } else if (fieldName === 'isd') {
      const isdClean = clean.startsWith('+') ? clean : '+' + clean.replace(/\D/g, '');
      this.formIsd.set(isdClean);
    } else if (fieldName === 'name') {
      this.formName.set(clean);
    } else if (fieldName === 'currency') {
      this.formCurrency.set(clean.toUpperCase());
    }
  }

  stopVoiceInput(): void {
    if (this.speechRecognitionObj) {
      try {
        this.speechRecognitionObj.stop();
      } catch {}
      this.speechRecognitionObj = null;
    }
    this.activeListeningField.set(null);
  }

  // Voice search toggle
  toggleSearchVoice(): void {
    this.toggleVoiceInput('search');
  }

  // Flag operations
  selectGalleryFlag(flag: GalleryFlag): void {
    this.formFlag.set(flag.flagUrl);
    this.showToast(`Selected flag of ${flag.name}`);
  }

  removeFlag(): void {
    this.formFlag.set(null);
  }

  triggerFlagUpload(): void {
    this.flagFileInput?.nativeElement.click();
  }

  onFlagFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.showToast('Please choose an image file for the flag.');
      } else {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.formFlag.set(e.target.result);
          this.showToast(`Uploaded flag: ${file.name}`);
        };
        reader.readAsDataURL(file);
      }
    }
    input.value = '';
  }

  onFlagDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFlag.set(true);
  }

  onFlagDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFlag.set(false);
  }

  onFlagDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFlag.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        this.showToast('Please drop an image file for the flag.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formFlag.set(e.target.result);
        this.showToast(`Dropped flag: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  }

  // Form submission (Create & Edit)
  onSubmitForm(): void {
    const name = this.formName().trim();
    const code = this.formCode().trim().toUpperCase();
    const isd = this.formIsd().trim();

    if (!code) {
      this.showToast('Please specify a country code');
      this.focusField('country-code');
      return;
    }
    if (!isd) {
      this.showToast('Please enter the ISD code');
      this.focusField('country-isd');
      return;
    }
    if (!name) {
      this.showToast('Please enter a country name');
      this.focusField('country-name');
      return;
    }

    const status = this.formStatus();
    const translations = this.formTranslations();
    const payload: Partial<Country> = {
      name,
      code,
      isd: isd.startsWith('+') ? isd : `+${isd}`,
      currency: this.formCurrency().trim().toUpperCase(),
      isDefault: this.formDefault() === 'Yes',
      // "Delete" is applied through the soft-delete flow below so it is logged and restorable
      ...(status === 'Delete' ? {} : { status }),
      flag: this.formFlag() || `https://flagcdn.com/${code.toLowerCase()}.svg`,
      continent: this.formContinent(),
      translations: Object.keys(translations).length ? translations : undefined,
    };

    let saved: Country | null = null;
    if (this.viewMode() === 'add') {
      saved = this.countryService.createCountry(payload);
      this.showToast(`Country "${saved.name}" created successfully!`);
    } else if (this.viewMode() === 'edit' && this.currentCountryId()) {
      const id = this.currentCountryId()!;
      saved = this.countryService.updateCountry(id, payload);
      if (saved && status === 'Delete' && saved.status !== 'Deleted') {
        this.countryService.deleteCountry(id);
        saved = this.countryService.getCountryById(id) ?? saved;
      }
      this.showToast(`Country "${saved?.name}" updated successfully!`);
    }
    if (!saved) return;

    if (this.pdfOnSubmit()) this.downloadCountryPdf(saved);
    if (this.printOnSubmit()) this.printCountry(saved);

    if (!this.keepOnPage()) {
      this.viewMode.set('grid');
    } else if (this.viewMode() === 'add') {
      // Keep on: stay and start the next entry
      this.clearForm();
      setTimeout(() => this.focusField('country-code'));
    } else {
      // Keep on while editing: stay on this record with the saved values
      this.loadCountryIntoForm(saved);
    }
  }

  // Reset asks for confirmation first
  resetForm(): void {
    this.isResetModalOpen.set(true);
  }

  confirmResetForm(): void {
    this.isResetModalOpen.set(false);
    this.clearForm();
    setTimeout(() => this.focusField('country-code'), 100);
  }

  // ---- Single-record PDF / Print ----
  private countryRecordRows(c: Country): [string, string][] {
    return [
      ['Code', c.code],
      ['ISD', c.isd],
      ['Country Name', c.name],
      ['Currency', c.currency || '—'],
      ['Default', c.isDefault ? 'Yes' : 'No'],
      ['Status', c.status],
      ['Created At', this.formatDate(c.createdAt)],
      ['Updated At', this.formatDate(c.updatedAt)],
      ['Drafted At', this.formatDate(c.draftedAt)],
      ['Deleted At', this.formatDate(c.deletedAt)],
    ];
  }

  downloadCountryPdf(c: Country): void {
    const blob = buildSimplePdf('Country Details', 'Country Information', this.countryRecordRows(c));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `country-${c.code.toLowerCase()}-details.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    this.countryService.addHistory(c.id, c.name, `Exported "${c.name}" as PDF`, c.status, 'PDF');
  }

  printCountry(c: Country): void {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const rows = [
      ...this.countryRecordRows(c),
      ...Object.entries(c.translations || {}).map(([lang, v]) => [`Name (${this.translationLabel(lang)})`, v] as [string, string]),
    ]
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Country Details</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}h1{color:#00a6f4;margin:0 0 4px}
      p{color:#64748b;margin:0 0 20px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-size:13px}th{background:#f8fafc;width:35%}</style>
      </head><body><h1>Country Details</h1><p>Country Information</p><table>${rows}</table></body></html>`;

    printHtml(html);
    this.countryService.addHistory(c.id, c.name, `Printed "${c.name}"`, c.status, 'Print');
  }

  // View page footer: Export runs whichever of PDF / Print is switched on
  exportViewedCountry(): void {
    const c = this.selectedCountry();
    if (!c) return;
    if (!this.viewPdf() && !this.viewPrint()) {
      this.isExportPromptOpen.set(true);
      return;
    }
    if (this.viewPdf()) this.downloadCountryPdf(c);
    if (this.viewPrint()) this.printCountry(c);
  }

  // Deletion flow with confirmation modal
  promptDelete(country: Country, event?: MouseEvent | Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.selectedCountryForDelete.set(country);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const target = this.selectedCountryForDelete();
    if (target) {
      this.countryService.deleteCountry(target.id);
      this.showToast(`Country "${target.name}" moved to Deleted.`);
      // Deleted from its own edit page: leave the form, nothing left to edit
      if (this.viewMode() === 'edit' && this.currentCountryId() === target.id) {
        this.viewMode.set('grid');
      }
    }
    this.isDeleteModalOpen.set(false);
    this.selectedCountryForDelete.set(null);
  }

  restoreCountry(country: Country, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.countryService.restoreCountry(country.id);
    this.showToast(`Country "${country.name}" restored to Active.`);
  }

  // Empty-state "Reset All Filters": clears search, counter tab and panel filters
  resetFilters(): void {
    this.appliedFilter.set(null);
    this.filterDraft.set(null);
    this.searchQuery.set('');
    this.activeFilterTab.set('all');
    this.showToast('All filters have been reset.');
  }

  // ---- Export side panel ----
  toggleExportPanel(): void {
    // Export and Filter share the right-hand slot
    if (!this.isExportPanelOpen()) this.isFilterPanelOpen.set(false);
    this.isExportPanelOpen.update((v) => !v);
  }

  // Search matches a field's label or any of its values in the current result set
  visibleExportFields = computed<ExportField[]>(() => {
    const q = this.exportSearch().trim().toLowerCase();
    if (!q) return this.exportFieldDefs;
    const rows = this.filteredCountries();
    return this.exportFieldDefs.filter(
      (f) => f.label.toLowerCase().includes(q) || rows.some((c) => this.exportValue(c, f.key).toLowerCase().includes(q))
    );
  });

  isAllExportFieldsSelected = computed(() => {
    const visible = this.visibleExportFields();
    return visible.length > 0 && visible.every((f) => this.exportFields().has(f.key));
  });

  toggleExportField(key: ExportFieldKey): void {
    this.exportFields.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  setAllExportFields(checked: boolean): void {
    this.exportFields.set(checked ? new Set(this.visibleExportFields().map((f) => f.key)) : new Set());
  }

  private exportValue(c: Country, key: ExportFieldKey): string {
    if (key === 'isDefault') return c.isDefault ? 'Yes' : 'No';
    if (key === 'createdAt' || key === 'updatedAt' || key === 'draftedAt') return this.formatDate(c[key]);
    const v = c[key];
    return v === undefined || v === null || v === '' ? '—' : String(v);
  }

  // Selected fields in panel order; Docs and share attachments fall back to every field
  private exportTable(useAllIfEmpty = false): { headers: string[]; rows: string[][] } | null {
    let fields = this.exportFieldDefs.filter((f) => this.exportFields().has(f.key));
    if (!fields.length) {
      if (!useAllIfEmpty) return null;
      fields = this.exportFieldDefs;
    }
    return {
      headers: fields.map((f) => f.label),
      rows: this.filteredCountries().map((c) => fields.map((f) => this.exportValue(c, f.key))),
    };
  }

  runExport(id: ExportButtonId): void {
    if (id === 'whatsapp' || id === 'email') {
      this.openShare(id);
      return;
    }
    const table = this.exportTable(id === 'docs');
    if (!table) {
      const what = { excel: 'Excel', pdf: 'PDF', csv: 'CSV', print: 'print', docs: 'Docs' }[id];
      this.showToast(id === 'print' ? 'Please select at least one column to print' : `Please select at least one column to export to ${what}`);
      return;
    }
    if (id === 'print') {
      printHtml(buildTableHtml('Countries', table.headers, table.rows));
    } else {
      this.downloadExportFile(id, table);
      this.showToast(`${table.rows.length} countries exported to ${id === 'docs' ? 'Docs' : id.toUpperCase()}`);
    }
    const format = ({ excel: 'XLS', pdf: 'PDF', csv: 'CSV', print: 'Print', docs: 'DOC' } as const)[id];
    this.countryService.addHistory('export', 'All Countries', `Exported ${table.rows.length} records as ${format}`, 'Active', format);
  }

  private downloadExportFile(kind: 'excel' | 'pdf' | 'csv' | 'docs', table: { headers: string[]; rows: string[][] }): void {
    let blob: Blob;
    let name: string;
    if (kind === 'excel') {
      blob = buildExcelXml('Countries', table.headers, table.rows);
      name = 'countries-export.xls';
    } else if (kind === 'pdf') {
      blob = buildTablePdf('Countries Data Export', table.headers, table.rows);
      name = 'countries-export.pdf';
    } else if (kind === 'csv') {
      const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
      const csv = [table.headers, ...table.rows].map((r) => r.map(esc).join(',')).join('\r\n');
      // BOM so Excel opens UTF-8 (translations, symbols) correctly
      blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      name = 'countries-export.csv';
    } else {
      blob = new Blob([buildTableHtml('Countries Data Export', table.headers, table.rows, true)], { type: 'application/msword' });
      name = 'countries-export.doc';
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ---- Share via WhatsApp / Email ----
  openShare(channel: 'whatsapp' | 'email'): void {
    this.resetShareForm();
    this.shareChannel.set(channel);
  }

  closeShare(): void {
    this.shareChannel.set(null);
  }

  resetShareForm(): void {
    const count = this.filteredCountries().length;
    this.shareContacts.set(new Set());
    this.emailTo.set('');
    this.emailCc.set('');
    this.emailBcc.set('');
    this.emailSubject.set('Countries export');
    this.shareBody.set(`Please find the countries export attached (${count} ${count === 1 ? 'record' : 'records'}).`);
    this.shareAttachments.set(new Set(['pdf']));
  }

  toggleShareContact(phone: string): void {
    this.shareContacts.update((set) => {
      const next = new Set(set);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }

  toggleShareAttachment(id: 'pdf' | 'excel' | 'csv' | 'docs'): void {
    this.shareAttachments.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  sendShare(): void {
    const channel = this.shareChannel();
    if (!channel) return;
    const body = this.shareBody().trim();

    let target: string;
    if (channel === 'whatsapp') {
      const phones = [...this.shareContacts()];
      if (!phones.length) {
        this.showToast('Please choose at least one recipient');
        return;
      }
      // One recipient opens that chat directly; several let WhatsApp ask which chats to send to
      const phone = phones.length === 1 ? phones[0].replace(/\D/g, '') : '';
      target = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
    } else {
      const to = this.emailTo().trim();
      if (!to) {
        this.showToast('Please enter at least one email recipient');
        return;
      }
      const params = new URLSearchParams();
      if (this.emailCc().trim()) params.set('cc', this.emailCc().trim());
      if (this.emailBcc().trim()) params.set('bcc', this.emailBcc().trim());
      if (this.emailSubject().trim()) params.set('subject', this.emailSubject().trim());
      if (body) params.set('body', body);
      // URLSearchParams encodes spaces as "+", which mail clients show literally
      target = `mailto:${encodeURIComponent(to).replace(/%2C/gi, ',')}?${params.toString().replace(/\+/g, '%20')}`;
    }

    // Browsers can't attach files to WhatsApp/mailto links, so download them for the user to attach
    const table = this.exportTable(true)!;
    for (const kind of this.shareAttachments()) this.downloadExportFile(kind, table);

    if (channel === 'whatsapp') window.open(target, '_blank', 'noopener');
    else window.location.href = target;

    this.countryService.addHistory('export', 'All Countries', `Shared ${table.rows.length} records via ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}`, 'Active', 'None');
    this.showToast(channel === 'whatsapp' ? 'Opening WhatsApp…' : 'Opening your email app…');
    this.closeShare();
  }

  // Import handlers
  triggerImportFile(): void {
    this.importFileInput?.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.loadImportFile(input.files[0]);
    }
    // Allow re-selecting the same file after removing it
    input.value = '';
  }

  onImportDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isImportDragging.set(true);
  }

  onImportDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isImportDragging.set(false);
  }

  onImportDrop(event: DragEvent): void {
    event.preventDefault();
    this.isImportDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.loadImportFile(file);
    }
  }

  private loadImportFile(file: File): void {
    this.importError.set(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.resetImportFile();
      this.importError.set('Only .CSV format is accepted.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rows = this.parseCsv(String(reader.result ?? ''));
      if (rows.length < 2) {
        this.resetImportFile();
        this.importError.set('The file has no data rows. Add a header row followed by at least one country.');
        return;
      }
      const headers = rows[0].map((h) => h.trim());
      this.importFileName.set(file.name);
      this.importHeaders.set(headers);
      this.importRows.set(rows.slice(1));
      this.importRowCount.set(rows.length - 1);
      this.importMapping.set(this.autoMatchFields(headers));
    };
    reader.onerror = () => {
      this.resetImportFile();
      this.importError.set('Could not read the file. Please try again.');
    };
    reader.readAsText(file);
  }

  removeImportFile(): void {
    this.resetImportFile();
    this.importError.set(null);
  }

  private resetImportFile(): void {
    this.importFileName.set(null);
    this.importHeaders.set([]);
    this.importRows.set([]);
    this.importRowCount.set(0);
    this.importMapping.set(this.emptyImportMapping());
  }

  private emptyImportMapping(): Record<ImportFieldKey, number> {
    return { name: -1, code: -1, isd: -1, currency: -1, status: -1, continent: -1 };
  }

  private autoMatchFields(headers: string[]): Record<ImportFieldKey, number> {
    const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
    const mapping = this.emptyImportMapping();
    for (const field of this.importFields) {
      mapping[field.key] = normalized.findIndex((h) => field.aliases.includes(h));
    }
    return mapping;
  }

  setImportMapping(key: ImportFieldKey, columnIndex: number | string): void {
    this.importMapping.update((m) => ({ ...m, [key]: Number(columnIndex) }));
  }

  // RFC 4180-style parser: handles quoted values, escaped quotes and CRLF line endings
  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = '';
    let inQuotes = false;
    const src = text.replace(/^﻿/, '');

    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"' && src[i + 1] === '"') {
          value += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          value += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(value);
        value = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && src[i + 1] === '\n') i++;
        row.push(value);
        rows.push(row);
        row = [];
        value = '';
      } else {
        value += ch;
      }
    }
    row.push(value);
    rows.push(row);

    return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  }

  downloadSampleCsv(): void {
    const csv = [
      'Name,Code,ISD,Currency,Status,Continent',
      'Iceland,IS,+354,ISK,Active,Europe',
      'Luxembourg,LU,+352,EUR,Active,Europe',
      'Monaco,MC,+377,EUR,Inactive,Europe',
      'Cyprus,CY,+357,EUR,Draft,Europe',
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'countries-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  goToImportStep(step: 1 | 2): void {
    if (this.isImporting()) return;
    if (step === 2 && !this.importFileName()) return;
    this.importStep.set(step);
  }

  confirmImport(): void {
    if (this.isImporting() || !this.importFileName() || this.importMissingRequired().length) return;

    const mapping = this.importMapping();
    const cell = (row: string[], key: ImportFieldKey) => (mapping[key] >= 0 ? (row[mapping[key]] ?? '').trim() : '');
    const existingCodes = new Set(this.countryService.countries().map((c) => c.code.toUpperCase()));
    const statuses: Country['status'][] = ['Active', 'Inactive', 'Draft'];

    const newItems: Partial<Country>[] = [];
    let skipped = 0;
    for (const row of this.importRows()) {
      const name = cell(row, 'name');
      const code = cell(row, 'code').toUpperCase();
      // Skip rows missing required values or duplicating an existing / earlier code
      if (!name || !code || existingCodes.has(code)) {
        skipped++;
        continue;
      }
      existingCodes.add(code);
      const rawStatus = cell(row, 'status').toLowerCase();
      const isd = cell(row, 'isd');
      newItems.push({
        name,
        code,
        isd: isd ? (isd.startsWith('+') ? isd : `+${isd}`) : undefined,
        currency: cell(row, 'currency').toUpperCase() || undefined,
        status: statuses.find((s) => s.toLowerCase() === rawStatus) ?? 'Active',
        continent: cell(row, 'continent') || undefined,
      });
    }

    this.importStep.set(3);
    this.isImporting.set(true);
    this.importProgress.set(0);
    this.importResult.set(null);

    const timer = setInterval(() => {
      this.importProgress.update((p) => Math.min(p + 10, 100));
      if (this.importProgress() >= 100) {
        clearInterval(timer);
        const count = newItems.length ? this.countryService.importCountries(newItems) : 0;
        this.isImporting.set(false);
        this.importResult.set({ imported: count, skipped });
        this.showToast(
          count
            ? `Successfully imported ${count} new countries into database!`
            : 'No new countries were imported.'
        );
      }
    }, 120);
  }

  closeImportModal(): void {
    if (this.isImporting()) return;
    this.isImportModalOpen.set(false);
  }

  private resetImportWizard(): void {
    this.resetImportFile();
    this.importStep.set(1);
    this.importError.set(null);
    this.importProgress.set(0);
    this.importResult.set(null);
    this.isImportDragging.set(false);
  }

  // Toast notifier
  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }

  openImportModal(): void {
    this.resetImportWizard();
    this.isImportModalOpen.set(true);
  }

  openHistoryModal(): void {
    this.isHistoryModalOpen.set(true);
  }

  onFlagError(event: Event, country?: Country): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://flagcdn.com/us.svg';
    }
  }

  // Print layout direct
  printPage(): void {
    window.print();
  }
}

// Minimal single-page PDF (Helvetica, WinAnsi) so record export needs no extra dependency.
// Characters outside Latin-1 cannot be drawn by the built-in font and are replaced with "?".
function buildSimplePdf(title: string, subtitle: string, rows: [string, string][]): Blob {
  const clean = (s: string) =>
    s
      .replace(/—/g, '-')
      .replace(/[^\x20-\xFF]/g, '?')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const lines: string[] = [
    'BT /F2 20 Tf 0 0.65 0.96 rg 50 790 Td (' + clean(title) + ') Tj ET',
    'BT /F1 11 Tf 0.4 0.45 0.55 rg 50 770 Td (' + clean(subtitle) + ') Tj ET',
    '0.89 0.91 0.94 RG 50 758 m 545 758 l S',
  ];
  let y = 734;
  for (const [label, value] of rows) {
    lines.push('BT /F2 11 Tf 0.12 0.16 0.23 rg 50 ' + y + ' Td (' + clean(label) + ') Tj ET');
    lines.push('BT /F1 11 Tf 0.12 0.16 0.23 rg 210 ' + y + ' Td (' + clean(value) + ') Tj ET');
    y -= 22;
  }
  const content = lines.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream',
  ];

  // Every char is <= 0xFF, so string length equals byte length for the xref offsets
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += i + 1 + ' 0 obj\n' + obj + '\nendobj\n';
  });
  const xrefStart = pdf.length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  offsets.forEach((o) => (pdf += String(o).padStart(10, '0') + ' 00000 n \n'));
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF';

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i);
  return new Blob([bytes], { type: 'application/pdf' });
}

// Escapes PDF string literals and maps text to what the built-in Latin-1 fonts can draw
function pdfText(s: string): string {
  return s
    .replace(/—/g, '-')
    .replace(/[^\x20-\xFF]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

// Multi-page landscape table PDF, columns sized evenly; long cells are cut with "..."
function buildTablePdf(title: string, headers: string[], rows: string[][]): Blob {
  const pageW = 842;
  const pageH = 595;
  const margin = 36;
  const rowH = 18;
  const fontSize = 9;
  const colW = (pageW - margin * 2) / headers.length;
  // Helvetica averages ~0.5em per char; keep a little padding inside each cell
  const maxChars = Math.max(3, Math.floor((colW - 8) / (fontSize * 0.5)));
  const fit = (s: string) => (s.length > maxChars ? s.slice(0, maxChars - 3) + '...' : s);

  const firstRowY = pageH - margin - 52;
  const rowsPerPage = Math.max(1, Math.floor((firstRowY - margin) / rowH));
  const pages: string[] = [];
  for (let p = 0; p * rowsPerPage < Math.max(rows.length, 1); p++) {
    const slice = rows.slice(p * rowsPerPage, (p + 1) * rowsPerPage);
    const ops: string[] = [];
    if (p === 0) {
      ops.push(`BT /F2 16 Tf 0 0.65 0.96 rg ${margin} ${pageH - margin - 10} Td (${pdfText(title)}) Tj ET`);
      ops.push(`BT /F1 9 Tf 0.4 0.45 0.55 rg ${margin} ${pageH - margin - 26} Td (${pdfText(`${rows.length} records - generated ${new Date().toLocaleDateString()}`)}) Tj ET`);
    }
    // Header band
    const headY = firstRowY + rowH;
    ops.push(`0 0.65 0.96 rg ${margin} ${headY - 5} ${pageW - margin * 2} ${rowH} re f`);
    headers.forEach((h, i) => {
      ops.push(`BT /F2 ${fontSize} Tf 1 1 1 rg ${(margin + i * colW + 4).toFixed(1)} ${headY} Td (${pdfText(fit(h))}) Tj ET`);
    });
    slice.forEach((row, r) => {
      const y = firstRowY - r * rowH;
      if (r % 2 === 1) ops.push(`0.95 0.97 0.99 rg ${margin} ${y - 5} ${pageW - margin * 2} ${rowH} re f`);
      row.forEach((cell, i) => {
        ops.push(`BT /F1 ${fontSize} Tf 0.12 0.16 0.23 rg ${(margin + i * colW + 4).toFixed(1)} ${y} Td (${pdfText(fit(cell))}) Tj ET`);
      });
    });
    ops.push(`BT /F1 8 Tf 0.6 0.64 0.7 rg ${pageW - margin - 50} ${margin - 14} Td (Page ${p + 1}) Tj ET`);
    pages.push(ops.join('\n'));
  }

  // Objects: 1 catalog, 2 pages, 3-4 fonts, then (page, content) pairs
  const objects: string[] = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
  const kids: string[] = [];
  pages.forEach((content) => {
    const pageId = objects.length + 1;
    kids.push(`${pageId} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += String(o).padStart(10, '0') + ' 00000 n \n'));
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i);
  return new Blob([bytes], { type: 'application/pdf' });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Table document used for Print, and (with Word namespaces) for the .doc export
function buildTableHtml(title: string, headers: string[], rows: string[][], forWord = false): string {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
  const ns = forWord
    ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
    : '';
  return `<!doctype html><html${ns}><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>@page{margin:0.6in}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1e293b}
    h1{color:#00a6f4;font-size:18pt;margin:0 0 4pt}p{color:#64748b;margin:0 0 14pt}
    table{border-collapse:collapse;width:100%}th{background:#00a6f4;color:#fff;text-align:left}
    th,td{border:1px solid #bae6fd;padding:5pt 7pt;font-size:10pt}tr:nth-child(even) td{background:#f1f5f9}</style>
    </head><body><h1>${escapeHtml(title)}</h1>
    <p>Generated on ${new Date().toLocaleDateString()} · ${rows.length} records</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

// Excel 2003 XML spreadsheet: opens natively in Excel without a library
function buildExcelXml(sheet: string, headers: string[], rows: string[][]): Blob {
  const cell = (v: string, header = false) => {
    const isNum = !header && v !== '' && /^-?\d+(\.\d+)?$/.test(v);
    return `<Cell${header ? ' ss:StyleID="h"' : ''}><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeHtml(v)}</Data></Cell>`;
  };
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#00A6F4" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="${escapeHtml(sheet)}"><Table>
${headers.map(() => '<Column ss:Width="110"/>').join('')}
<Row>${headers.map((h) => cell(h, true)).join('')}</Row>
${rows.map((r) => `<Row>${r.map((v) => cell(v)).join('')}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`;
  return new Blob([xml], { type: 'application/vnd.ms-excel' });
}

// Print an HTML document from a hidden iframe so only that content prints, not the app
function printHtml(html: string): void {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  }, 100);
}

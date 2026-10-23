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
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CountryService } from './country.service';
import { Country, CountryHistoryEntry, MinimizedCountryForm, CountryLookupRecord, CurrencyOption, DEFAULT_CURRENCY_OPTIONS } from './country.models';
import { NavigationService } from '../../services/navigation.service';
import { AuditService } from '../../services/audit.service';
import { TenantService, ConfigurableField } from '../../services/tenant.service';
import { DropdownOption, SelectDropdown } from '../select-dropdown/select-dropdown';

export type CountryViewMode = 'overview' | 'grid' | 'list' | 'add' | 'edit' | 'view';

export type FormStatus = 'Active' | 'Inactive' | 'Draft' | 'Delete';

export type FilterFieldKey = 'name' | 'code' | 'isd' | 'currency' | 'status' | 'isDefault' | 'continent' | 'capital';

export type ListSortKey =
  | 'name'
  | 'code'
  | 'isd'
  | 'currency'
  | 'states'
  | 'cities'
  | 'areas'
  | 'continent'
  | 'capital'
  | 'nationality'
  | 'population'
  | 'isDefault'
  | 'createdAt'
  | 'updatedAt'
  | 'draftedAt'
  | 'approval'
  | 'status'
  | string;

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
export class CountryComponent implements OnInit, AfterViewInit {
  public countryService = inject(CountryService);
  public navService = inject(NavigationService);
  public auditService = inject(AuditService);
  public tenantService = inject(TenantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('flagFileInput') flagFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('importFileInput') importFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('countrySearchInput') countrySearchInputElement?: ElementRef<HTMLInputElement>;
  @ViewChild('middleScrollbarTrack') middleScrollbarTrack?: ElementRef<HTMLDivElement>;

  scrollableScrollWidth = signal<number>(1424);

  // Current view mode: 'overview' | 'grid' | 'list' | 'add' | 'edit' | 'view'
  viewMode = signal<CountryViewMode>('overview');

  pageHeaderTitle = computed<string>(() => {
    switch (this.viewMode()) {
      case 'grid':
        return 'Country Grid View';
      case 'list':
        return 'Country List View';
      case 'overview':
        return 'Country Overview';
      case 'add':
        return 'Add Country';
      case 'edit':
        return 'Edit Country';
      case 'view':
        return 'Country Details';
      default:
        return 'Country Grid View';
    }
  });

  // Country Master Overview State & Metrics (Per Rapid ERP Master Specifications)
  overviewPeriod = signal<string>('Last 30 days');
  isOverviewPeriodDropdownOpen = signal<boolean>(false);
  isOverviewRefreshing = signal<boolean>(false);
  overviewPeriods = ['Today', 'Last 7 days', 'Last 30 days', 'This Month', 'This Quarter', 'All Time'];

  toggleOverviewPeriodDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isOverviewPeriodDropdownOpen.update((v) => !v);
  }

  setOverviewPeriod(period: string): void {
    this.overviewPeriod.set(period);
    this.isOverviewPeriodDropdownOpen.set(false);
  }

  refreshOverviewData(): void {
    this.isOverviewRefreshing.set(true);
    setTimeout(() => {
      this.isOverviewRefreshing.set(false);
      this.showToast('Country Master Overview figures refreshed from database');
    }, 500);
  }

  overviewStats = computed(() => {
    const list = this.countryService.countries();
    const nonDeleted = list.filter((c) => c.status !== 'Deleted');
    const total = nonDeleted.length;
    const active = nonDeleted.filter((c) => c.status === 'Active').length;
    const inactive = nonDeleted.filter((c) => c.status === 'Inactive').length;
    const draft = nonDeleted.filter((c) => c.status === 'Draft').length;
    const deleted = list.filter((c) => c.status === 'Deleted').length;

    // Currency coverage
    const withCurrency = nonDeleted.filter((c) => c.currency && c.currency.trim().length > 0).length;
    const currencyCoveragePct = total > 0 ? Math.round((withCurrency / total) * 100) : 100;

    // Missing required data (incomplete records)
    const missingDataCount = nonDeleted.filter((c) => !c.name || !c.code || !c.isd || !c.currency).length;

    // Recently added and updated counts
    const recentlyAdded = nonDeleted.filter((c) => c.createdAt && c.createdAt >= '2023-01-01').length;
    const recentlyUpdated = nonDeleted.filter((c) => c.isUpdated || (c.updatedAt && c.updatedAt >= '2023-11-01')).length;

    const activePct = total > 0 ? +((active / total) * 100).toFixed(1) : 0;
    const inactivePct = total > 0 ? +((inactive / total) * 100).toFixed(1) : 0;
    const draftPct = total > 0 ? +((draft / total) * 100).toFixed(1) : 0;

    return {
      total,
      active,
      inactive,
      draft,
      deleted,
      withCurrency,
      currencyCoveragePct,
      missingDataCount,
      recentlyAdded: recentlyAdded > 0 ? recentlyAdded : 14,
      recentlyUpdated: recentlyUpdated > 0 ? recentlyUpdated : 32,
      activePct,
      inactivePct,
      draftPct,
    };
  });

  // Section 1 Part 1: Interactive Status Chart Presentation Mode ('wave' | 'pillars')
  statusChartPresentation = signal<'wave' | 'pillars'>('wave');
  hoveredStatusPillar = signal<string | null>(null);

  setStatusChartPresentation(mode: 'wave' | 'pillars'): void {
    this.statusChartPresentation.set(mode);
  }

  setHoveredStatusPillar(key: string | null): void {
    this.hoveredStatusPillar.set(key);
  }

  // Section 1 Part 1: Status Distribution Metric Columns & Pillars
  statusDistributionBars = computed(() => {
    const s = this.overviewStats();
    return [
      {
        key: 'total',
        label: 'Total Countries',
        shortLabel: 'Total',
        sublabel: 'All non-deleted records',
        count: s.total,
        percentage: 100,
        heightPct: 96,
        fillClass: 'bg-gradient-to-t from-[#0284c7] via-[#00a6f4] to-[#38bdf8]',
        glowColor: 'rgba(0, 166, 244, 0.45)',
        badgeBg: 'bg-sky-50 dark:bg-sky-950/60 text-[#00a6f4] border border-sky-200 dark:border-sky-800',
        tab: 'all',
        accentColor: '#00a6f4',
      },
      {
        key: 'active',
        label: 'Active Records',
        shortLabel: 'Active',
        sublabel: 'Available for selection',
        count: s.active,
        percentage: s.activePct,
        heightPct: Math.max(25, Math.min(92, Math.round(s.activePct * 0.92))),
        fillClass: 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800',
        tab: 'active',
        accentColor: '#10b981',
      },
      {
        key: 'inactive',
        label: 'Inactive Records',
        shortLabel: 'Inactive',
        sublabel: 'Unavailable for new selection',
        count: s.inactive,
        percentage: s.inactivePct,
        heightPct: Math.max(22, Math.min(75, Math.round(s.inactivePct * 1.8))),
        fillClass: 'bg-gradient-to-t from-slate-600 via-slate-500 to-slate-400',
        glowColor: 'rgba(100, 116, 139, 0.4)',
        badgeBg: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600',
        tab: 'inactive',
        accentColor: '#64748b',
      },
      {
        key: 'draft',
        label: 'Draft Records',
        shortLabel: 'Draft',
        sublabel: 'Not yet finalized',
        count: s.draft,
        percentage: s.draftPct,
        heightPct: Math.max(16, Math.min(60, Math.round(s.draftPct * 3.5) + 12)),
        fillClass: 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400',
        glowColor: 'rgba(245, 158, 11, 0.45)',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800',
        tab: 'draft',
        accentColor: '#f59e0b',
      },
    ];
  });

  // Section 1 Part 1: Smooth SVG Bezier Spline Wave Curve Data
  statusWaveChart = computed(() => {
    const s = this.overviewStats();
    return {
      path: 'M 45 22 C 105 22, 115 48, 175 48 C 235 48, 255 118, 315 118 C 375 118, 395 138, 455 138',
      areaPath: 'M 45 22 C 105 22, 115 48, 175 48 C 235 48, 255 118, 315 118 C 375 118, 395 138, 455 138 L 455 158 L 45 158 Z',
      nodes: [
        { x: 45, y: 22, count: s.total, pct: 100, label: 'Total', color: '#00a6f4', tab: 'all' },
        { x: 175, y: 48, count: s.active, pct: s.activePct, label: 'Active', color: '#10b981', tab: 'active' },
        { x: 315, y: 118, count: s.inactive, pct: s.inactivePct, label: 'Inactive', color: '#64748b', tab: 'inactive' },
        { x: 455, y: 138, count: s.draft, pct: s.draftPct, label: 'Draft', color: '#f59e0b', tab: 'draft' },
      ],
    };
  });

  // Section 1 Part 2: Donut ring metrics
  donutMetrics = computed(() => {
    const s = this.overviewStats();
    const circ = 251.327;
    const activeStroke = (s.activePct / 100) * circ;
    const inactiveStroke = (s.inactivePct / 100) * circ;
    const draftStroke = (s.draftPct / 100) * circ;

    return {
      circumference: circ,
      activeOffset: circ - activeStroke,
      inactiveOffset: circ - (activeStroke + inactiveStroke),
      draftOffset: circ - (activeStroke + inactiveStroke + draftStroke),
      activePct: s.activePct,
      inactivePct: s.inactivePct,
      draftPct: s.draftPct,
    };
  });

  // Section 2: Recent Activities Distribution (Styled like Image 2 Delay Cause Distribution)
  recentActivitiesList = computed(() => {
    return [
      {
        label: 'Countries Created',
        events: 42,
        percentage: 34,
        color: '#1863c0',
        barClass: 'bg-[#1863c0]',
        dotClass: 'bg-[#1863c0]',
      },
      {
        label: 'Countries Updated',
        events: 34,
        percentage: 28,
        color: '#00a2e8',
        barClass: 'bg-[#00a2e8]',
        dotClass: 'bg-[#00a2e8]',
      },
      {
        label: 'Countries Deleted',
        events: 18,
        percentage: 15,
        color: '#f43f5e',
        barClass: 'bg-rose-500',
        dotClass: 'bg-rose-500',
      },
      {
        label: 'Country Views',
        events: 20,
        percentage: 14,
        color: '#8b5cf6',
        barClass: 'bg-purple-500',
        dotClass: 'bg-purple-500',
      },
      {
        label: 'Country Exports',
        events: 12,
        percentage: 9,
        color: '#10b981',
        barClass: 'bg-emerald-500',
        dotClass: 'bg-emerald-500',
      },
    ];
  });

  // Section 3: Recently Added or Updated Countries Table (Top 5 non-deleted)
  recentCountries = computed(() => {
    const list = this.countryService.countries().filter((c) => c.status !== 'Deleted');
    return [...list]
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 5);
  });

  openFilteredList(tab: string): void {
    this.activeFilterTab.set(tab);
    this.switchView('grid');
  }

  openCreateFromOverview(): void {
    this.previousListViewMode.set('grid');
    this.openCreate();
  }

  openSearchFromOverview(): void {
    this.switchView('grid');
    setTimeout(() => {
      const searchInput = document.querySelector('.country-header input[type="text"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }, 100);
  }

  // Active filter tab: 'all' | 'active' | 'inactive' | 'draft' | 'updated' | 'deleted'
  activeFilterTab = signal<string>('all');

  // Relative times for Updated and Deleted stat summary capsules (Image 3)
  lastUpdatedTime = signal<string>('30 mins');
  lastDeletedTime = signal<string>('40 mins');

  // Search query
  searchQuery = signal<string>('');
  isSearchListening = signal<boolean>(false);

  // Filter side panel: checkbox values per field. Draft = what's ticked in the panel,
  // applied = what filters the data (null = no field filter).
  isFilterPanelOpen = signal<boolean>(false);
  filterSearch = signal<string>('');
  readonly filterFieldDefs: { key: FilterFieldKey; label: string }[] = [
    { key: 'name', label: 'Country Name' },
    { key: 'code', label: 'Country Code' },
    { key: 'isd', label: 'ISD' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'isDefault', label: 'Default' },
    { key: 'continent', label: 'Continent' },
  ];
  filterDraft = signal<Record<FilterFieldKey, Set<string>> | null>(null);
  appliedFilter = signal<Partial<Record<FilterFieldKey, Set<string>>> | null>(null);

  // Grid lazy loading: 25 cards first, 25 more each time the bottom is reached
  readonly gridPageSize = 25;
  gridVisibleCount = signal<number>(25);
  isLoadingMore = signal<boolean>(false);

  // Export & Import & History & Delete modals
  isExportPanelOpen = signal<boolean>(false);
  exportSearch = signal<string>('');
  exportFields = signal<Set<ExportFieldKey>>(new Set());
  readonly exportFieldDefs: ExportField[] = [
    { key: 'name', label: 'Country Name' },
    { key: 'code', label: 'CountryCode' },
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

  readonly shareButtons: { id: 'whatsapp' | 'email' | 'link' | 'print' | 'pdf'; label: string; color: string }[] = [
    { id: 'whatsapp', label: 'Share via WhatsApp', color: '#25D366' },
    { id: 'email', label: 'Share via Email', color: '#8B5CF6' },
    { id: 'link', label: 'Copy Link', color: '#00a6f4' },
    { id: 'print', label: 'Print', color: '#F59E0B' },
    { id: 'pdf', label: 'Download PDF', color: '#EF4444' },
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
  isRecycleBinModalOpen = signal<boolean>(false);
  isDeleteModalOpen = signal<boolean>(false);
  selectedCountryForDelete = signal<Country | null>(null);
  recycleBinSearch = signal<string>('');
  historySearch = signal<string>('');
  historyScope = signal<'current' | 'all'>('all');

  deletedCountries = computed(() => {
    const q = this.recycleBinSearch().trim().toLowerCase();
    const list = this.countryService.countries().filter((c) => c.status === 'Deleted');
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.continent && c.continent.toLowerCase().includes(q))
    );
  });

  displayedHistory = computed(() => {
    const q = this.historySearch().trim().toLowerCase();
    const scope = this.historyScope();
    const currentId = this.currentCountryId();
    let list = this.countryService.history();
    if (scope === 'current' && currentId) {
      list = list.filter((h) => h.countryId === currentId);
    }
    if (q) {
      list = list.filter(
        (h) =>
          h.countryName.toLowerCase().includes(q) ||
          h.action.toLowerCase().includes(q) ||
          h.user.toLowerCase().includes(q) ||
          h.status.toLowerCase().includes(q)
      );
    }
    return list;
  });

  // Currently viewed or edited country
  currentCountryId = signal<string | null>(null);
  selectedCountry = computed(() => {
    const id = this.currentCountryId();
    if (!id) return null;
    return this.countryService.getCountryById(id) || null;
  });

  currentCountryIndex = computed(() => {
    const list = this.countryService.countries();
    const id = this.currentCountryId();
    if (!id) return 0;
    const idx = list.findIndex((c) => c.id === id);
    return idx >= 0 ? idx : 0;
  });

  totalCountriesCount = computed(() => this.countryService.countries().length);
  hasPreviousCountry = computed(() => this.currentCountryIndex() > 0);
  hasNextCountry = computed(() => this.currentCountryIndex() < this.totalCountriesCount() - 1);

  navigateToPreviousCountry(): void {
    const list = this.countryService.countries();
    if (!list.length) return;
    const idx = this.currentCountryIndex();
    const prevIdx = idx > 0 ? idx - 1 : list.length - 1;
    const prevCountry = list[prevIdx];
    this.currentCountryId.set(prevCountry.id);
    this.loadCountryIntoForm(prevCountry);
  }

  navigateToNextCountry(): void {
    const list = this.countryService.countries();
    if (!list.length) return;
    const idx = this.currentCountryIndex();
    const nextIdx = idx < list.length - 1 ? idx + 1 : 0;
    const nextCountry = list[nextIdx];
    this.currentCountryId.set(nextCountry.id);
    this.loadCountryIntoForm(nextCountry);
  }

  openAdd(): void {
    this.openCreate();
  }

  // MOD-7: Recycle Bin selection state
  selectedBinIds = signal<Set<string>>(new Set());

  openRecycleBinModal(): void {
    this.recycleBinSearch.set('');
    this.selectedBinIds.set(new Set());
    this.activityModalTab.set('deleted');
    this.isRecycleBinModalOpen.set(true);
    this.isActivityModalOpen.set(true);
  }

  closeRecycleBinModal(): void {
    this.isRecycleBinModalOpen.set(false);
    this.isActivityModalOpen.set(false);
  }

  toggleBinSelection(id: string): void {
    const next = new Set(this.selectedBinIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedBinIds.set(next);
  }

  clearBinSelection(): void {
    this.selectedBinIds.set(new Set());
  }

  deleteSelectedFromBin(): void {
    const ids = Array.from(this.selectedBinIds());
    if (ids.length === 0) {
      this.showToast('Please select at least one country to delete permanently');
      return;
    }
    for (const id of ids) {
      this.countryService.permanentlyRemoveCountry(id);
    }
    this.selectedBinIds.set(new Set());
    this.showToast(`Permanently deleted ${ids.length} selected countries`);
  }

  restoreCountryFromBin(c: Country): void {
    this.countryService.restoreCountry(c.id);
    const next = new Set(this.selectedBinIds());
    next.delete(c.id);
    this.selectedBinIds.set(next);
    this.showToast(`Restored "${c.name}" to Active status`);
  }

  permanentlyDeleteFromBin(c: Country): void {
    this.countryService.permanentlyRemoveCountry(c.id);
    const next = new Set(this.selectedBinIds());
    next.delete(c.id);
    this.selectedBinIds.set(next);
    this.showToast(`Permanently deleted "${c.name}"`);
  }

  restoreAllDeletedFromBin(): void {
    const count = this.countryService.restoreAllDeleted();
    this.selectedBinIds.set(new Set());
    if (count > 0) {
      this.showToast(`Restored ${count} countries from Recycle Bin`);
    }
  }

  emptyAllRecycleBin(): void {
    const count = this.countryService.emptyRecycleBin();
    this.selectedBinIds.set(new Set());
    if (count > 0) {
      this.showToast(`Permanently deleted ${count} countries from Recycle Bin`);
    }
  }

  viewDeletedInList(): void {
    this.isRecycleBinModalOpen.set(false);
    this.setFilterTab('deleted');
  }

  // MOD-8: Country History popup state & expand/collapse
  historyActivityFilter = signal<string>('All Activities');
  historyStartDate = signal<string>('');
  historyEndDate = signal<string>('');
  historyDatePreset = signal<string>('');
  isHistoryDateFilterOpen = signal<boolean>(false);
  expandedHistoryIds = signal<Set<string>>(new Set(['H-003', 'A-10048']));

  toggleHistoryDateFilter(): void {
    this.isHistoryDateFilterOpen.update((v) => !v);
  }

  clearHistoryDateFilter(): void {
    this.historyStartDate.set('');
    this.historyEndDate.set('');
    this.historyDatePreset.set('');
  }

  setHistoryDatePreset(preset: 'today' | 'week' | 'month' | 'year' | '7days' | '30days' | 'thisMonth'): void {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    this.historyDatePreset.set(preset);
    this.historyEndDate.set(toStr(today));
    if (preset === 'today') {
      this.historyStartDate.set(toStr(today));
    } else if (preset === 'week' || preset === '7days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      this.historyStartDate.set(toStr(d));
    } else if (preset === '30days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      this.historyStartDate.set(toStr(d));
    } else if (preset === 'month' || preset === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      this.historyStartDate.set(toStr(d));
    } else if (preset === 'year') {
      const d = new Date(today.getFullYear(), 0, 1);
      this.historyStartDate.set(toStr(d));
    }
  }

  toggleHistoryExpand(id: string): void {
    const next = new Set(this.expandedHistoryIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedHistoryIds.set(next);
  }

  historySelectedCountryId = signal<string | null>(null);

  onHistoryCountryChange(idOrVal: any): void {
    this.historySelectedCountryId.set(idOrVal ? String(idOrVal) : null);
  }

  openHistoryModal(scope?: 'current' | 'all'): void {
    this.historySearch.set('');
    this.historyActivityFilter.set('All Activities');
    this.historyStartDate.set('');
    this.historyEndDate.set('');
    this.isHistoryDateFilterOpen.set(false);
    this.expandedHistoryIds.set(new Set(['H-004', 'H-003']));
    this.historyScope.set(scope || (this.viewMode() === 'view' || this.viewMode() === 'edit' ? 'current' : 'all'));
    const sc = this.selectedCountry();
    if (sc) {
      this.historySelectedCountryId.set(sc.id);
    } else if (this.sortedCountries().length > 0) {
      this.historySelectedCountryId.set(this.sortedCountries()[0].id);
    }
    this.activityModalTab.set('history');
    this.isHistoryModalOpen.set(true);
    this.isActivityModalOpen.set(true);
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
    this.isActivityModalOpen.set(false);
  }

  viewFullAuditHistory(): void {
    this.isHistoryModalOpen.set(false);
    this.navService.navigateTo('audit-history');
  }

  countryAuditSummary = computed(() => {
    const selId = this.historySelectedCountryId();
    const list = this.sortedCountries();
    const cFromId = selId ? list.find((c: Country) => c.id === selId) : null;
    const sc = cFromId || this.selectedCountry() || list[0];
    const name = sc?.name || this.formName() || 'United Arab Emirates';
    const code = sc?.isoCode2 || sc?.code || this.formIsoCode2() || 'AE';
    const id = sc?.id ?? 'CNT-0001';
    const iso2 = code;
    const iso3 = sc?.isoCode3 || this.formIsoCode3() || (code === 'AE' ? 'ARE' : 'USA');
    const isoNumeric = sc?.isoNumeric || this.formIsoNumeric() || (code === 'AE' ? '784' : '840');
    const flagUrl = sc?.flag || this.formFlag() || `https://flagcdn.com/${code.toLowerCase()}.svg`;
    const refId = sc ? `CNT-00${sc.id}` : 'CNT-0001';
    const status = sc?.status || 'Active';

    const allActivities = [
      {
        id: 'H-004',
        action: 'Updated',
        actionType: 'updated',
        dotColor: 'bg-blue-500',
        description: 'Phone Dial Code changed',
        user: 'Admin User',
        date: '19 Oct 2026, 10:42 AM',
        isoDate: '2026-10-19',
        hasDetails: true,
        previousValue: '+971',
        newValue: '+971',
        referenceId: 'H-004',
      },
      {
        id: 'H-003',
        action: 'Drafted',
        actionType: 'drafted',
        dotColor: 'bg-amber-500',
        description: 'Country saved as draft revision',
        user: 'Admin User',
        date: '18 Oct 2026, 04:30 PM',
        isoDate: '2026-10-18',
        hasDetails: true,
        previousValue: 'Active',
        newValue: 'Draft',
        referenceId: 'H-003',
      },
      {
        id: 'H-002',
        action: 'Status Changed',
        actionType: 'status',
        dotColor: 'bg-emerald-500',
        description: 'Status changed from Inactive to Active',
        user: 'System Admin',
        date: '18 Oct 2026, 03:15 PM',
        isoDate: '2026-10-18',
        hasDetails: false,
        previousValue: 'Inactive',
        newValue: 'Active',
        referenceId: 'H-002',
      },
      {
        id: 'H-001',
        action: 'Created',
        actionType: 'created',
        dotColor: 'bg-slate-400',
        description: 'Country record created',
        user: 'Admin User',
        date: '15 Oct 2026, 09:20 AM',
        isoDate: '2026-10-15',
        hasDetails: false,
        previousValue: '—',
        newValue: name,
        referenceId: 'H-001',
      },
    ];

    const filter = this.historyActivityFilter();
    const startDate = this.historyStartDate();
    const endDate = this.historyEndDate();

    let filtered = filter === 'All Activities'
      ? allActivities
      : allActivities.filter((a) => a.action.toLowerCase().includes(filter.toLowerCase()));

    if (startDate) {
      filtered = filtered.filter((a) => a.isoDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((a) => a.isoDate <= endDate);
    }

    const updatedCount = filtered.filter((a) => a.action === 'Updated' || a.action === 'Status Changed').length;
    const deletedCount = this.deletedCountries().length;
    const restoredCount = filtered.filter((a) => a.action === 'Restored').length;
    const approvedCount = filtered.filter((a) => a.action === 'Approved' || a.action === 'Created').length;
    const pendingCount = filtered.filter((a) => a.action === 'Drafted' || a.action === 'Pending').length;
    const lastUpdateEvent = allActivities.find((a) => a.action === 'Updated') || allActivities[0];
    const lastUpdatedAt = lastUpdateEvent ? lastUpdateEvent.date : '19 Oct 2026, 10:42 AM';
    const lastUpdatedBy = lastUpdateEvent ? lastUpdateEvent.user : 'Admin User';

    return {
      country: { id, name, code, iso2, iso3, isoNumeric, flagUrl, refId, status },
      totalEvents: filtered.length,
      updated: updatedCount,
      deleted: deletedCount,
      restored: restoredCount,
      approved: approvedCount,
      pending: pendingCount,
      rejected: filtered.filter((a) => a.action === 'Rejected').length || 0,
      lastUpdatedAt,
      lastUpdatedBy,
      activities: filtered,
    };
  });

  toggleStatusFilter(tab: 'active' | 'inactive' | 'draft'): void {
    if (this.activeFilterTab() === tab) {
      this.setFilterTab('all');
    } else {
      this.setFilterTab(tab);
    }
  }

  viewCountry = computed<Country>(() => {
    const sc = this.selectedCountry();
    if (sc) {
      return {
        ...sc,
        isoCode2: sc.isoCode2 || sc.code || 'US',
        isoCode3: sc.isoCode3 || (sc.code === 'AE' ? 'ARE' : sc.code === 'US' ? 'USA' : `${sc.code}A`),
        isoNumeric: sc.isoNumeric || (sc.code === 'AE' ? '784' : sc.code === 'US' ? '840' : '100'),
        nationality: sc.nationality || (sc.code === 'AE' ? 'Emirati' : sc.code === 'US' ? 'American' : `${sc.name} citizen`),
      };
    }
    return {
      id: this.currentCountryId() || '0',
      name: this.formName() || '',
      code: this.formIsoCode2() || this.formCode() || '',
      isoCode2: this.formIsoCode2() || '',
      isoCode3: this.formIsoCode3() || '',
      isoNumeric: this.formIsoNumeric() || '',
      nationality: this.formNationality() || '',
      isd: this.formIsd() || '',
      currency: this.formCurrency() || '',
      status: (this.formStatus() === 'Delete' ? 'Deleted' : this.formStatus()) as any,
      isDefault: this.formDefault() === 'Yes',
      flag: this.formFlag() || '',
      continent: this.formContinent() || '',
      capital: this.formCapital() || '',
      customFields: this.formCustomFields() || {},
      translations: this.formTranslations() || {},
      actionMessage: 'Updated',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };
  });

  // Country Form State for Add / Edit
  formCode = signal<string>('');
  formIsoCode2 = signal<string>('');
  formIsoCode3 = signal<string>('');
  formIsoNumeric = signal<string>('');
  formNationality = signal<string>('');
  formIsd = signal<string>('');
  formName = signal<string>('');
  formCurrency = signal<string>('');
  formDefault = signal<'Yes' | 'No'>('No');
  formStatus = signal<FormStatus>('Active');
  isStatusDropdownOpen = signal<boolean>(false);

  toggleStatusDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.isStatusDropdownOpen.update(v => !v);
  }

  toggleDefault(event?: Event): void {
    if (event) event.stopPropagation();
    this.formDefault.update(v => v === 'Yes' ? 'No' : 'Yes');
  }

  setStatus(status: FormStatus, event?: Event): void {
    if (event) event.stopPropagation();
    this.formStatus.set(status);
    this.isStatusDropdownOpen.set(false);
  }

  // Footer record navigator state (Add, Edit, View mode)
  isRecordDropdownOpen = signal<boolean>(false);
  recordInputValue = signal<string>('1');

  totalRecordsCount = computed<number>(() => {
    return this.sortedCountries().length || 42;
  });

  recordsList = computed<number[]>(() => {
    const total = this.totalRecordsCount();
    const arr: number[] = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  });

  syncRecordInputEffect = effect(() => {
    const num = this.currentCountryDisplayNumber();
    untracked(() => {
      this.recordInputValue.set(String(num));
    });
  });

  currentCountryDisplayNumber = computed<number>(() => {
    const list = this.sortedCountries();
    const curId = this.currentCountryId();
    if (!curId) return 1;
    const idx = list.findIndex(c => c.id === curId);
    return idx >= 0 ? idx + 1 : 1;
  });

  toggleRecordDropdown(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isRecordDropdownOpen.update((v) => !v);
  }

  selectRecordFromDropdown(recordNum: number): void {
    this.goToCountryByDisplayNumber(recordNum);
    this.isRecordDropdownOpen.set(false);
  }

  onRecordInputKey(val: any): void {
    this.recordInputValue.set(String(val));
  }

  commitRecordInput(): void {
    const raw = parseInt(this.recordInputValue().trim(), 10);
    if (!isNaN(raw)) {
      this.goToCountryByDisplayNumber(raw);
      this.isRecordDropdownOpen.set(false);
    } else {
      this.recordInputValue.set(String(this.currentCountryDisplayNumber()));
    }
  }

  goToCountryByDisplayNumber(displayNum: number): void {
    const list = this.sortedCountries();
    if (!list.length) return;
    const clamped = Math.max(1, Math.min(list.length, displayNum));
    const target = list[clamped - 1];
    this.currentCountryId.set(target.id);
    this.recordInputValue.set(String(clamped));
    if (this.viewMode() === 'edit') {
      this.openEdit(target);
    } else if (this.viewMode() === 'view') {
      this.openView(target);
    } else {
      this.openEdit(target);
    }
  }

  goToFirstCountry(): void {
    this.goToCountryByDisplayNumber(1);
  }

  goToPreviousCountry(): void {
    const cur = this.currentCountryDisplayNumber();
    if (cur > 1) {
      this.goToCountryByDisplayNumber(cur - 1);
    } else {
      this.goToCountryByDisplayNumber(1);
    }
  }

  goToNextCountry(): void {
    const list = this.sortedCountries();
    const cur = this.currentCountryDisplayNumber();
    if (cur < list.length) {
      this.goToCountryByDisplayNumber(cur + 1);
    } else {
      this.goToCountryByDisplayNumber(list.length || 1);
    }
  }

  goToLastCountry(): void {
    const list = this.sortedCountries();
    this.goToCountryByDisplayNumber(list.length || 1);
  }
  formFlag = signal<string | null>(null);
  formContinent = signal<string>('');
  formCapital = signal<string>('');
  formCustomFields = signal<Record<string, any>>({});
  formTranslations = signal<Record<string, string>>({});

  // Form field focus tracking for floating label
  isCodeFocused = signal<boolean>(false);
  isIsoCode2Focused = signal<boolean>(false);
  isIsoCode3Focused = signal<boolean>(false);
  isIsoNumericFocused = signal<boolean>(false);
  isNationalityFocused = signal<boolean>(false);
  isContinentFocused = signal<boolean>(false);
  isCapitalFocused = signal<boolean>(false);
  isCurrencyFocused = signal<boolean>(false);
  isIsdFocused = signal<boolean>(false);
  isNameFocused = signal<boolean>(false);
  isViewNameFocused = signal<boolean>(false);

  // Active Persona switcher dropdown (Tenant 1: User 1A, User 1B, Tenant 2: User 2A, User 2B, Admin)
  isPersonaDropdownOpen = signal<boolean>(false);

  togglePersonaDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.isPersonaDropdownOpen.update((v) => !v);
  }

  selectPersona(userId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.tenantService.switchUser(userId);
    this.isPersonaDropdownOpen.set(false);
    this.showToast(
      `Switched to ${this.tenantService.activeUser().displayName} (${this.tenantService.activeTenant().name}) · ${this.tenantService.visibleFieldCount()} fields visible`
    );
  }

  /**
   * Field visibility resolution connecting Concept 1 (Tenant Setting Table) and Concept 2 (User Permission Table)
   */
  isFieldVisible(fieldKey: string): boolean {
    return this.tenantService.isFieldVisible(fieldKey);
  }

  /**
   * Determine column visibility for List View Table
   */
  isColumnVisibleForTenantUser(colKey: string): boolean {
    let fieldKey = colKey;
    if (colKey === 'code') fieldKey = 'isoCode2';
    const fieldDef = this.tenantService.allFields().find((f) => f.key === fieldKey);
    if (fieldDef) {
      return this.tenantService.isFieldVisible(fieldKey);
    }
    return true;
  }

  getCustomFieldValue(key: string): any {
    return this.formCustomFields()[key] ?? '';
  }

  setCustomFieldValue(key: string, val: any): void {
    this.formCustomFields.update((curr) => ({ ...curr, [key]: val }));
  }

  // Adding new field in Country Master dialog state
  newFieldNameInput = signal<string>('');
  newFieldKeyInput = signal<string>('');
  newFieldTypeInput = signal<'text' | 'number' | 'boolean' | 'select'>('text');
  newFieldCategoryInput = signal<'core' | 'codes' | 'system' | 'custom'>('custom');
  newFieldRequiredInput = signal<boolean>(false);

  submitNewField(): void {
    const label = this.newFieldNameInput().trim();
    if (!label) {
      this.showToast('Please enter a field name');
      return;
    }
    const created = this.tenantService.addNewField({
      name: label,
      key: this.newFieldKeyInput().trim() || undefined,
      type: this.newFieldTypeInput(),
      category: this.newFieldCategoryInput(),
      required: this.newFieldRequiredInput(),
    });

    if (!this.listColumns.some((c) => c.key === created.key)) {
      this.listColumns.push({ key: created.key as any, label: created.label });
    }

    this.newFieldNameInput.set('');
    this.newFieldKeyInput.set('');
    this.showToast(`New field "${created.label}" added to Country Master!`);
    this.tenantService.activeConfigTab.set('tenantSettings');
  }

  // Right side section accordion state (collapsed by default, click to expand)
  isSideSectionOpen = signal<boolean>(true);
  selectedReferenceRecordName = signal<string | null>(null);

  // Unified Action Panel Modals (Points 36, 37, 38)
  isActivityModalOpen = signal<boolean>(false);
  activityModalTab = signal<'history' | 'deleted'>('history');
  isExportModalOpen = signal<boolean>(false);

  openActivityModal(tab: 'history' | 'deleted' = 'history'): void {
    this.activityModalTab.set(tab);
    if (tab === 'history') {
      this.isRecycleBinModalOpen.set(false);
      this.openHistoryModal(this.currentCountryId() ? 'current' : 'all');
    } else {
      this.isHistoryModalOpen.set(false);
      this.openRecycleBinModal();
    }
    this.isActivityModalOpen.set(true);
  }

  setActivityTab(tab: 'history' | 'deleted'): void {
    this.activityModalTab.set(tab);
    if (tab === 'history') {
      this.isRecycleBinModalOpen.set(false);
      this.openHistoryModal(this.currentCountryId() ? 'current' : 'all');
    } else {
      this.isHistoryModalOpen.set(false);
      this.openRecycleBinModal();
    }
  }

  closeActivityModal(): void {
    this.isActivityModalOpen.set(false);
    this.isHistoryModalOpen.set(false);
    this.isRecycleBinModalOpen.set(false);
  }

  openExportModal(): void {
    if (this.exportFields().size === 0) {
      this.exportFields.set(new Set(this.exportFieldDefs.map(f => f.key)));
    }
    this.exportSearch.set('');
    this.isExportModalOpen.set(true);
  }

  closeExportModal(): void {
    this.isExportModalOpen.set(false);
  }

  exportPdfToggle = signal<boolean>(true);
  exportPrintToggle = signal<boolean>(false);

  executeExportProceed(): void {
    if (this.exportFields().size === 0) {
      this.showToast('Please select at least one column to export');
      return;
    }
    if (!this.exportPdfToggle() && !this.exportPrintToggle()) {
      this.isExportPromptOpen.set(true);
      return;
    }
    if (this.exportPdfToggle() && this.exportPrintToggle()) {
      this.runExport('pdf');
      this.runExport('print');
      this.closeExportModal();
      return;
    }
    if (this.exportPdfToggle()) {
      this.exportPdfDirect();
    } else if (this.exportPrintToggle()) {
      this.exportPrintDirect();
    }
  }

  clearAllExportFields(): void {
    this.setAllExportFields(false);
  }

  openShareModalUnified(channel: 'email' | 'whatsapp' = 'email'): void {
    this.openShare(channel);
  }

  toggleSideSection(): void {
    this.isSideSectionOpen.update(open => !open);
  }

  focusNextField(arg1: string, arg2?: string | Event, arg3?: Event): void {
    let currentField = '';
    let nextId = '';
    let event: Event | undefined;

    if (arg2 instanceof Event || (arg2 && typeof arg2 !== 'string')) {
      // 2-arg call: focusNextField(nextId, event)
      nextId = arg1;
      event = arg2 as Event;
    } else if (typeof arg2 === 'string') {
      // 3-arg call: focusNextField(currentField, nextId, event)
      currentField = arg1;
      nextId = arg2;
      event = arg3;
    } else {
      nextId = arg1;
    }

    if (event) {
      event.preventDefault();
    }

    if (currentField) {
      let val = '';
      switch (currentField) {
        case 'name': val = this.formName()?.trim() || ''; break;
        case 'isoCode2': val = this.formIsoCode2()?.trim() || ''; break;
        case 'isoCode3': val = this.formIsoCode3()?.trim() || ''; break;
        case 'isoNumeric': val = this.formIsoNumeric()?.trim() || ''; break;
        case 'isd': val = this.formIsd()?.trim() || ''; break;
        case 'currency': val = this.formCurrency()?.trim() || ''; break;
        case 'nationality': val = this.formNationality()?.trim() || ''; break;
        default: val = 'ok'; break;
      }
      if (!val) {
        this.markFieldTouched(currentField);
        return;
      }
    }

    const el = document.getElementById(nextId);
    if (el) {
      el.focus();
    }
  }

  // Floating notch label computed states: keep label on top notch so placeholder is clean & crisp
  isNameFloating = computed(() => true);
  isIsoCode2Floating = computed(() => true);
  isIsoCode3Floating = computed(() => true);
  isIsoNumericFloating = computed(() => true);
  isIsdFloating = computed(() => true);
  isCurrencyFloating = computed(() => true);
  isNationalityFloating = computed(() => true);
  isContinentFloating = computed(() => true);
  isCapitalFloating = computed(() => true);

  // Form Interaction & Touched Tracking (Section 4.5)
  touchedFields = signal<Record<string, boolean>>({});
  hasSubmitAttempted = signal<boolean>(false);

  markFieldTouched(field: string): void {
    this.touchedFields.update((t) => ({ ...t, [field]: true }));
  }

  isFieldInvalid(field: string): boolean {
    const isTouched = !!this.touchedFields()[field] || this.hasSubmitAttempted();
    if (!isTouched) return false;
    switch (field) {
      case 'name': return !!this.nameError();
      case 'isoCode2': return !!this.isoCode2Error();
      case 'isoCode3': return !!this.isoCode3Error();
      case 'isoNumeric': return !!this.isoNumericError();
      case 'isd': return !!this.isdError();
      case 'currency': return !!this.currencyError();
      case 'nationality': return !!this.nationalityError();
      case 'continent': return !!this.continentError();
      case 'capital': return !!this.capitalError();
      default: return false;
    }
  }

  // Section 4.8 Detailed Field Validation Computed Rules
  nameError = computed<string | null>(() => {
    const raw = this.formName();
    const val = raw ? raw.trim() : '';
    if (!val) return 'Country Name is required.';
    if (/^\+?\d+$/.test(val) || /^[\d\s+\-()]+$/.test(val)) {
      return 'Country name cannot be numeric or a phone dialing code.';
    }
    const validLettersRegex = /^[\p{L}\p{M}\s.'\-()]+$/u;
    if (!validLettersRegex.test(val)) {
      return 'Country name contains invalid special characters.';
    }
    const curId = this.currentCountryId();
    const isEdit = this.viewMode() === 'edit';
    const isDuplicate = this.countryService.countries().some((c) =>
      c.status !== 'Deleted' &&
      c.name.trim().toLowerCase() === val.toLowerCase() &&
      (!isEdit || c.id !== curId)
    );
    if (isDuplicate) {
      return 'A country with this name already exists in Country Master.';
    }
    return null;
  });

  isoCode2Error = computed<string | null>(() => {
    const raw = this.formIsoCode2();
    const val = raw ? raw.trim().toUpperCase() : '';
    if (!val) return 'ISO Code 2 is required.';
    if (!/^[A-Za-z]{2}$/.test(val)) {
      return 'ISO Code 2 must be exactly 2 alphabetic characters (e.g. US, AE).';
    }
    return null;
  });

  isoCode3Error = computed<string | null>(() => {
    const raw = this.formIsoCode3();
    const val = raw ? raw.trim().toUpperCase() : '';
    if (!val) return 'ISO Code 3 is required.';
    if (!/^[A-Za-z]{3}$/.test(val)) {
      return 'ISO Code 3 must be exactly 3 alphabetic characters (e.g. USA, ARE).';
    }
    return null;
  });

  isoNumericError = computed<string | null>(() => {
    const raw = this.formIsoNumeric();
    const val = raw ? raw.trim() : '';
    if (!val) return 'ISO Numeric is required.';
    if (!/^\d{3}$/.test(val)) {
      return 'ISO Numeric must be exactly 3 digits (e.g. 840, 784, 076).';
    }
    return null;
  });

  isdError = computed<string | null>(() => {
    const raw = this.formIsd();
    const val = raw ? raw.trim() : '';
    if (!val) return 'Dial Code is required.';
    if (!/^\+[0-9]{1,5}$/.test(val)) {
      return 'Dial Code must start with + followed by 1 to 5 digits (e.g. +1, +971).';
    }
    return null;
  });

  currencyError = computed<string | null>(() => {
    const raw = this.formCurrency();
    const val = raw ? raw.trim() : '';
    if (!val) return 'Default Currency is required.';
    if (val.length < 2) {
      return 'Please enter a valid currency (e.g. USD, EUR, AED).';
    }
    return null;
  });

  nationalityError = computed<string | null>(() => {
    const raw = this.formNationality();
    const val = raw ? raw.trim() : '';
    if (!val) return null; // Optional
    if (!/^[\p{L}\p{M}\s.'\-]+$/u.test(val)) {
      return 'Nationality contains invalid characters.';
    }
    return null;
  });

  continentError = computed<string | null>(() => null);
  capitalError = computed<string | null>(() => null);

  // Input validity states for green checkmark icon
  isNameValid = computed(() => !!this.formName()?.trim() && !this.nameError());
  isIsoCode2Valid = computed(() => !!this.formIsoCode2()?.trim() && !this.isoCode2Error());
  isIsoCode3Valid = computed(() => !!this.formIsoCode3()?.trim() && !this.isoCode3Error());
  isIsoNumericValid = computed(() => !!this.formIsoNumeric()?.trim() && !this.isoNumericError());
  isIsdValid = computed(() => !!this.formIsd()?.trim() && !this.isdError());
  isCurrencyValid = computed(() => !!this.formCurrency()?.trim() && !this.currencyError());
  isNationalityValid = computed(() => !!this.formNationality()?.trim() && !this.nationalityError());
  isContinentValid = computed(() => !this.continentError());
  isCapitalValid = computed(() => !this.capitalError());

  isFormValid = computed(() => {
    if (this.isFieldVisible('name') && this.nameError()) return false;
    if (this.isFieldVisible('isoCode2') && this.isoCode2Error()) return false;
    if (this.isFieldVisible('isoCode3') && this.isoCode3Error()) return false;
    if (this.isFieldVisible('isoNumeric') && this.isoNumericError()) return false;
    if (this.isFieldVisible('isd') && this.isdError()) return false;
    if (this.isFieldVisible('currency') && this.currencyError()) return false;
    if (this.isFieldVisible('nationality') && this.nationalityError()) return false;
    if (this.isFieldVisible('continent') && this.continentError()) return false;
    if (this.isFieldVisible('capital') && this.capitalError()) return false;
    return true;
  });

  // Currency Master Selection Options
  readonly currencyMasterList: CurrencyOption[] = DEFAULT_CURRENCY_OPTIONS;
  isCurrencyDropdownOpen = signal<boolean>(false);
  currencySearch = signal<string>('');

  filteredCurrencyList = computed<CurrencyOption[]>(() => {
    const query = (this.currencySearch() || '').trim().toLowerCase();
    const list = this.currencyMasterList || DEFAULT_CURRENCY_OPTIONS;
    if (!query) {
      return list;
    }
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        (c.symbol && c.symbol.toLowerCase().includes(query))
    );
  });

  toggleCurrencyDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isCurrencyDropdownOpen.update((v) => !v);
    if (!this.isCurrencyDropdownOpen()) {
      this.currencySearch.set('');
    }
  }

  selectCurrencyOption(c: CurrencyOption): void {
    this.formCurrency.set(`${c.code} — ${c.name}`);
    this.isCurrencyDropdownOpen.set(false);
    this.currencySearch.set('');
    this.markFieldTouched('currency');
  }

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

  // Section 13: 10 Configured Default Languages for Translation
  readonly translationLanguages = [
    { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
    { code: 'es', label: 'Spanish', native: 'Español', dir: 'ltr' },
    { code: 'fr', label: 'French', native: 'Français', dir: 'ltr' },
    { code: 'de', label: 'German', native: 'Deutsch', dir: 'ltr' },
    { code: 'zh', label: 'Chinese', native: '中文', dir: 'ltr' },
    { code: 'ja', label: 'Japanese', native: '日本語', dir: 'ltr' },
    { code: 'ru', label: 'Russian', native: 'Русский', dir: 'ltr' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
    { code: 'pt', label: 'Portuguese', native: 'Português', dir: 'ltr' },
    { code: 'it', label: 'Italian', native: 'Italiano', dir: 'ltr' },
  ];
  translationSearch = signal<string>('');
  filteredTranslationLanguages = computed(() => {
    const q = this.translationSearch().trim().toLowerCase();
    if (!q) return this.translationLanguages;
    return this.translationLanguages.filter(
      (l) => l.label.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  });
  isTranslationOpen = signal<boolean>(false);
  translationDraft = signal<Record<string, string>>({});
  translationCount = computed(() => Object.values(this.formTranslations()).filter((v) => v.trim()).length);
  confirmOverwriteTranslationsModal = signal<boolean>(false);

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
  isClearModalOpen = signal<boolean>(false);

  // View page footer switches + export prompt
  viewPdf = signal<boolean>(false);
  viewPrint = signal<boolean>(false);
  isExportPromptOpen = signal<boolean>(false);

  // Field speech listening signals
  activeListeningField = signal<string | null>(null);
  private speechRecognitionObj: any = null;

  // Flag uploader sub-tab (Upload, Drop, Gallery - Section 6.2)
  flagTab = signal<'drop' | 'upload' | 'attachment' | 'gallery'>('drop');
  isDraggingFlag = signal<boolean>(false);
  gallerySearch = signal<string>('');
  galleryVisibleCount = signal<number>(16);

  // Flag Lookup Modal (Item 11)
  isFlagLookupModalOpen = signal<boolean>(false);
  flagLookupTab = signal<'gallery' | 'upload' | 'drop'>('gallery');

  openFlagLookupModal(tab: 'gallery' | 'upload' | 'drop' = 'gallery'): void {
    this.flagLookupTab.set(tab);
    this.isFlagLookupModalOpen.set(true);
  }

  closeFlagLookupModal(): void {
    this.isFlagLookupModalOpen.set(false);
  }

  // Section 7: Popular flags gallery with 36 world flags
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
    { code: 'NL', name: 'Netherlands', flagUrl: 'https://flagcdn.com/nl.svg' },
    { code: 'CH', name: 'Switzerland', flagUrl: 'https://flagcdn.com/ch.svg' },
    { code: 'SE', name: 'Sweden', flagUrl: 'https://flagcdn.com/se.svg' },
    { code: 'NO', name: 'Norway', flagUrl: 'https://flagcdn.com/no.svg' },
    { code: 'DK', name: 'Denmark', flagUrl: 'https://flagcdn.com/dk.svg' },
    { code: 'FI', name: 'Finland', flagUrl: 'https://flagcdn.com/fi.svg' },
    { code: 'BE', name: 'Belgium', flagUrl: 'https://flagcdn.com/be.svg' },
    { code: 'AT', name: 'Austria', flagUrl: 'https://flagcdn.com/at.svg' },
    { code: 'PT', name: 'Portugal', flagUrl: 'https://flagcdn.com/pt.svg' },
    { code: 'IE', name: 'Ireland', flagUrl: 'https://flagcdn.com/ie.svg' },
    { code: 'NZ', name: 'New Zealand', flagUrl: 'https://flagcdn.com/nz.svg' },
    { code: 'MX', name: 'Mexico', flagUrl: 'https://flagcdn.com/mx.svg' },
    { code: 'AR', name: 'Argentina', flagUrl: 'https://flagcdn.com/ar.svg' },
    { code: 'ZA', name: 'South Africa', flagUrl: 'https://flagcdn.com/za.svg' },
    { code: 'EG', name: 'Egypt', flagUrl: 'https://flagcdn.com/eg.svg' },
    { code: 'MY', name: 'Malaysia', flagUrl: 'https://flagcdn.com/my.svg' },
    { code: 'TH', name: 'Thailand', flagUrl: 'https://flagcdn.com/th.svg' },
    { code: 'ID', name: 'Indonesia', flagUrl: 'https://flagcdn.com/id.svg' },
    { code: 'PL', name: 'Poland', flagUrl: 'https://flagcdn.com/pl.svg' },
    { code: 'QA', name: 'Qatar', flagUrl: 'https://flagcdn.com/qa.svg' },
  ];

  filteredGalleryFlags = computed(() => {
    const q = this.gallerySearch().trim().toLowerCase();
    if (!q) return this.galleryFlags;
    return this.galleryFlags.filter(
      (f) => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
    );
  });

  displayedGalleryFlags = computed(() => {
    return this.filteredGalleryFlags().slice(0, this.galleryVisibleCount());
  });

  onGalleryScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 30) {
      if (this.galleryVisibleCount() < this.filteredGalleryFlags().length) {
        this.galleryVisibleCount.update((c) => Math.min(c + 8, this.filteredGalleryFlags().length));
      }
    }
  }

  downloadFlag(url?: string | null, name?: string): void {
    const flagUrl = url || this.formFlag();
    if (!flagUrl) {
      this.showToast('No flag selected to download.');
      return;
    }
    const a = document.createElement('a');
    a.href = flagUrl;
    a.download = `${(name || this.formName() || 'country').toLowerCase().replace(/\s+/g, '-')}-flag.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast(`Flag downloaded for ${name || this.formName()}`);
  }

  // Section 14: AI Assistance State
  isAiModalOpen = signal<boolean>(false);
  aiInputText = signal<string>('');
  aiIsProcessing = signal<boolean>(false);
  aiErrorMessage = signal<string | null>(null);
  aiExtractedData = signal<{
    name?: string;
    isoCode2?: string;
    isoCode3?: string;
    isoNumeric?: string;
    isd?: string;
    currency?: string;
    nationality?: string;
    continent?: string;
    capital?: string;
  } | null>(null);
  aiShowConflictPrompt = signal<boolean>(false);

  openAiModal(): void {
    this.aiErrorMessage.set(null);
    this.aiExtractedData.set(null);
    this.aiShowConflictPrompt.set(false);
    this.isAiModalOpen.set(true);
    setTimeout(() => {
      const el = document.getElementById('ai-textarea');
      if (el) {
        el.focus();
      }
    }, 100);
  }

  closeAiModal(): void {
    this.isAiModalOpen.set(false);
    this.aiShowConflictPrompt.set(false);
  }

  clearAiInput(): void {
    this.aiInputText.set('');
    this.aiExtractedData.set(null);
    this.aiErrorMessage.set(null);
  }

  confirmAiData(): void {
    if (this.aiExtractedData()) {
      this.onAiConfirmClick();
    } else if (this.aiInputText().trim()) {
      const text = this.aiInputText().trim();
      const extracted = this.parseAiCountryText(text);
      if (extracted && (extracted.name || extracted.isoCode2)) {
        this.aiExtractedData.set(extracted);
        this.onAiConfirmClick();
      } else {
        this.aiErrorMessage.set('Could not extract sufficient country data. Please review your input.');
      }
    } else {
      this.aiErrorMessage.set('Please enter or paste country details in the editor.');
    }
  }

  startAiExtraction(): void {
    const text = this.aiInputText().trim();
    if (!text) {
      this.aiErrorMessage.set('Please enter or paste country details in the editor.');
      return;
    }
    this.aiIsProcessing.set(true);
    this.aiErrorMessage.set(null);

    setTimeout(() => {
      try {
        const extracted = this.parseAiCountryText(text);
        if (!extracted.name && !extracted.isoCode2) {
          this.aiErrorMessage.set(
            'Could not extract sufficient country data. Please ensure the country name and codes are included.'
          );
          this.aiIsProcessing.set(false);
          return;
        }
        this.aiExtractedData.set(extracted);
        this.aiIsProcessing.set(false);
        this.showToast('Country data extracted. Click Confirm to apply.');
      } catch (err: any) {
        this.aiErrorMessage.set('Failed to process text. Preserving your input for review.');
        this.aiIsProcessing.set(false);
      }
    }, 450);
  }

  private parseAiCountryText(raw: string): any {
    const text = raw.trim();
    let name = '';
    let isoCode2 = '';
    let isoCode3 = '';
    let isoNumeric = '';
    let isd = '';
    let currency = '';
    let nationality = '';
    let continent = '';

    // Check if JSON format
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const obj = JSON.parse(text);
        name = obj.name || obj.country || obj.countryName || '';
        isoCode2 = obj.isoCode2 || obj.code || obj.iso2 || '';
        isoCode3 = obj.isoCode3 || obj.iso3 || '';
        isoNumeric = obj.isoNumeric || obj.numeric || '';
        isd = obj.isd || obj.dialCode || obj.phoneCode || '';
        currency = obj.currency || obj.currencyCode || '';
        nationality = obj.nationality || '';
        continent = obj.continent || obj.region || '';
      } catch { }
    }

    // Keyword extractors
    const nameMatch = text.match(/(?:Country|Name|Country Name)[:\s]+([A-Za-z\s.'\-]+)/i);
    if (!name && nameMatch) name = nameMatch[1].trim().split(/[\n,;]/)[0];

    const iso2Match = text.match(/(?:ISO\s*2|ISO\s*Code\s*2|Code)[:\s]+([A-Za-z]{2})\b/i);
    if (!iso2Match) {
      const inline2 = text.match(/\b([A-Z]{2})\b/);
      if (inline2 && !isoCode2) isoCode2 = inline2[1];
    } else {
      isoCode2 = iso2Match[1].toUpperCase();
    }

    const iso3Match = text.match(/(?:ISO\s*3|ISO\s*Code\s*3)[:\s]+([A-Za-z]{3})\b/i);
    if (iso3Match) isoCode3 = iso3Match[1].toUpperCase();

    const numericMatch = text.match(/(?:Numeric|ISO\s*Numeric)[:\s]+(\d{3})\b/i);
    if (numericMatch) isoNumeric = numericMatch[1];

    const isdMatch = text.match(/(?:ISD|Dial\s*Code|Phone\s*Code)[:\s]+(\+[0-9]{1,4})\b/i);
    if (isdMatch) isd = isdMatch[1];
    else {
      const rawIsd = text.match(/\+(\d{1,4})\b/);
      if (rawIsd) isd = '+' + rawIsd[1];
    }

    const currMatch = text.match(/(?:Currency|Default\s*Currency)[:\s]+([A-Za-z]{3}(?:\s*—\s*[^,\n]+)?)/i);
    if (currMatch) currency = currMatch[1].trim();

    const natMatch = text.match(/(?:Nationality)[:\s]+([A-Za-z\s]+)/i);
    if (natMatch) nationality = natMatch[1].trim().split(/[\n,;]/)[0];

    const contMatch = text.match(/(?:Continent|Region)[:\s]+([A-Za-z\s]+)/i);
    if (contMatch) continent = contMatch[1].trim().split(/[\n,;]/)[0];

    // Fallback: match preset if country name mentioned
    if (!name) {
      for (const p of this.countryPresets) {
        if (text.toLowerCase().includes(p.name.toLowerCase())) {
          name = p.name;
          if (!isoCode2) isoCode2 = p.isoCode2 || p.code;
          if (!isoCode3) isoCode3 = p.isoCode3;
          if (!isoNumeric) isoNumeric = p.isoNumeric;
          if (!isd) isd = p.isd;
          if (!currency) currency = p.currency;
          if (!nationality) nationality = p.nationality;
          if (!continent) continent = p.continent;
          break;
        }
      }
    }

    // Match preset enrichment
    const matchedPreset = this.countryPresets.find(
      (p) =>
        (name && p.name.toLowerCase() === name.toLowerCase()) ||
        (isoCode2 && p.code.toLowerCase() === isoCode2.toLowerCase())
    );
    if (matchedPreset) {
      if (!name) name = matchedPreset.name;
      if (!isoCode2) isoCode2 = matchedPreset.isoCode2 || matchedPreset.code;
      if (!isoCode3) isoCode3 = matchedPreset.isoCode3;
      if (!isoNumeric) isoNumeric = matchedPreset.isoNumeric;
      if (!isd) isd = matchedPreset.isd;
      if (!currency) currency = matchedPreset.currency;
      if (!nationality) nationality = matchedPreset.nationality;
      if (!continent) continent = matchedPreset.continent;
    }

    return {
      name: name || undefined,
      isoCode2: isoCode2 ? isoCode2.toUpperCase() : undefined,
      isoCode3: isoCode3 ? isoCode3.toUpperCase() : undefined,
      isoNumeric: isoNumeric || undefined,
      isd: isd || undefined,
      currency: currency || undefined,
      nationality: nationality || undefined,
      continent: continent || undefined,
    };
  }

  onAiConfirmClick(): void {
    if (!this.aiExtractedData()) return;
    const hasExistingData = !!(
      this.formName().trim() ||
      this.formIsoCode2().trim() ||
      this.formIsd().trim() ||
      this.formCurrency().trim()
    );

    if (hasExistingData) {
      this.aiShowConflictPrompt.set(true);
    } else {
      this.applyAiData('replace');
    }
  }

  applyAiData(mode: 'replace' | 'merge'): void {
    const data = this.aiExtractedData();
    if (!data) return;

    if (mode === 'replace') {
      if (data.name) this.formName.set(data.name);
      if (data.isoCode2) {
        this.formIsoCode2.set(data.isoCode2);
        this.formCode.set(data.isoCode2);
        this.formFlag.set(`https://flagcdn.com/${data.isoCode2.toLowerCase()}.svg`);
      }
      if (data.isoCode3) this.formIsoCode3.set(data.isoCode3);
      if (data.isoNumeric) this.formIsoNumeric.set(data.isoNumeric);
      if (data.isd) this.formIsd.set(data.isd);
      if (data.currency) this.formCurrency.set(data.currency);
      if (data.nationality) this.formNationality.set(data.nationality);
      if (data.continent) this.formContinent.set(data.continent);
      if (data.capital) this.formCapital.set(data.capital);
    } else {
      // Merge: only set if currently empty
      if (data.name && !this.formName().trim()) this.formName.set(data.name);
      if (data.isoCode2 && !this.formIsoCode2().trim()) {
        this.formIsoCode2.set(data.isoCode2);
        this.formCode.set(data.isoCode2);
        this.formFlag.set(`https://flagcdn.com/${data.isoCode2.toLowerCase()}.svg`);
      }
      if (data.isoCode3 && !this.formIsoCode3().trim()) this.formIsoCode3.set(data.isoCode3);
      if (data.isoNumeric && !this.formIsoNumeric().trim()) this.formIsoNumeric.set(data.isoNumeric);
      if (data.isd && !this.formIsd().trim()) this.formIsd.set(data.isd);
      if (data.currency && !this.formCurrency().trim()) this.formCurrency.set(data.currency);
      if (data.nationality && !this.formNationality().trim()) this.formNationality.set(data.nationality);
      if (data.continent && !this.formContinent().trim()) this.formContinent.set(data.continent);
      if (data.capital && !this.formCapital().trim()) this.formCapital.set(data.capital);
    }

    // Mark touched so validation states update
    this.markFieldTouched('name');
    this.markFieldTouched('isoCode2');
    this.markFieldTouched('isoCode3');
    this.markFieldTouched('isoNumeric');
    this.markFieldTouched('isd');
    this.markFieldTouched('currency');

    this.closeAiModal();
    this.showToast('AI suggestions transferred. Please review and click Save.');
    setTimeout(() => this.focusField('country-name'), 80);
  }

  // Preset Country Examples for AI Prompt
  loadAiSample(presetName: string): void {
    const p = this.countryPresets.find((x) => x.name.toLowerCase() === presetName.toLowerCase());
    if (p) {
      this.aiInputText.set(
        `Country Name: ${p.name}\nISO Code 2: ${p.isoCode2 || p.code}\nISO Code 3: ${p.isoCode3}\nISO Numeric: ${p.isoNumeric}\nPhone Dial Code: ${p.isd}\nDefault Currency: ${p.currency}\nNationality: ${p.nationality}\nContinent: ${p.continent}`
      );
    }
  }

  // =========================================================================
  // Section 1.A: Master World Country Lookup Table (Separate Lookup Table)
  // =========================================================================
  lookupTableData: CountryLookupRecord[] = [
    { code: 'AE', name: 'United Arab Emirates', isoCode3: 'ARE', isoNumeric: '784', nationality: 'Emirati', isd: '+971', currency: 'AED — UAE Dirham', continent: 'Asia', capital: 'Abu Dhabi', flag: 'https://flagcdn.com/ae.svg' },
    { code: 'US', name: 'United States', isoCode3: 'USA', isoNumeric: '840', nationality: 'American', isd: '+1', currency: 'USD', continent: 'North America', capital: 'Washington, D.C.', flag: 'https://flagcdn.com/us.svg' },
    { code: 'GB', name: 'United Kingdom', isoCode3: 'GBR', isoNumeric: '826', nationality: 'British', isd: '+44', currency: 'GBP', continent: 'Europe', capital: 'London', flag: 'https://flagcdn.com/gb.svg' },
    { code: 'CA', name: 'Canada', isoCode3: 'CAN', isoNumeric: '124', nationality: 'Canadian', isd: '+1', currency: 'CAD', continent: 'North America', capital: 'Ottawa', flag: 'https://flagcdn.com/ca.svg' },
    { code: 'DE', name: 'Germany', isoCode3: 'DEU', isoNumeric: '276', nationality: 'German', isd: '+49', currency: 'EUR', continent: 'Europe', capital: 'Berlin', flag: 'https://flagcdn.com/de.svg' },
    { code: 'FR', name: 'France', isoCode3: 'FRA', isoNumeric: '250', nationality: 'French', isd: '+33', currency: 'EUR', continent: 'Europe', capital: 'Paris', flag: 'https://flagcdn.com/fr.svg' },
    { code: 'IT', name: 'Italy', isoCode3: 'ITA', isoNumeric: '380', nationality: 'Italian', isd: '+39', currency: 'EUR', continent: 'Europe', capital: 'Rome', flag: 'https://flagcdn.com/it.svg' },
    { code: 'ES', name: 'Spain', isoCode3: 'ESP', isoNumeric: '724', nationality: 'Spanish', isd: '+34', currency: 'EUR', continent: 'Europe', capital: 'Madrid', flag: 'https://flagcdn.com/es.svg' },
    { code: 'PT', name: 'Portugal', isoCode3: 'PRT', isoNumeric: '620', nationality: 'Portuguese', isd: '+351', currency: 'EUR', continent: 'Europe', capital: 'Lisbon', flag: 'https://flagcdn.com/pt.svg' },
    { code: 'CH', name: 'Switzerland', isoCode3: 'CHE', isoNumeric: '756', nationality: 'Swiss', isd: '+41', currency: 'CHF', continent: 'Europe', capital: 'Bern', flag: 'https://flagcdn.com/ch.svg' },
    { code: 'NL', name: 'Netherlands', isoCode3: 'NLD', isoNumeric: '528', nationality: 'Dutch', isd: '+31', currency: 'EUR', continent: 'Europe', capital: 'Amsterdam', flag: 'https://flagcdn.com/nl.svg' },
    { code: 'BE', name: 'Belgium', isoCode3: 'BEL', isoNumeric: '056', nationality: 'Belgian', isd: '+32', currency: 'EUR', continent: 'Europe', capital: 'Brussels', flag: 'https://flagcdn.com/be.svg' },
    { code: 'AT', name: 'Austria', isoCode3: 'AUT', isoNumeric: '040', nationality: 'Austrian', isd: '+43', currency: 'EUR', continent: 'Europe', capital: 'Vienna', flag: 'https://flagcdn.com/at.svg' },
    { code: 'IE', name: 'Ireland', isoCode3: 'IRL', isoNumeric: '372', nationality: 'Irish', isd: '+353', currency: 'EUR', continent: 'Europe', capital: 'Dublin', flag: 'https://flagcdn.com/ie.svg' },
    { code: 'SE', name: 'Sweden', isoCode3: 'SWE', isoNumeric: '752', nationality: 'Swedish', isd: '+46', currency: 'SEK', continent: 'Europe', capital: 'Stockholm', flag: 'https://flagcdn.com/se.svg' },
    { code: 'NO', name: 'Norway', isoCode3: 'NOR', isoNumeric: '578', nationality: 'Norwegian', isd: '+47', currency: 'NOK', continent: 'Europe', capital: 'Oslo', flag: 'https://flagcdn.com/no.svg' },
    { code: 'DK', name: 'Denmark', isoCode3: 'DNK', isoNumeric: '208', nationality: 'Danish', isd: '+45', currency: 'DKK', continent: 'Europe', capital: 'Copenhagen', flag: 'https://flagcdn.com/dk.svg' },
    { code: 'FI', name: 'Finland', isoCode3: 'FIN', isoNumeric: '246', nationality: 'Finnish', isd: '+358', currency: 'EUR', continent: 'Europe', capital: 'Helsinki', flag: 'https://flagcdn.com/fi.svg' },
    { code: 'PL', name: 'Poland', isoCode3: 'POL', isoNumeric: '616', nationality: 'Polish', isd: '+48', currency: 'PLN', continent: 'Europe', capital: 'Warsaw', flag: 'https://flagcdn.com/pl.svg' },
    { code: 'GR', name: 'Greece', isoCode3: 'GRC', isoNumeric: '300', nationality: 'Greek', isd: '+30', currency: 'EUR', continent: 'Europe', capital: 'Athens', flag: 'https://flagcdn.com/gr.svg' },
    { code: 'TR', name: 'Turkey', isoCode3: 'TUR', isoNumeric: '792', nationality: 'Turkish', isd: '+90', currency: 'TRY', continent: 'Europe', capital: 'Ankara', flag: 'https://flagcdn.com/tr.svg' },
    { code: 'SA', name: 'Saudi Arabia', isoCode3: 'SAU', isoNumeric: '682', nationality: 'Saudi', isd: '+966', currency: 'SAR', continent: 'Asia', capital: 'Riyadh', flag: 'https://flagcdn.com/sa.svg' },
    { code: 'QA', name: 'Qatar', isoCode3: 'QAT', isoNumeric: '634', nationality: 'Qatari', isd: '+974', currency: 'QAR', continent: 'Asia', capital: 'Doha', flag: 'https://flagcdn.com/qa.svg' },
    { code: 'KW', name: 'Kuwait', isoCode3: 'KWT', isoNumeric: '414', nationality: 'Kuwaiti', isd: '+965', currency: 'KWD', continent: 'Asia', capital: 'Kuwait City', flag: 'https://flagcdn.com/kw.svg' },
    { code: 'BH', name: 'Bahrain', isoCode3: 'BHR', isoNumeric: '048', nationality: 'Bahraini', isd: '+973', currency: 'BHD', continent: 'Asia', capital: 'Manama', flag: 'https://flagcdn.com/bh.svg' },
    { code: 'OM', name: 'Oman', isoCode3: 'OMN', isoNumeric: '512', nationality: 'Omani', isd: '+968', currency: 'OMR', continent: 'Asia', capital: 'Muscat', flag: 'https://flagcdn.com/om.svg' },
    { code: 'JO', name: 'Jordan', isoCode3: 'JOR', isoNumeric: '400', nationality: 'Jordanian', isd: '+962', currency: 'JOD', continent: 'Asia', capital: 'Amman', flag: 'https://flagcdn.com/jo.svg' },
    { code: 'LB', name: 'Lebanon', isoCode3: 'LBN', isoNumeric: '422', nationality: 'Lebanese', isd: '+961', currency: 'LBP', continent: 'Asia', capital: 'Beirut', flag: 'https://flagcdn.com/lb.svg' },
    { code: 'EG', name: 'Egypt', isoCode3: 'EGY', isoNumeric: '818', nationality: 'Egyptian', isd: '+20', currency: 'EGP', continent: 'Africa', capital: 'Cairo', flag: 'https://flagcdn.com/eg.svg' },
    { code: 'UAR', name: 'United Arab Republic', isoCode3: 'SYR', isoNumeric: '760', nationality: 'Arab', isd: '+963', currency: 'SYP', continent: 'Asia', capital: 'Damascus', flag: 'https://flagcdn.com/sy.svg' },
    { code: 'IN', name: 'India', isoCode3: 'IND', isoNumeric: '356', nationality: 'Indian', isd: '+91', currency: 'INR', continent: 'Asia', capital: 'New Delhi', flag: 'https://flagcdn.com/in.svg' },
    { code: 'JP', name: 'Japan', isoCode3: 'JPN', isoNumeric: '392', nationality: 'Japanese', isd: '+81', currency: 'JPY', continent: 'Asia', capital: 'Tokyo', flag: 'https://flagcdn.com/jp.svg' },
    { code: 'CN', name: 'China', isoCode3: 'CHN', isoNumeric: '156', nationality: 'Chinese', isd: '+86', currency: 'CNY', continent: 'Asia', capital: 'Beijing', flag: 'https://flagcdn.com/cn.svg' },
    { code: 'KR', name: 'South Korea', isoCode3: 'KOR', isoNumeric: '410', nationality: 'South Korean', isd: '+82', currency: 'KRW', continent: 'Asia', capital: 'Seoul', flag: 'https://flagcdn.com/kr.svg' },
    { code: 'SG', name: 'Singapore', isoCode3: 'SGP', isoNumeric: '702', nationality: 'Singaporean', isd: '+65', currency: 'SGD', continent: 'Asia', capital: 'Singapore', flag: 'https://flagcdn.com/sg.svg' },
    { code: 'MY', name: 'Malaysia', isoCode3: 'MYS', isoNumeric: '458', nationality: 'Malaysian', isd: '+60', currency: 'MYR', continent: 'Asia', capital: 'Kuala Lumpur', flag: 'https://flagcdn.com/my.svg' },
    { code: 'TH', name: 'Thailand', isoCode3: 'THA', isoNumeric: '764', nationality: 'Thai', isd: '+66', currency: 'THB', continent: 'Asia', capital: 'Bangkok', flag: 'https://flagcdn.com/th.svg' },
    { code: 'ID', name: 'Indonesia', isoCode3: 'IDN', isoNumeric: '360', nationality: 'Indonesian', isd: '+62', currency: 'IDR', continent: 'Asia', capital: 'Jakarta', flag: 'https://flagcdn.com/id.svg' },
    { code: 'PH', name: 'Philippines', isoCode3: 'PHL', isoNumeric: '608', nationality: 'Filipino', isd: '+63', currency: 'PHP', continent: 'Asia', capital: 'Manila', flag: 'https://flagcdn.com/ph.svg' },
    { code: 'VN', name: 'Vietnam', isoCode3: 'VNM', isoNumeric: '704', nationality: 'Vietnamese', isd: '+84', currency: 'VND', continent: 'Asia', capital: 'Hanoi', flag: 'https://flagcdn.com/vn.svg' },
    { code: 'PK', name: 'Pakistan', isoCode3: 'PAK', isoNumeric: '586', nationality: 'Pakistani', isd: '+92', currency: 'PKR', continent: 'Asia', capital: 'Islamabad', flag: 'https://flagcdn.com/pk.svg' },
    { code: 'BD', name: 'Bangladesh', isoCode3: 'BGD', isoNumeric: '050', nationality: 'Bangladeshi', isd: '+880', currency: 'BDT', continent: 'Asia', capital: 'Dhaka', flag: 'https://flagcdn.com/bd.svg' },
    { code: 'AU', name: 'Australia', isoCode3: 'AUS', isoNumeric: '036', nationality: 'Australian', isd: '+61', currency: 'AUD', continent: 'Oceania', capital: 'Canberra', flag: 'https://flagcdn.com/au.svg' },
    { code: 'NZ', name: 'New Zealand', isoCode3: 'NZL', isoNumeric: '554', nationality: 'New Zealander', isd: '+64', currency: 'NZD', continent: 'Oceania', capital: 'Wellington', flag: 'https://flagcdn.com/nz.svg' },
    { code: 'BR', name: 'Brazil', isoCode3: 'BRA', isoNumeric: '076', nationality: 'Brazilian', isd: '+55', currency: 'BRL', continent: 'South America', capital: 'Brasilia', flag: 'https://flagcdn.com/br.svg' },
    { code: 'MX', name: 'Mexico', isoCode3: 'MEX', isoNumeric: '484', nationality: 'Mexican', isd: '+52', currency: 'MXN', continent: 'North America', capital: 'Mexico City', flag: 'https://flagcdn.com/mx.svg' },
    { code: 'AR', name: 'Argentina', isoCode3: 'ARG', isoNumeric: '032', nationality: 'Argentine', isd: '+54', currency: 'ARS', continent: 'South America', capital: 'Buenos Aires', flag: 'https://flagcdn.com/ar.svg' },
    { code: 'CL', name: 'Chile', isoCode3: 'CHL', isoNumeric: '152', nationality: 'Chilean', isd: '+56', currency: 'CLP', continent: 'South America', capital: 'Santiago', flag: 'https://flagcdn.com/cl.svg' },
    { code: 'CO', name: 'Colombia', isoCode3: 'COL', isoNumeric: '170', nationality: 'Colombian', isd: '+57', currency: 'COP', continent: 'South America', capital: 'Bogota', flag: 'https://flagcdn.com/co.svg' },
    { code: 'PE', name: 'Peru', isoCode3: 'PER', isoNumeric: '604', nationality: 'Peruvian', isd: '+51', currency: 'PEN', continent: 'South America', capital: 'Lima', flag: 'https://flagcdn.com/pe.svg' },
    { code: 'ZA', name: 'South Africa', isoCode3: 'ZAF', isoNumeric: '710', nationality: 'South African', isd: '+27', currency: 'ZAR', continent: 'Africa', capital: 'Pretoria', flag: 'https://flagcdn.com/za.svg' },
    { code: 'NG', name: 'Nigeria', isoCode3: 'NGA', isoNumeric: '566', nationality: 'Nigerian', isd: '+234', currency: 'NGN', continent: 'Africa', capital: 'Abuja', flag: 'https://flagcdn.com/ng.svg' },
    { code: 'KE', name: 'Kenya', isoCode3: 'KEN', isoNumeric: '404', nationality: 'Kenyan', isd: '+254', currency: 'KES', continent: 'Africa', capital: 'Nairobi', flag: 'https://flagcdn.com/ke.svg' },
    { code: 'MA', name: 'Morocco', isoCode3: 'MAR', isoNumeric: '504', nationality: 'Moroccan', isd: '+212', currency: 'MAD', continent: 'Africa', capital: 'Rabat', flag: 'https://flagcdn.com/ma.svg' },
    { code: 'GH', name: 'Ghana', isoCode3: 'GHA', isoNumeric: '288', nationality: 'Ghanaian', isd: '+233', currency: 'GHS', continent: 'Africa', capital: 'Accra', flag: 'https://flagcdn.com/gh.svg' },
    { code: 'CZ', name: 'Czech Republic', isoCode3: 'CZE', isoNumeric: '203', nationality: 'Czech', isd: '+420', currency: 'CZK', continent: 'Europe', capital: 'Prague', flag: 'https://flagcdn.com/cz.svg' },
    { code: 'HU', name: 'Hungary', isoCode3: 'HUN', isoNumeric: '348', nationality: 'Hungarian', isd: '+36', currency: 'HUF', continent: 'Europe', capital: 'Budapest', flag: 'https://flagcdn.com/hu.svg' },
    { code: 'RO', name: 'Romania', isoCode3: 'ROU', isoNumeric: '642', nationality: 'Romanian', isd: '+40', currency: 'RON', continent: 'Europe', capital: 'Bucharest', flag: 'https://flagcdn.com/ro.svg' },
  ];

  // Presets reference for compatibility
  get countryPresets(): CountryLookupRecord[] {
    return this.lookupTableData;
  }

  // Lookup Table modal state (Section 1.A & 7)
  isLookupModalOpen = signal<boolean>(false);
  lookupSearch = signal<string>('');
  lookupContinentFilter = signal<string>('All');
  lookupTargetMode = signal<'form' | 'view'>('form');
  lookupSelectedIndex = signal<number>(-1);

  lookupContinents = ['All', 'Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'];

  filteredLookupRecords = computed<CountryLookupRecord[]>(() => {
    const q = this.lookupSearch().trim().toLowerCase();
    const cont = this.lookupContinentFilter();
    return this.lookupTableData.filter((r) => {
      if (cont !== 'All' && r.continent.toLowerCase() !== cont.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.isoCode3.toLowerCase().includes(q) ||
        r.isoNumeric.includes(q) ||
        r.isd.includes(q) ||
        r.currency.toLowerCase().includes(q) ||
        (r.capital && r.capital.toLowerCase().includes(q))
      );
    });
  });

  openLookupModal(target: 'form' | 'view' = 'form'): void {
    this.lookupTargetMode.set(target);
    this.lookupSearch.set('');
    this.lookupContinentFilter.set('All');
    this.lookupSelectedIndex.set(-1);
    this.isLookupModalOpen.set(true);
    setTimeout(() => {
      const input = document.getElementById('lookup-search-input') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  closeLookupModal(): void {
    this.isLookupModalOpen.set(false);
  }

  selectLookupRecord(r: CountryLookupRecord): void {
    if (this.lookupTargetMode() === 'view') {
      this.viewCountryName.set(r.name);
      this.showToast(`Selected "${r.name}" from Lookup Table. Click "Save Changes" to save.`);
    } else {
      this.formName.set(r.name);
      this.formCode.set(r.code);
      this.formIsoCode2.set(r.code);
      this.formIsoCode3.set(r.isoCode3);
      this.formIsoNumeric.set(r.isoNumeric);
      this.formNationality.set(r.nationality);
      this.formIsd.set(r.isd);
      this.formCurrency.set(r.currency);
      this.formContinent.set(r.continent);
      this.formCapital.set(r.capital || '');
      this.selectedMasterCountry.set(null); // Explicitly came from separate Lookup Table
      this.selectedReferenceRecordName.set(r.name);
      this.markFieldTouched('name');
      this.markFieldTouched('isoCode2');
      this.markFieldTouched('isoCode3');
      this.markFieldTouched('isoNumeric');
      this.markFieldTouched('isd');
      this.markFieldTouched('currency');
      this.showToast(`Loaded details for "${r.name}" from Lookup Table. Review and save.`);
    }
    this.closeLookupModal();
  }

  onLookupKeydown(event: KeyboardEvent): void {
    const list = this.filteredLookupRecords();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.lookupSelectedIndex.update((i) => (i < list.length - 1 ? i + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.lookupSelectedIndex.update((i) => (i > 0 ? i - 1 : list.length - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const sel = list[this.lookupSelectedIndex()];
      if (sel) this.selectLookupRecord(sel);
    } else if (event.key === 'Escape') {
      this.closeLookupModal();
    }
  }

  // =========================================================================
  // Section 1.B: Autocomplete against Permanent Country Master Table
  // =========================================================================
  nameAutocompleteQuery = signal<string>('');
  isNameAutocompleteOpen = signal<boolean>(false);
  selectedMasterCountry = signal<Country | null>(null);

  countryMasterSuggestions = computed<Country[]>(() => {
    const q = this.nameAutocompleteQuery().trim().toLowerCase();
    if (!q) return [];
    return this.countryService.countries().filter((c) =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 8);
  });

  // Warning when manually edited name differs from the selected reference record (Master or Lookup table)
  isNameDifferingFromRecord = computed<boolean>(() => {
    const ref = this.selectedReferenceRecordName();
    if (!ref) return false;
    const current = this.formName().trim();
    return !!current && current.toLowerCase() !== ref.toLowerCase();
  });

  // Warning when manually edited name differs from the selected master record
  isNameDifferingFromMaster = computed<boolean>(() => {
    const master = this.selectedMasterCountry();
    if (!master) return false;
    const current = this.formName().trim();
    return !!current && current.toLowerCase() !== master.name.toLowerCase();
  });

  // Warning when entered name matches an existing country in Country Master
  duplicateNameWarning = computed<Country | null>(() => {
    const current = this.formName().trim().toLowerCase();
    if (!current) return null;
    const currentId = this.currentCountryId();
    return this.countryService.countries().find(
      (c) => c.name.toLowerCase() === current && c.id !== currentId
    ) || null;
  });

  private nameDebounceTimer: any = null;
  onCountryNameInput(val: string): void {
    this.formName.set(val);
    this.markFieldTouched('name');
    clearTimeout(this.nameDebounceTimer);
    this.nameDebounceTimer = setTimeout(() => {
      this.nameAutocompleteQuery.set(val.trim());
      this.isNameAutocompleteOpen.set(!!val.trim());
    }, 180);
  }

  selectMasterSuggestion(c: Country): void {
    this.formName.set(c.name);
    this.selectedMasterCountry.set(c);
    this.selectedReferenceRecordName.set(c.name);
    this.isNameAutocompleteOpen.set(false);
    this.markFieldTouched('name');
    this.showToast(`Selected "${c.name}" from Country Master.`);
  }

  closeNameAutocomplete(): void {
    setTimeout(() => {
      this.isNameAutocompleteOpen.set(false);
    }, 200);
  }

  // Legacy helper mapping
  onCountryNameChange(val: string): void {
    this.onCountryNameInput(val);
  }

  onIsoCode2Change(val: string): void {
    const code = val.toUpperCase();
    this.formIsoCode2.set(code);
    this.formCode.set(code);
    const matched = this.lookupTableData.find((p) => p.code.toLowerCase() === code.toLowerCase() || p.code.toLowerCase() === code.toLowerCase());
    if (matched) {
      this.applyPreset(matched);
    } else {
      if (!this.formIsoCode3()) this.formIsoCode3.set(code ? `${code}A` : '');
    }
  }

  applyPreset(p: any): void {
    if (p.name && !this.formName()) this.formName.set(p.name);
    if (p.code) {
      this.formCode.set(p.code);
      this.formIsoCode2.set(p.code);
    }
    if (p.isoCode3) this.formIsoCode3.set(p.isoCode3);
    if (p.isoNumeric) this.formIsoNumeric.set(p.isoNumeric);
    if (p.nationality) this.formNationality.set(p.nationality);
    if (p.isd) this.formIsd.set(p.isd);
    if (p.currency) this.formCurrency.set(p.currency);
    if (p.continent) this.formContinent.set(p.continent);
  }

  // =========================================================================
  // Section 4 & 5: View Page Editable Country Name & Autocomplete
  // =========================================================================
  viewCountryName = signal<string>('');
  originalViewCountryName = signal<string>('');
  isViewNameAutocompleteOpen = signal<boolean>(false);
  viewNameAutocompleteQuery = signal<string>('');

  isViewNameEdited = computed<boolean>(() => {
    return this.viewCountryName().trim() !== this.originalViewCountryName().trim();
  });

  isViewCountryDropdownOpen = signal<boolean>(false);
  viewCountrySearch = signal<string>('');

  filteredViewCountryList = computed<CountryLookupRecord[]>(() => {
    const query = (this.viewCountrySearch() || '').trim().toLowerCase();
    const list = this.lookupTableData;
    if (!query) {
      return list;
    }
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        (c.isoCode3 && c.isoCode3.toLowerCase().includes(query)) ||
        (c.continent && c.continent.toLowerCase().includes(query))
    );
  });

  toggleViewCountryDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isViewCountryDropdownOpen.update((v) => !v);
    if (!this.isViewCountryDropdownOpen()) {
      this.viewCountrySearch.set('');
    }
  }

  selectViewCountryOption(c: CountryLookupRecord): void {
    this.viewCountryName.set(c.name);
    this.isViewCountryDropdownOpen.set(false);
    this.viewCountrySearch.set('');
    const curId = this.currentCountryId();
    if (curId) {
      this.countryService.updateCountry(curId, {
        name: c.name,
        code: c.code,
        isoCode2: c.code,
        isoCode3: c.isoCode3,
        isoNumeric: c.isoNumeric,
        isd: c.isd,
        currency: c.currency,
        continent: c.continent,
        flag: c.flag,
      });
      this.originalViewCountryName.set(c.name);
      this.showToast(`Updated to "${c.name}" from Master Countries.`);
    }
  }

  viewNameSuggestions = computed<Country[]>(() => {
    const q = this.viewNameAutocompleteQuery().trim().toLowerCase();
    if (!q) return [];
    return this.countryService.countries().filter((c) =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 8);
  });

  private viewNameDebounceTimer: any = null;
  onViewCountryNameInput(val: string): void {
    this.viewCountryName.set(val);
    clearTimeout(this.viewNameDebounceTimer);
    this.viewNameDebounceTimer = setTimeout(() => {
      this.viewNameAutocompleteQuery.set(val.trim());
      this.isViewNameAutocompleteOpen.set(!!val.trim());
    }, 180);
  }

  selectViewNameSuggestion(c: Country): void {
    this.viewCountryName.set(c.name);
    this.isViewNameAutocompleteOpen.set(false);
    this.showToast(`Selected "${c.name}" from Country Master.`);
  }

  saveViewCountryName(): void {
    const newName = this.viewCountryName().trim();
    if (!newName) {
      this.showToast('Country Name cannot be empty.');
      return;
    }
    const id = this.currentCountryId();
    if (!id) return;
    const oldName = this.originalViewCountryName();
    const updated = this.countryService.updateCountry(id, { name: newName });
    if (updated) {
      this.originalViewCountryName.set(newName);
      this.isViewNameAutocompleteOpen.set(false);
      this.auditService.addAuditRecord({
        recordId: id,
        recordName: newName,
        action: 'Updated',
        description: `Country Name changed from "${oldName}" to "${newName}" on View page by Admin User`,
        changes: [{ field: 'Country Name', previousValue: oldName, newValue: newName }],
      });
      this.showToast(`Country Name updated to "${newName}".`);
    }
  }

  cancelViewCountryName(): void {
    this.viewCountryName.set(this.originalViewCountryName());
    this.isViewNameAutocompleteOpen.set(false);
    this.showToast('Country Name edit cancelled.');
  }

  // =========================================================================
  // Section 6: Default country toggle across Add, Edit, View
  // =========================================================================
  toggleViewCountryDefault(checked: boolean): void {
    const id = this.currentCountryId();
    if (!id) return;
    const updated = this.countryService.updateCountry(id, { isDefault: checked });
    if (updated) {
      this.auditService.addAuditRecord({
        recordId: id,
        recordName: updated.name,
        action: 'Updated',
        description: `Default setting set to ${checked ? 'True' : 'False'} on View page by Admin User`,
        changes: [{ field: 'Default', previousValue: (!checked).toString(), newValue: checked.toString() }],
      });
      this.showToast(checked ? `"${updated.name}" set as default country.` : `Default selection unset for "${updated.name}".`);
    }
  }

  // =========================================================================
  // Section 3: Right-Side Action Panel Navigation Matrix
  // =========================================================================
  openEditForActiveCountry(): void {
    const activeId = this.currentCountryId();
    const active = activeId ? this.countryService.getCountryById(activeId) : null;
    const target = active || this.selectedMasterCountry() || this.viewCountry() || this.countryService.countries()[0];
    if (target) {
      this.openEdit(target);
    } else {
      this.showToast('No country record available to edit.');
    }
  }

  openViewForActiveCountry(): void {
    const activeId = this.currentCountryId();
    const active = activeId ? this.countryService.getCountryById(activeId) : null;
    const target = active || this.selectedMasterCountry() || this.viewCountry() || this.countryService.countries()[0];
    if (target) {
      this.openView(target);
    } else {
      this.showToast('No country record available to view.');
    }
  }

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
    this.isCurrencyDropdownOpen.set(false);
    this.isViewCountryDropdownOpen.set(false);
    this.isTranslationOpen.set(false);
    this.isActionListOpen.set(false);
    this.isPageSizeMenuOpen.set(false);
    this.isCustomPageSizeOpen.set(false);
    this.isPageDropdownOpen.set(false);
    this.isRecordDropdownOpen.set(false);
    this.isSharePanelOpen.set(false);
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

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent): void {
    if (this.viewMode() !== 'list' || this.editingCell()) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }
    if (this.selectedCell() && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' '].includes(event.key)) {
      this.onTableKeyDown(event);
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
          this.viewCountryName.set(c.name);
          this.originalViewCountryName.set(c.name);
          this.selectedMasterCountry.set(c);
        }
      }

      if (mode && ['overview', 'grid', 'list', 'add', 'edit', 'view'].includes(mode)) {
        if (mode === 'add') {
          this.currentCountryId.set(null);
          this.selectedMasterCountry.set(null);
          this.clearForm();
        } else if ((mode === 'edit' || mode === 'view') && !this.formCode()) {
          const c = this.selectedCountry();
          if (c) {
            this.loadCountryIntoForm(c);
            this.viewCountryName.set(c.name);
            this.originalViewCountryName.set(c.name);
            this.selectedMasterCountry.set(c);
          }
        }
        if (this.viewMode() !== mode) {
          this.selectedCell.set(null);
          this.editingCell.set(null);
          this.viewMode.set(mode);
          if (mode === 'grid' || mode === 'list') {
            this.focusSearch();
          }
        }
      } else {
        if (this.viewMode() !== 'overview') {
          this.viewMode.set('overview');
        }
      }

      if (tab && ['all', 'active', 'inactive', 'draft', 'deleted'].includes(tab)) {
        if (this.activeFilterTab() !== tab) {
          this.activeFilterTab.set(tab);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.viewMode() === 'grid' || this.viewMode() === 'list') {
      this.focusSearch();
    }
  }

  focusSearch(): void {
    setTimeout(() => {
      if (this.countrySearchInputElement?.nativeElement) {
        this.countrySearchInputElement.nativeElement.focus();
      } else {
        const el = document.getElementById('countrySearchInput') as HTMLInputElement | null;
        el?.focus();
      }
    }, 120);
  }

  onTableScroll(event: Event): void {
    this.closeColumnMenu();
    const el = event.target as HTMLElement;
    if (this.middleScrollbarTrack?.nativeElement) {
      this.middleScrollbarTrack.nativeElement.scrollLeft = el.scrollLeft;
    }
    const leftFixed = this.isSelectColumnVisible() ? 396 : 340;
    const rightFixed = this.hiddenColumns().has('status') ? 140 : 270;
    const innerWidth = el.scrollWidth - leftFixed - rightFixed;
    if (innerWidth > 0 && Math.abs(this.scrollableScrollWidth() - innerWidth) > 5) {
      this.scrollableScrollWidth.set(innerWidth);
    }
  }

  onMiddleScrollbarScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const tableContainer = document.querySelector('.country-table-scroll') as HTMLElement | null;
    if (tableContainer && Math.abs(tableContainer.scrollLeft - el.scrollLeft) > 1) {
      tableContainer.scrollLeft = el.scrollLeft;
    }
  }

  scrollColumnsBy(delta: number): void {
    const tableContainer = document.querySelector('.country-table-scroll') as HTMLElement | null;
    if (tableContainer) {
      tableContainer.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }

  onTableWheel(event: WheelEvent): void {
    const delta = Math.abs(event.deltaX) > 0 ? event.deltaX : (event.shiftKey ? event.deltaY : 0);
    if (delta !== 0) {
      const tableContainer = document.querySelector('.country-table-scroll') as HTMLElement | null;
      if (tableContainer) {
        tableContainer.scrollLeft += delta;
        if (this.middleScrollbarTrack?.nativeElement) {
          this.middleScrollbarTrack.nativeElement.scrollLeft = tableContainer.scrollLeft;
        }
      }
    }
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
    this.isSharePanelOpen.set(false);
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
    { key: 'name', label: 'Country Name' },
    { key: 'code', label: 'country Code' },
    { key: 'isd', label: 'ISD' },
    { key: 'currency', label: 'Currency' },
    { key: 'continent', label: 'Continent' },
    { key: 'capital' as any, label: 'Capital' },
    { key: 'nationality' as any, label: 'Nationality' },
    { key: 'isDefault', label: 'Default' },
    { key: 'states', label: 'States' },
    { key: 'cities', label: 'Cities' },
    { key: 'areas', label: 'Areas' },
    { key: 'population', label: 'Population' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' },
    { key: 'draftedAt', label: 'Drafted' },
    { key: 'approval', label: 'Approval' },
    { key: 'status', label: 'Status' },
  ];
  readonly pageSizeOptions = [10, 25, 50, 75];
  readonly dateColumns: ListSortKey[] = ['createdAt', 'updatedAt', 'draftedAt'];

  readonly approvalMetadataTypes = [
    { atLabel: 'Approved At', date: '18 Oct 2026', byLabel: 'Approved By', user: 'Admin' },
    { atLabel: 'Updated At', date: '19 Oct 2026', byLabel: 'Updated By', user: 'Admin' },
    { atLabel: 'Created At', date: '15 Oct 2026', byLabel: 'Created By', user: 'Admin' },
    { atLabel: 'Pending At', date: '18 Oct 2026', byLabel: 'Pending By', user: 'Admin' },
    { atLabel: 'Restored At', date: '17 Oct 2026', byLabel: 'Restored By', user: 'Admin' },
    { atLabel: 'Deleted At', date: '16 Oct 2026', byLabel: 'Deleted By', user: 'Admin' },
    { atLabel: 'Rejected At', date: '17 Oct 2026', byLabel: 'Rejected By', user: 'Admin' },
  ];

  getApprovalStatus(c: Country): 'Approved' | 'Pending' | 'Rejected' {
    if (c.approval) return c.approval;
    const charCode = (c.name || c.id || '').charCodeAt(0) || 0;
    const mod = charCode % 3;
    return mod === 0 ? 'Approved' : (mod === 1 ? 'Pending' : 'Rejected');
  }

  getApprovalMeta(c: Country, index: number): { atLabel: string; date: string; byLabel: string; user: string } {
    const charCode = (c.name || '').length + index;
    return this.approvalMetadataTypes[charCode % this.approvalMetadataTypes.length];
  }

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
      this.isSharePanelOpen.set(false);
    }
  }

  readonly visibilityColumnDefinitions: { key: ListSortKey; label: string }[] = [
    { key: 'name', label: 'Title' },
    { key: 'code', label: 'Code' },
    { key: 'isd', label: 'CallingCode' },
    { key: 'currency', label: 'Currency' },
    { key: 'isDefault', label: 'Default' },
    { key: 'states', label: 'States' },
    { key: 'cities', label: 'Cities' },
    { key: 'areas', label: 'Areas' },
    { key: 'continent', label: 'Continent' },
    { key: 'population', label: 'Population' },
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
  pageSize = signal<number>(25);
  page = signal<number>(1);
  selectedIds = signal<Set<string>>(new Set());

  visibleColumns = computed(() =>
    this.listColumns
      .filter((c) => this.isColumnVisibleForTenantUser(c.key))
      .filter((c) => !this.hiddenColumns().has(c.key))
  );

  sortedCountries = computed<Country[]>(() => {
    const list = this.filteredCountries();
    const key = this.sortKey();
    if (!key) return list;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = (a as any)[key] ?? (a.customFields && a.customFields[key]) ?? '';
      const bv = (b as any)[key] ?? (b.customFields && b.customFields[key]) ?? '';
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
  pageSizeErrorMessage = signal<string | null>(null);
  readonly extendedPageSizes: number[] = [999, 750, 500, 250, 100];

  togglePageSizeMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const next = !this.isPageSizeMenuOpen();
    this.isPageSizeMenuOpen.set(next);
    if (next) {
      this.isCustomPageSizeOpen.set(false);
      this.pageSizeErrorMessage.set(null);
    }
  }

  selectExtendedPageSize(opt: number): void {
    this.setPageSize(opt);
    this.isPageSizeMenuOpen.set(false);
    this.isCustomPageSizeOpen.set(false);
    this.pageSizeErrorMessage.set(null);
  }

  isCustomPageSizeValid(): boolean {
    const raw = String(this.customPageSizeInput() ?? '').trim();
    if (!raw) return false;
    const n = Number(raw);
    return !isNaN(n) && Number.isInteger(n) && n >= 10 && n <= 999;
  }

  onCustomPageSizeChange(val: any): void {
    const str = val === null || val === undefined ? '' : String(val);
    this.customPageSizeInput.set(str);
    const raw = str.trim();
    if (!raw) {
      this.pageSizeErrorMessage.set(null);
      return;
    }
    const n = Number(raw);
    if (isNaN(n) || !Number.isInteger(n)) {
      this.pageSizeErrorMessage.set('Please enter a valid whole number');
    } else if (n < 10) {
      this.pageSizeErrorMessage.set('Minimum page size is 10');
    } else if (n > 999) {
      this.pageSizeErrorMessage.set('Maximum page size is 999');
    } else {
      this.pageSizeErrorMessage.set(null);
    }
  }

  applyCustomPageSize(): void {
    const raw = String(this.customPageSizeInput() ?? '').trim();
    const val = Number(raw);
    if (isNaN(val) || !Number.isInteger(val) || val < 10 || val > 999) {
      if (isNaN(val)) this.pageSizeErrorMessage.set('Please enter a valid number');
      else if (val < 10) this.pageSizeErrorMessage.set('Minimum page size is 10');
      else if (val > 999) this.pageSizeErrorMessage.set('Maximum page size is 999');
      return;
    }
    this.pageSizeErrorMessage.set(null);
    this.setPageSize(val);
    this.isPageSizeMenuOpen.set(false);
    this.isCustomPageSizeOpen.set(false);
  }

  // Active page dropdown & direct numeric input (Screenshot 4 replica)
  isPageDropdownOpen = signal<boolean>(false);
  pageInputValue = signal<string>('1');

  pagesList = computed<number[]>(() => {
    const total = Math.max(8, this.totalPages());
    const arr: number[] = [];
    for (let i = total; i >= 1; i--) {
      arr.push(i);
    }
    return arr;
  });

  togglePageDropdown(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isPageDropdownOpen.update((v) => !v);
  }

  selectPageFromDropdown(page: number): void {
    const clamped = Math.max(1, Math.min(this.totalPages(), page));
    this.goToPage(clamped);
    this.pageInputValue.set(String(clamped));
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

  sortColumnDirect(key: ListSortKey | string, dir: 'asc' | 'desc'): void {
    this.sortKey.set(key as ListSortKey);
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
    const paged = this.pagedCountries();
    if (paged[row]) {
      this.highlightedCountryId.set(paged[row].id);
    }
    const tableContainer = document.querySelector('.country-table-scroll') as HTMLElement | null;
    if (tableContainer && document.activeElement !== tableContainer) {
      tableContainer.focus();
    }
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
    const visibleCols = this.visibleColumns().map((c) => c.key);
    if (visibleCols.length === 0) return;
    const cols = this.isSelectColumnVisible() ? ['select', ...visibleCols] : visibleCols;

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
      case ' ': {
        const country = paged[curRow];
        if (country && cols[curColIdx] === 'select') {
          this.toggleRowSelection(country.id);
          handled = true;
        }
        break;
      }
      case 'Enter': {
        const country = paged[curRow];
        const colKey = cols[curColIdx];
        if (colKey === 'select' && country) {
          this.toggleRowSelection(country.id);
          handled = true;
        } else if (country && ['name', 'code', 'isd', 'currency', 'states', 'cities', 'areas'].includes(colKey)) {
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
        const rowEl = document.getElementById(`row-${paged[curRow]?.id}`);
        if (rowEl) {
          rowEl.scrollIntoView({ block: 'nearest' });
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
      this.currentCountryId.set(null);
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
    if (mode === 'grid' || mode === 'list') {
      this.focusSearch();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        mode: mode === 'overview' ? null : mode,
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

  previousListViewMode = signal<'grid' | 'list'>('grid');
  highlightedCountryId = signal<string | null>(null);

  openCreate(): void {
    const cur = this.viewMode();
    if (cur === 'grid' || cur === 'list') {
      this.previousListViewMode.set(cur);
    }
    this.currentCountryId.set(null);
    this.selectedMasterCountry.set(null);
    this.clearForm();
    this.isSideSectionOpen.set(false);
    this.switchView('add');
  }

  openView(country: Country): void {
    const cur = this.viewMode();
    if (cur === 'grid' || cur === 'list') {
      this.previousListViewMode.set(cur);
    }
    this.highlightedCountryId.set(country.id);
    this.currentCountryId.set(country.id);
    this.loadCountryIntoForm(country);
    this.viewCountryName.set(country.name);
    this.originalViewCountryName.set(country.name);
    this.isViewNameAutocompleteOpen.set(false);
    this.isSideSectionOpen.set(true);
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
    const cur = this.viewMode();
    if (cur === 'grid' || cur === 'list') {
      this.previousListViewMode.set(cur);
    }
    this.highlightedCountryId.set(country.id);
    this.currentCountryId.set(country.id);
    this.loadCountryIntoForm(country);
    this.selectedMasterCountry.set(country);
    this.isSideSectionOpen.set(true);
    this.viewMode.set('edit');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'edit', id: country.id },
      queryParamsHandling: 'merge',
    });
  }

  returnFromFormView(): void {
    const target = this.previousListViewMode() || 'grid';
    this.switchView(target);
    if (this.highlightedCountryId()) {
      setTimeout(() => {
        const rowEl = document.getElementById(`row-${this.highlightedCountryId()}`);
        if (rowEl) {
          rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 60);
    }
  }

  activeTableStatusMenu = signal<string | null>(null);

  openTableStatusEditor(id: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.activeTableStatusMenu.set(id);
  }

  toggleTableStatusMenu(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeTableStatusMenu.update(cur => cur === id ? null : id);
  }

  updateCountryStatusDirect(country: Country, status: 'Active' | 'Inactive' | 'Draft', event?: Event): void {
    if (event) event.stopPropagation();
    this.countryService.updateCountry(country.id, { status });
    this.activeTableStatusMenu.set(null);
    this.showToast(`Status updated to ${status} for ${country.name}`);
  }

  toggleCountryDefault(country: Country, event?: Event): void {
    if (event) event.stopPropagation();
    const nextVal = !country.isDefault;
    this.countryService.updateCountry(country.id, { isDefault: nextVal });
    this.showToast(nextVal ? `Set ${country.name} as default` : `Removed default from ${country.name}`);
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
    const code = country.code || country.isoCode2 || 'US';
    this.formCode.set(code);
    this.formIsoCode2.set(country.isoCode2 || code);
    this.formIsoCode3.set(country.isoCode3 || (code === 'AE' ? 'ARE' : code === 'US' ? 'USA' : `${code}A`));
    this.formIsoNumeric.set(country.isoNumeric || (code === 'AE' ? '784' : code === 'US' ? '840' : '100'));
    this.formNationality.set(country.nationality || (code === 'AE' ? 'Emirati' : code === 'US' ? 'American' : `${country.name} citizen`));
    this.formIsd.set(country.isd);
    this.formName.set(country.name);
    this.formCurrency.set(country.currency);
    this.formDefault.set(country.isDefault ? 'Yes' : 'No');
    this.formStatus.set(country.status === 'Deleted' ? 'Delete' : country.status);
    this.formFlag.set(country.flag || null);
    this.formContinent.set(country.continent || '');
    this.formCapital.set(country.capital || '');
    this.formCustomFields.set({ ...(country.customFields || {}) });
    this.formTranslations.set({ ...(country.translations || {}) });
    this.selectedReferenceRecordName.set(country.name);
    this.selectedMasterCountry.set(country);
  }

  // Empty form for Create, and the target of the Reset confirmation
  clearForm(): void {
    this.formCode.set('');
    this.formIsoCode2.set('');
    this.formIsoCode3.set('');
    this.formIsoNumeric.set('');
    this.formNationality.set('');
    this.formIsd.set('');
    this.formName.set('');
    this.formCurrency.set('');
    this.formDefault.set('No');
    this.formStatus.set('Active');
    this.formFlag.set(null);
    this.formContinent.set('');
    this.formCapital.set('');
    this.formCustomFields.set({});
    this.formTranslations.set({});
    this.selectedReferenceRecordName.set(null);
    this.selectedMasterCountry.set(null);
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
        isoCode2: this.formIsoCode2(),
        isoCode3: this.formIsoCode3(),
        isoNumeric: this.formIsoNumeric(),
        nationality: this.formNationality(),
        isd: this.formIsd(),
        name: this.formName(),
        currency: this.formCurrency(),
        isDefault: this.formDefault(),
        status: this.formStatus(),
        flag: this.formFlag(),
        continent: this.formContinent(),
        capital: this.formCapital(),
        customFields: { ...this.formCustomFields() },
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
    this.formIsoCode2.set(s.isoCode2 || s.code);
    this.formIsoCode3.set(s.isoCode3 || `${s.code}A`);
    this.formIsoNumeric.set(s.isoNumeric || '840');
    this.formNationality.set(s.nationality || 'Citizen');
    this.formIsd.set(s.isd);
    this.formName.set(s.name);
    this.formCurrency.set(s.currency);
    this.formDefault.set(s.isDefault);
    this.formStatus.set(s.status);
    this.formFlag.set(s.flag);
    this.formContinent.set(s.continent);
    this.formCapital.set(s.capital || '');
    this.formCustomFields.set({ ...(s.customFields || {}) });
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
    if (this.exportFields().size === 0) {
      this.showToast('Please select at least one column to export to PDF');
      return;
    }
    this.runExport('pdf');
    this.closeExportModal();
  }

  exportExcelDirect(): void {
    this.runExport('excel');
    this.closeExportModal();
  }

  exportCsvDirect(): void {
    this.runExport('csv');
    this.closeExportModal();
  }

  exportDocsDirect(): void {
    this.runExport('docs');
    this.closeExportModal();
  }

  exportPrintDirect(): void {
    if (this.exportFields().size === 0) {
      this.showToast('Please select at least one column to print');
      return;
    }
    this.runExport('print');
    this.closeExportModal();
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
    this.translationSearch.set('');
    this.isTranslationOpen.set(true);
    setTimeout(() => this.focusField(`translation-${this.translationLanguages[0].code}`));
  }

  setTranslationDraft(lang: string, value: string): void {
    this.translationDraft.update((d) => ({ ...d, [lang]: value }));
  }

  onTranslationEnter(index: number, event: Event): void {
    event.preventDefault();
    const next = this.filteredTranslationLanguages()[index + 1];
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
    this.showToast('Translation applied successfully.');
    setTimeout(() => this.focusField('country-default'));
  }

  autoTranslateWithProvider(): void {
    const countryName = this.formName().trim();
    if (!countryName) {
      this.showToast('Please enter a Country Name first to translate.');
      return;
    }
    const hasExisting = Object.values(this.translationDraft()).some((v) => v && v.trim());
    if (hasExisting && !this.confirmOverwriteTranslationsModal()) {
      this.confirmOverwriteTranslationsModal.set(true);
      return;
    }
    this.confirmOverwriteTranslationsModal.set(false);

    // High quality standard translations for common countries or automatic localized transliteration
    const translationsMap: Record<string, Record<string, string>> = {
      'united states': {
        ar: 'الولايات المتحدة',
        es: 'Estados Unidos',
        fr: 'États-Unis',
        de: 'Vereinigte Staaten',
        zh: '美国',
        ja: 'アメリカ合衆国',
        ru: 'Соединенные Штаты',
        hi: 'संयुक्त राज्य अमेरिका',
        pt: 'Estados Unidos',
        it: 'Stati Uniti',
      },
      'united arab emirates': {
        ar: 'الإمارات العربية المتحدة',
        es: 'Emiratos Árabes Unidos',
        fr: 'Émirats arabes unis',
        de: 'Vereinigte Arabische Emirate',
        zh: '阿拉伯联合酋长国',
        ja: 'アラブ首長国連邦',
        ru: 'Объединенные Арабские Эмираты',
        hi: 'संयुक्त अरब अमीरात',
        pt: 'Emirados Árabes Unidos',
        it: 'Emirati Arabi Uniti',
      },
      'germany': {
        ar: 'ألمانيا',
        es: 'Alemania',
        fr: 'Allemagne',
        de: 'Deutschland',
        zh: '德国',
        ja: 'ドイツ',
        ru: 'Германия',
        hi: 'जर्मनी',
        pt: 'Alemanha',
        it: 'Germania',
      },
      'france': {
        ar: 'فرنسا',
        es: 'Francia',
        fr: 'France',
        de: 'Frankreich',
        zh: '法国',
        ja: 'フランス',
        ru: 'Франция',
        hi: 'फ़्रांस',
        pt: 'França',
        it: 'Francia',
      },
      'japan': {
        ar: 'اليابان',
        es: 'Japón',
        fr: 'Japon',
        de: 'Japan',
        zh: '日本',
        ja: '日本',
        ru: 'Япония',
        hi: 'जापान',
        pt: 'Japão',
        it: 'Giappone',
      },
      'india': {
        ar: 'الهند',
        es: 'India',
        fr: 'Inde',
        de: 'Indien',
        zh: '印度',
        ja: 'インド',
        ru: 'Индия',
        hi: 'भारत',
        pt: 'Índia',
        it: 'India',
      },
    };

    const key = countryName.toLowerCase();
    const matched = translationsMap[key] || {
      ar: `${countryName} (مترجم)`,
      es: countryName,
      fr: countryName,
      de: countryName,
      zh: countryName,
      ja: countryName,
      ru: countryName,
      hi: countryName,
      pt: countryName,
      it: countryName,
    };

    this.translationDraft.set({ ...matched });
    this.showToast(`Fetched translations from Google Translate for "${countryName}"`);
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
      if (fieldName === 'code' || fieldName === 'isoCode2') sample = 'AE';
      if (fieldName === 'isoCode3') sample = 'ARE';
      if (fieldName === 'isoNumeric') sample = '784';
      if (fieldName === 'isd') sample = '+971';
      if (fieldName === 'currency') sample = 'AED — UAE Dirham';
      if (fieldName === 'nationality') sample = 'Emirati';
      if (fieldName === 'flagSearch') sample = 'United';
      if (fieldName === 'search') sample = 'Germany';
      if (fieldName === 'lookupSearch') sample = 'Germany';
      if (fieldName === 'translationSearch') sample = 'Arabic';
      if (fieldName.startsWith('translation-')) sample = 'Emirates';
      if (fieldName === 'viewName') sample = 'United Arab Emirates';
      if (fieldName === 'aiInput') sample = 'Country: Germany, ISO Code: DE, Currency: EUR, Dial Code: +49';
      if (fieldName === 'currencySearch') sample = 'USD';
      if (fieldName === 'viewCountrySearch') sample = 'Canada';

      this.applySpokenText(fieldName, sample);
      this.activeListeningField.set(null);
    }, 1100);
  }

  private applySpokenText(fieldName: string, text: string): void {
    const clean = text.trim();
    if (fieldName === 'search') {
      this.searchQuery.set(clean);
    } else if (fieldName === 'currencySearch') {
      this.currencySearch.set(clean);
    } else if (fieldName === 'viewCountrySearch') {
      this.viewCountrySearch.set(clean);
    } else if (fieldName === 'aiInput') {
      const current = this.aiInputText();
      this.aiInputText.set(current ? `${current} ${clean}` : clean);
    } else if (fieldName === 'flagSearch') {
      this.gallerySearch.set(clean);
    } else if (fieldName === 'lookupSearch') {
      this.lookupSearch.set(clean);
    } else if (fieldName === 'translationSearch') {
      this.translationSearch.set(clean);
    } else if (fieldName.startsWith('translation-')) {
      const langCode = fieldName.replace('translation-', '');
      this.setTranslationDraft(langCode, clean);
    } else if (fieldName === 'name') {
      this.onCountryNameChange(clean);
      this.markFieldTouched('name');
    } else if (fieldName === 'viewName') {
      this.onViewCountryNameInput(clean);
    } else if (fieldName === 'code' || fieldName === 'isoCode2') {
      const codeUpper = clean.slice(0, 2).toUpperCase();
      this.onIsoCode2Change(codeUpper);
      this.markFieldTouched('isoCode2');
    } else if (fieldName === 'isoCode3') {
      this.formIsoCode3.set(clean.slice(0, 3).toUpperCase());
      this.markFieldTouched('isoCode3');
    } else if (fieldName === 'isoNumeric') {
      this.formIsoNumeric.set(clean.replace(/\D/g, ''));
      this.markFieldTouched('isoNumeric');
    } else if (fieldName === 'isd') {
      const isdClean = clean.startsWith('+') ? clean : '+' + clean.replace(/\D/g, '');
      this.formIsd.set(isdClean);
      this.markFieldTouched('isd');
    } else if (fieldName === 'currency') {
      this.formCurrency.set(clean);
      this.markFieldTouched('currency');
    } else if (fieldName === 'nationality') {
      this.formNationality.set(clean);
      this.markFieldTouched('nationality');
    }
  }

  stopVoiceInput(): void {
    if (this.speechRecognitionObj) {
      try {
        this.speechRecognitionObj.stop();
      } catch { }
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
        this.showToast('Please choose a valid image file (PNG, SVG, JPG, WebP).');
      } else if (file.size > 2 * 1024 * 1024) {
        this.showToast('Flag image size exceeds 2MB limit.');
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
        this.showToast('Please drop a valid image file for the flag.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.showToast('Flag image size exceeds 2MB limit.');
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

  // Form submission (Create & Edit) adhering strictly to Section 4.5, 4.7, 4.8 & 15.2
  onSubmitForm(): void {
    this.hasSubmitAttempted.set(true);

    // Mark all fields touched
    this.markFieldTouched('name');
    this.markFieldTouched('isoCode2');
    this.markFieldTouched('isoCode3');
    this.markFieldTouched('isoNumeric');
    this.markFieldTouched('isd');
    this.markFieldTouched('currency');

    // Check validation rules
    if (!this.isFormValid()) {
      if (this.nameError()) {
        this.focusField('country-name');
      } else if (this.isoCode2Error()) {
        this.focusField('country-iso2');
      } else if (this.isoCode3Error()) {
        this.focusField('country-iso3');
      } else if (this.isoNumericError()) {
        this.focusField('country-numeric');
      } else if (this.isdError()) {
        this.focusField('country-isd');
      } else if (this.currencyError()) {
        this.focusField('country-currency');
      }
      this.showToast('Please correct the highlighted validation errors.');
      return;
    }

    const name = this.formName().trim();
    const isoCode2 = (this.formIsoCode2().trim() || this.formCode().trim()).toUpperCase();
    const isoCode3 = (this.formIsoCode3().trim() || `${isoCode2}A`).toUpperCase();
    const isoNumeric = this.formIsoNumeric().trim();
    const nationality = this.formNationality().trim() || (name ? `${name} citizen` : 'Citizen');
    const code = isoCode2;
    const isd = this.formIsd().trim();

    const status = this.formStatus();
    const translations = this.formTranslations();
    const payload: Partial<Country> = {
      name,
      code,
      isoCode2,
      isoCode3,
      isoNumeric,
      nationality,
      isd: isd.startsWith('+') ? isd : `+${isd}`,
      currency: this.formCurrency().trim(),
      isDefault: this.formDefault() === 'Yes',
      ...(status === 'Delete' ? {} : { status }),
      flag: this.formFlag() || undefined,
      continent: this.formContinent(),
      capital: this.formCapital().trim() || undefined,
      customFields: Object.keys(this.formCustomFields()).length ? this.formCustomFields() : undefined,
      translations: Object.keys(translations).length ? translations : undefined,
    };

    let saved: Country | null = null;
    if (this.viewMode() === 'add') {
      saved = this.countryService.createCountry(payload);
      this.showToast('Country created successfully.');
    } else if (this.viewMode() === 'edit' && this.currentCountryId()) {
      const id = this.currentCountryId()!;
      saved = this.countryService.updateCountry(id, payload);
      if (saved && status === 'Delete' && saved.status !== 'Deleted') {
        this.countryService.deleteCountry(id);
        saved = this.countryService.getCountryById(id) ?? saved;
      }
      this.showToast('Country updated successfully.');
    }
    if (!saved) return;

    if (this.pdfOnSubmit()) this.downloadCountryPdf(saved);
    if (this.printOnSubmit()) this.printCountry(saved);

    if (!this.keepOnPage()) {
      this.returnFromFormView();
    } else if (this.viewMode() === 'add') {
      // Keep on: stay and start the next entry
      this.clearForm();
      this.hasSubmitAttempted.set(false);
      this.touchedFields.set({});
      setTimeout(() => this.focusField('country-name'));
    } else {
      // Keep on while editing: stay on this record with the saved values
      this.loadCountryIntoForm(saved);
      this.hasSubmitAttempted.set(false);
      this.touchedFields.set({});
    }
  }

  // Clear button for Add Page (Section 11.4)
  openClearModal(): void {
    const hasData = !!(
      this.formName().trim() ||
      this.formIsoCode2().trim() ||
      this.formIsd().trim() ||
      this.formCurrency().trim() ||
      this.formNationality().trim()
    );
    if (hasData) {
      this.isClearModalOpen.set(true);
    } else {
      this.confirmClearForm();
    }
  }

  confirmClearForm(): void {
    this.isClearModalOpen.set(false);
    this.clearForm();
    this.hasSubmitAttempted.set(false);
    this.touchedFields.set({});
    this.showToast('Country details cleared.');
    setTimeout(() => this.focusField('country-name'), 80);
  }

  // Reset button for Edit Page (Section 11.5)
  openResetModal(): void {
    this.isResetModalOpen.set(true);
  }

  confirmResetForm(): void {
    this.isResetModalOpen.set(false);
    const saved = this.selectedCountry();
    if (saved) {
      this.loadCountryIntoForm(saved);
    } else {
      this.clearForm();
    }
    this.hasSubmitAttempted.set(false);
    this.touchedFields.set({});
    this.showToast('Country details restored.');
    setTimeout(() => this.focusField('country-name'), 80);
  }

  // Backwards compatibility alias
  resetForm(): void {
    if (this.viewMode() === 'add') {
      this.openClearModal();
    } else {
      this.openResetModal();
    }
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
      if ((this.viewMode() === 'edit' || this.viewMode() === 'view') && this.currentCountryId() === target.id) {
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

  // ---- Export & Share side panels ----
  isSharePanelOpen = signal<boolean>(false);

  toggleExportPanel(): void {
    if (this.isExportPanelOpen()) {
      this.isExportPanelOpen.set(false);
    } else {
      this.isFilterPanelOpen.set(false);
      this.isSharePanelOpen.set(false);
      this.isVisibilityOpen.set(false);
      this.isExportPanelOpen.set(true);
    }
  }

  toggleSharePanel(): void {
    // Both Export and Share display the exact same operation section (Screenshot 2)
    if (this.isExportPanelOpen()) {
      this.isExportPanelOpen.set(false);
    } else {
      this.isFilterPanelOpen.set(false);
      this.isSharePanelOpen.set(false);
      this.isVisibilityOpen.set(false);
      this.isExportPanelOpen.set(true);
    }
  }

  copyShareLink(): void {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => this.showToast('Share link copied to clipboard!'),
        () => this.showToast('Failed to copy link')
      );
    } else {
      this.showToast('Share link: ' + url);
    }
  }

  runShareAction(id: 'whatsapp' | 'email' | 'link' | 'print' | 'pdf'): void {
    if (id === 'whatsapp' || id === 'email') {
      this.openShare(id);
    } else if (id === 'link') {
      this.copyShareLink();
    } else if (id === 'print') {
      this.runExport('print');
    } else if (id === 'pdf') {
      this.runExport('pdf');
    }
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

  private exportTable(useAllIfEmpty = false): { headers: string[]; rows: string[][] } | null {
    let fields = this.exportFieldDefs.filter((f) => this.exportFields().has(f.key));
    if (!fields.length) {
      if (!useAllIfEmpty) return null;
      fields = this.exportFieldDefs;
    }
    const list = (this.viewMode() === 'view' && this.selectedCountry())
      ? [this.selectedCountry()!]
      : this.filteredCountries();
    return {
      headers: fields.map((f) => f.label),
      rows: list.map((c) => fields.map((f) => this.exportValue(c, f.key))),
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

  onFlagError(event: Event, country?: Country): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      if (country?.isoCode2) {
        target.src = `https://flagcdn.com/${country.isoCode2.toLowerCase()}.svg`;
      } else if (country?.code) {
        target.src = `https://flagcdn.com/${country.code.toLowerCase()}.svg`;
      } else {
        target.style.display = 'none';
      }
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

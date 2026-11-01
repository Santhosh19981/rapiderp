import {
  Component,
  inject,
  signal,
  computed,
  HostListener,
  ViewChild,
  ElementRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CityService } from './city.service';
import { CityMaster } from './city.models';
import { StateService } from '../state/state.service';
import { NavigationService } from '../../services/navigation.service';
import { AuditService } from '../../services/audit.service';
import { TenantService } from '../../services/tenant.service';

export type CityViewMode = 'grid' | 'list' | 'add' | 'edit' | 'view';

export interface SectionTab {
  id: string;
  name: string;
  shortName: string;
}

export interface CityFormFieldItem {
  id: string;
  label: string;
  section: string;
  tabId: string;
}

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './city.html',
  styleUrl: './city.css',
})
export class CityComponent implements OnInit {
  readonly Math = Math;
  public cityService = inject(CityService);
  public stateService = inject(StateService);
  public navService = inject(NavigationService);
  public auditService = inject(AuditService);
  public tenantService = inject(TenantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('fieldSearchInput') fieldSearchInputElement?: ElementRef<HTMLInputElement>;
  @ViewChild('tabsContainer') tabsContainerElement?: ElementRef<HTMLDivElement>;

  // View Mode
  viewMode = signal<CityViewMode>('grid');

  // Filter & Search Signals
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  countryFilter = signal<string>('all');
  stateFilter = signal<string>('all');
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  // Sorting
  sortColumn = signal<keyof CityMaster>('name');
  sortAsc = signal<boolean>(true);

  // Selection
  selectedIds = signal<Set<string>>(new Set<string>());

  // Form Signals
  editingCityId = signal<string | null>(null);
  formId = signal<string>('');
  formCode = signal<string>('');
  formName = signal<string>('');
  formNameAr = signal<string>('');
  formCountry = signal<string>('United Arab Emirates');
  formState = signal<string>('Dubai');
  formDescription = signal<string>('');
  formDefault = signal<'Yes' | 'No'>('No');
  formStatus = signal<'Active' | 'Inactive' | 'Draft'>('Active');
  formTranslations = signal<Record<string, string>>({});

  stayOnPage = signal<boolean>(true);
  activeTab = signal<string>('identity');
  activeDropdown = signal<string | null>(null);

  // Search in form ("Find field")
  fieldSearchQuery = signal<string>('');
  isFieldSearchOpen = signal<boolean>(false);
  isFieldVoiceListening = signal<boolean>(false);

  // Modals & Popups
  isResetModalOpen = signal<boolean>(false);
  isDeleteModalOpen = signal<boolean>(false);
  deleteTargetId = signal<string | null>(null);
  isTranslationModalOpen = signal<boolean>(false);

  // Action Panel Dock Page State (matching Item & Country vertical dock)
  actionPanelPage = signal<'top' | 'bottom'>('top');
  activeFilterTab = signal<string>('all');
  lastUpdatedTime = signal<string>('30 mins');
  lastDeletedTime = signal<string>('40 mins');

  scrollActionPanel(direction: 'up' | 'down'): void {
    this.actionPanelPage.set(direction === 'down' ? 'bottom' : 'top');
  }

  setFilterTab(tab: string): void {
    this.activeFilterTab.set(tab);
    if (tab === 'all') {
      this.statusFilter.set('all');
    } else if (tab === 'active') {
      this.statusFilter.set('Active');
    } else if (tab === 'inactive') {
      this.statusFilter.set('Inactive');
    } else if (tab === 'draft') {
      this.statusFilter.set('Draft');
    }
  }

  openEditForActiveCity(): void {
    const id = this.editingCityId();
    if (id) {
      const c = this.cityService.getCityById(id);
      if (c) this.openEdit(c);
    }
  }

  openViewForActiveCity(): void {
    const id = this.editingCityId();
    if (id) {
      const c = this.cityService.getCityById(id);
      if (c) this.openView(c);
    }
  }

  toggleCityStatus(c: CityMaster, event: MouseEvent): void {
    event.stopPropagation();
    const newStatus = c.status === 'Active' ? 'Inactive' : 'Active';
    this.cityService.updateCity(c.id, { status: newStatus });
    this.showToast(`City "${c.name}" is now ${newStatus}`, 'info');
  }

  openVideoTutorial(): void {
    this.showToast('Video Tutorial', 'info');
  }

  openHistoryModal(type?: string): void {
    this.showToast('City History', 'info');
  }

  openRecycleBinModal(): void {
    this.showToast('Recycle Bin', 'info');
  }

  openGuidanceTour(): void {
    this.showToast('Guidance Tour started', 'info');
  }

  openShareModalUnified(channel: string): void {
    this.showToast(`Sharing via ${channel}`, 'info');
  }

  // Toast
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('success');
  private toastTimer: any = null;

  // Options
  countryOptions = [
    'United Arab Emirates',
    'United States',
    'Canada',
    'India',
    'Australia',
    'United Kingdom',
    'Germany',
    'Saudi Arabia',
    'Oman',
    'Qatar',
    'Kuwait',
    'Bahrain',
  ];

  sectionTabs: SectionTab[] = [
    { id: 'identity', name: 'Identity & Codes', shortName: 'Identity' },
    { id: 'location', name: 'Location & Region', shortName: 'Location' },
    { id: 'additional', name: 'Additional Info', shortName: 'Additional' },
  ];

  formFieldItems: CityFormFieldItem[] = [
    { id: 'field-status', label: 'Status', section: 'General', tabId: 'general' },
    { id: 'field-nameEn', label: 'City Name (EN)', section: 'General', tabId: 'general' },
    { id: 'field-nameAr', label: 'اسم المدينة (بالعربية)', section: 'General', tabId: 'general' },
    { id: 'field-id', label: 'City ID', section: 'Essential', tabId: 'identity' },
    { id: 'field-code', label: 'City Code', section: 'Essential', tabId: 'identity' },
    { id: 'field-country', label: 'Country', section: 'Essential', tabId: 'location' },
    { id: 'field-state', label: 'State', section: 'Essential', tabId: 'location' },
    { id: 'field-default', label: 'Default City', section: 'Essential', tabId: 'additional' },
    { id: 'field-description', label: 'Description', section: 'Essential', tabId: 'additional' },
  ];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const mode = params.get('mode');
      const id = params.get('id');
      if (mode === 'add') {
        this.openCreate();
      } else if (mode === 'edit' && id) {
        const item = this.cityService.getCityById(id);
        if (item) this.openEdit(item);
      } else if (mode === 'view' && id) {
        const item = this.cityService.getCityById(id);
        if (item) this.openView(item);
      } else if (mode === 'list') {
        this.viewMode.set('list');
      } else {
        this.viewMode.set('grid');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-dropdown]') && !target.closest('.field-search-container')) {
      this.activeDropdown.set(null);
      this.isFieldSearchOpen.set(false);
    }
  }

  // Dynamic state options filtered by selected formCountry
  availableStatesForForm = computed(() => {
    const selectedCtry = this.formCountry();
    const allStates = this.stateService.states().filter((s) => s.status !== 'Deleted');
    if (!selectedCtry) return allStates.map((s) => s.name);
    const filtered = allStates.filter((s) => s.country.toLowerCase() === selectedCtry.toLowerCase());
    return filtered.length > 0 ? filtered.map((s) => s.name) : allStates.map((s) => s.name);
  });

  // Dynamic state options for Grid/List filter
  availableStatesForFilter = computed(() => {
    const selectedCtry = this.countryFilter();
    const allStates = this.stateService.states().filter((s) => s.status !== 'Deleted');
    if (selectedCtry === 'all') return allStates.map((s) => s.name);
    return allStates.filter((s) => s.country.toLowerCase() === selectedCtry.toLowerCase()).map((s) => s.name);
  });

  // Filtered Cities Computed
  filteredCities = computed(() => {
    let list = this.cityService.cities().filter((c) => c.status !== 'Deleted');
    const q = this.searchQuery().trim().toLowerCase();
    const st = this.statusFilter();
    const ctry = this.countryFilter();
    const stateVal = this.stateFilter();

    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.nameAr && c.nameAr.includes(q)) ||
          c.country.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q)
      );
    }

    if (st !== 'all') {
      list = list.filter((c) => c.status.toLowerCase() === st.toLowerCase());
    }

    if (ctry !== 'all') {
      list = list.filter((c) => c.country.toLowerCase() === ctry.toLowerCase());
    }

    if (stateVal !== 'all') {
      list = list.filter((c) => c.state.toLowerCase() === stateVal.toLowerCase());
    }

    // Sort
    const col = this.sortColumn();
    const asc = this.sortAsc();
    return list.slice().sort((a, b) => {
      const valA = (a[col] ?? '') as string;
      const valB = (b[col] ?? '') as string;
      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return asc ? comp : -comp;
    });
  });

  paginatedCities = computed(() => {
    const list = this.filteredCities();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  totalPages = computed(() => {
    const total = this.filteredCities().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  totalRecordsCount = computed(() => this.filteredCities().length);

  currentCityDisplayNumber = computed(() => {
    const currentId = this.editingCityId();
    if (!currentId) return 1;
    const list = this.filteredCities();
    const idx = list.findIndex((c) => c.id === currentId);
    return idx >= 0 ? idx + 1 : 1;
  });

  filteredFormFields = computed(() => {
    const q = this.fieldSearchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.formFieldItems.filter((f) => f.label.toLowerCase().includes(q) || f.section.toLowerCase().includes(q));
  });

  // Navigation & View changes
  switchView(mode: CityViewMode): void {
    this.viewMode.set(mode);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: mode === 'grid' ? null : mode, id: null },
      queryParamsHandling: 'merge',
    });
  }

  openCreate(): void {
    this.editingCityId.set(null);
    this.viewMode.set('add');
    this.resetFormFields();
    this.formId.set(this.cityService.generateCityId());
    this.formCode.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'add', id: null },
      queryParamsHandling: 'merge',
    });
  }

  openEdit(city: CityMaster): void {
    this.editingCityId.set(city.id);
    this.viewMode.set('edit');
    this.loadCityIntoForm(city);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'edit', id: city.id },
      queryParamsHandling: 'merge',
    });
  }

  openView(city: CityMaster): void {
    this.editingCityId.set(city.id);
    this.viewMode.set('view');
    this.loadCityIntoForm(city);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'view', id: city.id },
      queryParamsHandling: 'merge',
    });
  }

  switchToEditFromView(): void {
    if (this.editingCityId()) {
      this.viewMode.set('edit');
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { mode: 'edit', id: this.editingCityId() },
        queryParamsHandling: 'merge',
      });
    }
  }

  private loadCityIntoForm(city: CityMaster): void {
    this.formId.set(city.id);
    this.formCode.set(city.code);
    this.formName.set(city.name);
    this.formNameAr.set(city.nameAr || '');
    this.formCountry.set(city.country);
    this.formState.set(city.state);
    this.formDescription.set(city.description || '');
    this.formDefault.set(city.isDefault ? 'Yes' : 'No');
    this.formStatus.set(city.status === 'Deleted' ? 'Draft' : city.status);
    this.formTranslations.set(city.translations || {});
  }

  private resetFormFields(): void {
    this.formId.set('');
    this.formCode.set('');
    this.formName.set('');
    this.formNameAr.set('');
    this.formCountry.set('United Arab Emirates');
    this.formState.set('Dubai');
    this.formDescription.set('');
    this.formDefault.set('No');
    this.formStatus.set('Active');
    this.formTranslations.set({});
    this.activeTab.set('identity');
  }

  autoGenerateCode(): void {
    const code = this.cityService.generateCityCode(this.formName() || 'CT');
    this.formCode.set(code);
  }

  onCityNameInput(val: string): void {
    this.formName.set(val);
    if (!this.formCode() && val) {
      this.formCode.set(this.cityService.generateCityCode(val));
    }
  }

  toggleDropdown(name: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeDropdown.update((cur) => (cur === name ? null : name));
  }

  selectStatus(status: string): void {
    this.formStatus.set(status as 'Active' | 'Inactive' | 'Draft');
    this.activeDropdown.set(null);
  }

  selectCountry(country: string): void {
    this.formCountry.set(country);
    // Auto adjust state to first available in country
    const states = this.availableStatesForForm();
    if (states.length > 0 && !states.includes(this.formState())) {
      this.formState.set(states[0]);
    }
    this.activeDropdown.set(null);
  }

  selectState(stateName: string): void {
    this.formState.set(stateName);
    this.activeDropdown.set(null);
  }

  toggleDefault(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.formDefault.set(checked ? 'Yes' : 'No');
  }

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  scrollTabs(dir: 'left' | 'right'): void {
    if (this.tabsContainerElement) {
      const el = this.tabsContainerElement.nativeElement;
      const delta = dir === 'left' ? -180 : 180;
      el.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }

  goToPreviousCity(): void {
    const list = this.filteredCities();
    const currentId = this.editingCityId();
    const idx = list.findIndex((c) => c.id === currentId);
    if (idx > 0) {
      const prev = list[idx - 1];
      if (this.viewMode() === 'view') {
        this.openView(prev);
      } else {
        this.openEdit(prev);
      }
    }
  }

  goToNextCity(): void {
    const list = this.filteredCities();
    const currentId = this.editingCityId();
    const idx = list.findIndex((c) => c.id === currentId);
    if (idx >= 0 && idx < list.length - 1) {
      const next = list[idx + 1];
      if (this.viewMode() === 'view') {
        this.openView(next);
      } else {
        this.openEdit(next);
      }
    }
  }

  selectSearchField(field: CityFormFieldItem): void {
    if (field.tabId !== 'general') {
      this.activeTab.set(field.tabId);
    }
    this.isFieldSearchOpen.set(false);
    this.fieldSearchQuery.set('');
    setTimeout(() => {
      const el = document.getElementById(field.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-[#00a6f4]');
        setTimeout(() => el.classList.remove('ring-2', 'ring-[#00a6f4]'), 1500);
      }
    }, 100);
  }

  // Submit / Save Form
  onSubmitForm(): void {
    if (this.viewMode() === 'view') return;

    if (!this.formName().trim()) {
      this.showToast('Please enter City Name', 'error');
      return;
    }

    const payload: Partial<CityMaster> = {
      id: this.formId() || this.cityService.generateCityId(),
      code: this.formCode() || this.cityService.generateCityCode(this.formName()),
      name: this.formName().trim(),
      nameAr: this.formNameAr().trim(),
      country: this.formCountry(),
      state: this.formState(),
      description: this.formDescription().trim(),
      isDefault: this.formDefault() === 'Yes',
      status: this.formStatus(),
      translations: this.formTranslations(),
    };

    if (this.viewMode() === 'add') {
      const created = this.cityService.addCity(payload);
      this.showToast(`City "${created.name}" created successfully`, 'success');
      if (this.stayOnPage()) {
        this.resetFormFields();
        this.formId.set(this.cityService.generateCityId());
      } else {
        this.switchView('grid');
      }
    } else if (this.viewMode() === 'edit' && this.editingCityId()) {
      this.cityService.updateCity(this.editingCityId()!, payload);
      this.showToast(`City "${payload.name}" updated successfully`, 'success');
      if (!this.stayOnPage()) {
        this.switchView('grid');
      }
    }
  }

  openDeleteModal(id: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.deleteTargetId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (id) {
      this.cityService.deleteCity(id);
      this.showToast('City deleted successfully', 'info');
      this.isDeleteModalOpen.set(false);
      this.deleteTargetId.set(null);
      if (this.editingCityId() === id) {
        this.switchView('grid');
      }
    }
  }

  duplicateRecord(id: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const copy = this.cityService.duplicateCity(id);
    if (copy) {
      this.showToast(`City duplicated as "${copy.name}"`, 'success');
    }
  }

  confirmResetForm(): void {
    this.isResetModalOpen.set(true);
  }

  doResetForm(): void {
    if (this.editingCityId()) {
      const orig = this.cityService.getCityById(this.editingCityId()!);
      if (orig) this.loadCityIntoForm(orig);
    } else {
      this.resetFormFields();
      this.formId.set(this.cityService.generateCityId());
    }
    this.isResetModalOpen.set(false);
    this.showToast('Form reset to default', 'info');
  }

  openTranslationPopup(): void {
    this.isTranslationModalOpen.set(true);
  }

  saveTranslations(translations: Record<string, string>): void {
    this.formTranslations.set(translations);
    if (translations['ar']) {
      this.formNameAr.set(translations['ar']);
    }
    this.isTranslationModalOpen.set(false);
    this.showToast('Translations updated', 'success');
  }

  toggleSelectAll(): void {
    const cur = this.selectedIds();
    const all = this.paginatedCities().map((c) => c.id);
    const next = new Set(cur);
    const allSelected = all.every((id) => next.has(id));

    if (allSelected) {
      all.forEach((id) => next.delete(id));
    } else {
      all.forEach((id) => next.add(id));
    }
    this.selectedIds.set(next);
  }

  toggleSelect(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  simulateVoiceForField(field: string): void {
    this.showToast(`Listening for ${field}...`, 'info');
  }

  toggleFieldVoiceSearch(event: MouseEvent): void {
    event.stopPropagation();
    this.isFieldVoiceListening.update((v) => !v);
    if (this.isFieldVoiceListening()) {
      this.showToast('Listening... Speak a field name', 'info');
      setTimeout(() => this.isFieldVoiceListening.set(false), 3000);
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }

  openExportModal(): void {
    this.exportData('csv');
  }

  openAiModal(): void {
    this.showToast('AI Assistant ready to help with City data', 'info');
  }

  openClearModal(): void {
    this.confirmResetForm();
  }

  exportData(format: 'pdf' | 'csv' | 'xlsx' | 'print'): void {
    this.cityService.exportData(format, this.filteredCities());
    this.showToast(`Exporting cities as ${format.toUpperCase()}`, 'success');
  }
}

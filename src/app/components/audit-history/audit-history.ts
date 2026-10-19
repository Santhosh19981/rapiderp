import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditRecord } from '../../services/audit.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-audit-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-history.html',
  styleUrl: './audit-history.css',
})
export class AuditHistoryComponent {
  public auditService = inject(AuditService);
  public navService = inject(NavigationService);

  // UI state
  isFiltersExpanded = signal<boolean>(true);
  isExportDropdownOpen = signal<boolean>(false);
  isPageSizeMenuOpen = signal<boolean>(false);
  isCustomPageSizeOpen = signal<boolean>(false);
  customPageSizeInput = signal<string>('');
  pageSizeErrorMessage = signal<string>('');
  isPageDropdownOpen = signal<boolean>(false);
  pageInputValue = signal<number>(1);

  // Selection
  selectedIds = signal<Set<string>>(new Set());

  // Row Expansion (like Image 2 where row A-10042 is expanded with details)
  expandedRowId = signal<string | null>('A-10042');

  // Filter bindings
  searchQuery = signal<string>('');

  // Primary page size options
  pageSizeOptions = [10, 25, 50, 75];
  extendedPageSizes = [100, 200, 500];

  toggleFilters(): void {
    this.isFiltersExpanded.update((v) => !v);
  }

  toggleExportDropdown(): void {
    this.isExportDropdownOpen.update((v) => !v);
  }

  togglePageSizeMenu(event?: Event): void {
    if (event) event.stopPropagation();
    this.isPageSizeMenuOpen.update((v) => !v);
  }

  selectExtendedPageSize(size: number): void {
    this.auditService.setPageSize(size);
    this.isPageSizeMenuOpen.set(false);
    this.isCustomPageSizeOpen.set(false);
  }

  onCustomPageSizeChange(val: string): void {
    this.customPageSizeInput.set(val);
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 10 || n > 999) {
      this.pageSizeErrorMessage.set('Enter 10-999');
    } else {
      this.pageSizeErrorMessage.set('');
    }
  }

  isCustomPageSizeValid(): boolean {
    const n = parseInt(this.customPageSizeInput(), 10);
    return !isNaN(n) && n >= 10 && n <= 999;
  }

  applyCustomPageSize(): void {
    if (!this.isCustomPageSizeValid()) return;
    const n = parseInt(this.customPageSizeInput(), 10);
    this.auditService.setPageSize(n);
    this.isCustomPageSizeOpen.set(false);
    this.isPageSizeMenuOpen.set(false);
  }

  togglePageDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.isPageDropdownOpen.update((v) => !v);
  }

  onPageInputKey(val: string): void {
    const p = parseInt(val, 10);
    if (!isNaN(p)) {
      this.pageInputValue.set(p);
    }
  }

  commitPageInput(): void {
    const p = this.pageInputValue();
    const max = this.auditService.queryResults().totalPages;
    if (p >= 1 && p <= max) {
      this.goToPage(p);
    } else {
      this.pageInputValue.set(this.auditService.currentPage());
    }
    this.isPageDropdownOpen.set(false);
  }

  goToPage(p: number): void {
    this.auditService.setPage(p);
    this.pageInputValue.set(p);
  }

  firstPage(): void {
    this.goToPage(1);
  }

  prevPage(): void {
    this.goToPage(Math.max(1, this.auditService.currentPage() - 1));
  }

  nextPage(): void {
    const max = this.auditService.queryResults().totalPages;
    this.goToPage(Math.min(max, this.auditService.currentPage() + 1));
  }

  lastPage(): void {
    this.goToPage(this.auditService.queryResults().totalPages);
  }

  // Row selection
  isAllSelected(): boolean {
    const list = this.auditService.queryResults().records;
    if (!list.length) return false;
    return list.every((r) => this.selectedIds().has(r.id));
  }

  isPartlySelected(): boolean {
    const list = this.auditService.queryResults().records;
    if (!list.length) return false;
    const count = list.filter((r) => this.selectedIds().has(r.id)).length;
    return count > 0 && count < list.length;
  }

  toggleSelectAll(): void {
    const list = this.auditService.queryResults().records;
    const set = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      list.forEach((r) => set.delete(r.id));
    } else {
      list.forEach((r) => set.add(r.id));
    }
    this.selectedIds.set(set);
  }

  toggleSelect(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    const set = new Set(this.selectedIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.selectedIds.set(set);
  }

  // Row expansion (like in Image 2)
  toggleRowExpanded(r: AuditRecord, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.expandedRowId() === r.id) {
      this.expandedRowId.set(null);
      this.auditService.closeDetails();
    } else {
      this.expandedRowId.set(r.id);
      this.auditService.selectRecord(r);
    }
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.auditService.setSearch(val);
  }

  onModuleChange(val: string): void {
    this.auditService.setModule(val);
  }

  onActionChange(val: string): void {
    this.auditService.setAction(val);
  }

  onUserChange(val: string): void {
    this.auditService.setUser(val);
  }

  onCompanyChange(val: string): void {
    this.auditService.setCompanyBranch(val);
  }

  onFromDateChange(val: string): void {
    this.auditService.setFromDate(val);
  }

  onToDateChange(val: string): void {
    this.auditService.setToDate(val);
  }

  setPageSize(size: number): void {
    this.auditService.setPageSize(size);
  }

  onPageSizeChange(val: any): void {
    this.auditService.setPageSize(Number(val));
  }

  selectRecord(r: AuditRecord): void {
    this.expandedRowId.set(r.id);
    this.auditService.selectRecord(r);
  }

  closeDetails(): void {
    this.expandedRowId.set(null);
    this.auditService.closeDetails();
  }

  resetAllFilters(): void {
    this.searchQuery.set('');
    this.auditService.resetFilters();
    this.selectedIds.set(new Set());
  }

  // Sorting
  toggleSort(key: string): void {
    this.auditService.toggleSort(key);
  }

  // Exports
  exportCsv(): void {
    this.isExportDropdownOpen.set(false);
    this.auditService.exportToCsv();
  }

  exportExcel(): void {
    this.isExportDropdownOpen.set(false);
    this.auditService.exportToExcel();
  }

  exportPdf(): void {
    this.isExportDropdownOpen.set(false);
    this.auditService.exportToPdf();
  }

  printReport(): void {
    this.isExportDropdownOpen.set(false);
    this.auditService.printReport();
  }

  backToCountry(): void {
    this.navService.navigateTo('countries');
  }
}

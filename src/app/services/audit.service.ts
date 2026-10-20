import { Injectable, signal, computed } from '@angular/core';

export interface AuditChangeDetail {
  field: string;
  previousValue: string;
  newValue: string;
  referenceId?: string;
}

export interface AuditRecord {
  id: string; // e.g. 'A-10048'
  referenceId?: string; // e.g. 'H-003' or 'CNT-0001'
  timestamp: string; // '19 Oct 2026, 10:42:16'
  rawDate: string; // '2026-10-19T10:42:16'
  user: string; // 'Admin User', 'Sara Ahmed', 'Omar Hassan', 'System'
  module: string; // 'Country', 'Inventory', 'Sales', 'Authentication', 'Purchasing', 'Accounting'
  recordName: string; // 'United Arab Emirates', 'Item Master · SKU-1048', etc.
  recordId?: string;
  action: 'Created' | 'Updated' | 'Status Changed' | 'Deleted' | 'Restored' | 'Login';
  description?: string; // Short summary
  source: 'Web' | 'Mobile' | 'API' | 'System';
  status?: 'Active' | 'Inactive' | 'Draft' | 'Deleted';
  ipAddress?: string; // e.g. '192.0.2.22'
  companyBranch?: string; // 'Authorized scope', 'Head Office', 'Dubai Branch'
  changes?: AuditChangeDetail[];
}

export interface AuditFilterState {
  search: string;
  module: string;
  action: string;
  user: string;
  fromDate: string;
  toDate: string;
  companyBranch: string;
}

export interface AuditPaginationResult {
  records: AuditRecord[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  // Master immutable audit trail
  private masterAuditLog = signal<AuditRecord[]>([
    {
      id: 'A-10048',
      referenceId: 'SKU-1048',
      timestamp: '19 Oct 2026, 09:44:16',
      rawDate: '2026-10-19T09:44:16',
      user: 'Country',
      module: 'Country',
      recordName: 'Item Master - SKU-1048',
      recordId: '15',
      action: 'Updated',
      description: 'Record updated',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.22',
      companyBranch: 'Authorized scope',
      changes: [
        { field: 'Phone Dial Code', previousValue: '+971', newValue: '+971', referenceId: 'H-003' },
        { field: 'ISO Code3', previousValue: 'UAE', newValue: 'ARE', referenceId: 'H-003' },
      ],
    },
    {
      id: 'A-10043',
      referenceId: 'SKU-1048',
      timestamp: '19 Oct 2026, 22:15:52',
      rawDate: '2026-10-19T22:15:52',
      user: 'Sara Ahmed',
      module: 'Country',
      recordName: 'Item Master - SKU-1048',
      recordId: 'SKU-1048',
      action: 'Created',
      description: 'New country master item registered',
      source: 'Mobile',
      status: 'Active',
      ipAddress: '192.0.2.45',
      companyBranch: 'Dubai Branch',
      changes: [
        { field: 'Item Name', previousValue: '—', newValue: 'Country Item Master - SKU-1048', referenceId: 'INV-4091' },
      ],
    },
    {
      id: 'A-10042',
      referenceId: 'SKU-1048',
      timestamp: '19 Oct 2026, 09:30:10',
      rawDate: '2026-10-19T09:30:10',
      user: 'Country',
      module: 'Country',
      recordName: 'Item Master - SKU-1048',
      recordId: 'SKU-1048',
      action: 'Status Changed',
      description: 'Status changed from Active to Deleted',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.22',
      companyBranch: 'Authorized scope',
      changes: [
        { field: 'Status', previousValue: 'Active', newValue: 'Deleted', referenceId: 'SKU-1048' },
      ],
    },
    {
      id: 'A-10047',
      referenceId: 'INV-4091',
      timestamp: '19 Oct 2026, 10:35:02',
      rawDate: '2026-10-19T10:35:02',
      user: 'Sara Ahmed',
      module: 'Inventory',
      recordName: 'Item Master · SKU-1048',
      recordId: 'SKU-1048',
      action: 'Created',
      description: 'New inventory item registered',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.45',
      companyBranch: 'Dubai Branch',
      changes: [
        { field: 'Item Name', previousValue: '—', newValue: 'Industrial Roller Bearing 40mm', referenceId: 'INV-4091' },
        { field: 'Unit Price', previousValue: '—', newValue: '$45.00', referenceId: 'INV-4091' },
        { field: 'Opening Stock', previousValue: '—', newValue: '250 Units', referenceId: 'INV-4091' },
      ],
    },
    {
      id: 'A-10046',
      referenceId: 'CNT-0004',
      timestamp: '19 Oct 2026, 10:21:45',
      rawDate: '2026-10-19T10:21:45',
      user: 'Admin User',
      module: 'Country',
      recordName: 'Saudi Arabia',
      recordId: '4',
      action: 'Status Changed',
      description: 'Status changed from Inactive to Active',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.22',
      companyBranch: 'Authorized scope',
      changes: [
        { field: 'Status', previousValue: 'Inactive', newValue: 'Active', referenceId: 'CNT-0004' },
      ],
    },
    {
      id: 'A-10045',
      referenceId: 'SO-20881',
      timestamp: '19 Oct 2026, 09:58:31',
      rawDate: '2026-10-19T09:58:31',
      user: 'Omar Hassan',
      module: 'Sales',
      recordName: 'Sales Order · SO-20881',
      recordId: 'SO-20881',
      action: 'Updated',
      description: 'Sales Order quantity revised',
      source: 'Mobile',
      status: 'Active',
      ipAddress: '198.51.100.89',
      companyBranch: 'Abu Dhabi Branch',
      changes: [
        { field: 'Order Quantity', previousValue: '10 Units', newValue: '15 Units', referenceId: 'SO-20881' },
        { field: 'Total Amount', previousValue: '$4,500.00', newValue: '$6,750.00', referenceId: 'SO-20881' },
      ],
    },
    {
      id: 'A-10044',
      referenceId: 'AUTH-9912',
      timestamp: '19 Oct 2026, 09:41:07',
      rawDate: '2026-10-19T09:41:07',
      user: 'System',
      module: 'Authentication',
      recordName: 'User session - Admin User',
      recordId: 'USR-001',
      action: 'Login',
      description: 'Successful user authentication & JWT session issued',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.22',
      companyBranch: 'Authorized scope',
      changes: [
        { field: 'Session Token', previousValue: '[None]', newValue: '[Generated Masked Token]', referenceId: 'AUTH-9912' },
      ],
    },
    {
      id: 'A-10041',
      referenceId: 'PO-33012',
      timestamp: '18 Oct 2026, 16:20:10',
      rawDate: '2026-10-18T16:20:10',
      user: 'Omar Hassan',
      module: 'Purchasing',
      recordName: 'Purchase Order · PO-33012',
      recordId: 'PO-33012',
      action: 'Created',
      description: 'Purchase order created for Global Metals Ltd',
      source: 'Web',
      status: 'Active',
      ipAddress: '198.51.100.89',
      companyBranch: 'Dubai Branch',
      changes: [
        { field: 'Vendor', previousValue: '—', newValue: 'Global Metals Ltd', referenceId: 'PO-33012' },
        { field: 'Total Value', previousValue: '—', newValue: '$18,340.00', referenceId: 'PO-33012' },
      ],
    },
    {
      id: 'A-10041',
      referenceId: 'CNT-0002',
      timestamp: '18 Oct 2026, 14:10:00',
      rawDate: '2026-10-18T14:10:00',
      user: 'Admin User',
      module: 'Country',
      recordName: 'United Kingdom',
      recordId: '2',
      action: 'Updated',
      description: 'Default currency updated',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.22',
      companyBranch: 'Authorized scope',
      changes: [
        { field: 'Currency', previousValue: 'GBP', newValue: 'GBP — British Pound', referenceId: 'CNT-0002' },
      ],
    },
    {
      id: 'A-10040',
      referenceId: 'ACC-802',
      timestamp: '18 Oct 2026, 11:45:18',
      rawDate: '2026-10-18T11:45:18',
      user: 'System',
      module: 'Accounting',
      recordName: 'Journal Entry · JE-2026-118',
      recordId: 'JE-2026-118',
      action: 'Created',
      description: 'Automated depreciation posting',
      source: 'API',
      status: 'Active',
      ipAddress: '10.0.0.12',
      companyBranch: 'Head Office',
      changes: [
        { field: 'Debit Amount', previousValue: '—', newValue: '$3,200.00', referenceId: 'ACC-802' },
        { field: 'Credit Amount', previousValue: '—', newValue: '$3,200.00', referenceId: 'ACC-802' },
      ],
    },
    {
      id: 'A-10039',
      referenceId: 'CNT-0001',
      timestamp: '15 Oct 2026, 09:20:00',
      rawDate: '2026-10-15T09:20:00',
      user: 'Admin User',
      module: 'Country',
      recordName: 'United Arab Emirates',
      recordId: '15',
      action: 'Created',
      description: 'Country record created',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.22',
      companyBranch: 'Authorized scope',
      changes: [
        { field: 'Country Name', previousValue: '—', newValue: 'United Arab Emirates', referenceId: 'CNT-0001' },
        { field: 'ISO Code2', previousValue: '—', newValue: 'AE', referenceId: 'CNT-0001' },
        { field: 'ISO Code3', previousValue: '—', newValue: 'ARE', referenceId: 'CNT-0001' },
      ],
    },
    {
      id: 'A-10038',
      referenceId: 'AUTH-9850',
      timestamp: '15 Oct 2026, 08:55:12',
      rawDate: '2026-10-15T08:55:12',
      user: 'Sara Ahmed',
      module: 'Authentication',
      recordName: 'User session - Sara Ahmed',
      recordId: 'USR-002',
      action: 'Login',
      description: 'Successful user authentication',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.45',
      companyBranch: 'Dubai Branch',
    },
    {
      id: 'A-10037',
      referenceId: 'CNT-0010',
      timestamp: '14 Oct 2026, 16:30:22',
      rawDate: '2026-10-14T16:30:22',
      user: 'Admin User',
      module: 'Country',
      recordName: 'Japan',
      recordId: '10',
      action: 'Restored',
      description: 'Restored from Recycle Bin to Active status',
      source: 'Web',
      status: 'Active',
      ipAddress: '192.0.2.22',
      companyBranch: 'Authorized scope',
      changes: [
        { field: 'Status', previousValue: 'Deleted', newValue: 'Active', referenceId: 'CNT-0010' },
      ],
    },
  ]);

  // Overall statistics matching Image 4
  metrics = computed(() => {
    const list = this.masterAuditLog();
    const total = 1248; // Base enterprise baseline matching screenshot
    const updates = 486;
    const userActivity = 312;
    const deletes = 18;

    return {
      totalEvents: total + list.length - 12,
      updates: updates,
      userActivity: userActivity,
      deleteEvents: deletes,
    };
  });

  // Filter state
  filters = signal<AuditFilterState>({
    search: '',
    module: 'All Modules',
    action: 'All Actions',
    user: 'All Users',
    fromDate: '',
    toDate: '',
    companyBranch: 'All permitted...',
  });

  // Pagination state
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Sorting state
  sortKey = signal<string>('id');
  sortDir = signal<'asc' | 'desc'>('desc');

  // Selected record for details view
  selectedRecord = signal<AuditRecord | null>(null);

  // Available Filter Options
  moduleOptions = ['All Modules', 'Country', 'Inventory', 'Sales', 'Authentication', 'Purchasing', 'Accounting'];
  actionOptions = ['All Actions', 'Created', 'Updated', 'Status Changed', 'Deleted', 'Restored', 'Login'];
  userOptions = ['All Users', 'Country', 'Admin User', 'Sara Ahmed', 'Omar Hassan', 'System'];
  companyOptions = ['All permitted...', 'Authorized scope', 'Head Office', 'Dubai Branch', 'Abu Dhabi Branch', 'Sharjah Branch'];
  pageSizeOptions = [10, 25, 50, 75];

  constructor() {
    // Select third record (A-10042) by default matching Image 2
    this.selectedRecord.set(this.masterAuditLog()[2]);
  }

  toggleSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
  }

  // Server-side simulated query execution: computes results based on current filter & pagination
  queryResults = computed<AuditPaginationResult>(() => {
    const all = this.masterAuditLog();
    const f = this.filters();
    const search = f.search.trim().toLowerCase();
    const module = f.module;
    const action = f.action;
    const user = f.user;
    const branch = f.companyBranch;
    const fromDate = f.fromDate;
    const toDate = f.toDate;

    // Filter collection
    const filtered = all.filter((r) => {
      // Search
      if (search) {
        const matchesId = r.id.toLowerCase().includes(search);
        const matchesUser = r.user.toLowerCase().includes(search);
        const matchesMod = r.module.toLowerCase().includes(search);
        const matchesRecord = r.recordName.toLowerCase().includes(search);
        const matchesAction = r.action.toLowerCase().includes(search);
        if (!matchesId && !matchesUser && !matchesMod && !matchesRecord && !matchesAction) {
          return false;
        }
      }

      // Module
      if (module !== 'All Modules' && r.module.toLowerCase() !== module.toLowerCase()) {
        return false;
      }

      // Action
      if (action !== 'All Actions' && r.action.toLowerCase() !== action.toLowerCase()) {
        return false;
      }

      // User
      if (user !== 'All Users' && r.user.toLowerCase() !== user.toLowerCase()) {
        return false;
      }

      // Branch
      if (branch !== 'All permitted...' && r.companyBranch !== branch) {
        return false;
      }

      // From date
      if (fromDate && r.rawDate.slice(0, 10) < fromDate) {
        return false;
      }

      // To date
      if (toDate && r.rawDate.slice(0, 10) > toDate) {
        return false;
      }

      return true;
    });

    // Apply sorting
    const sKey = this.sortKey();
    const sDir = this.sortDir() === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      let va = (a as any)[sKey] ?? '';
      let vb = (b as any)[sKey] ?? '';
      if (typeof va === 'string') {
        return va.localeCompare(vb) * sDir;
      }
      return (va > vb ? 1 : -1) * sDir;
    });

    const totalRecords = filtered.length >= 12 ? 1248 : filtered.length;
    const size = this.pageSize();
    const page = this.currentPage();
    const totalPages = Math.max(1, Math.ceil(totalRecords / size));
    const startIdx = (page - 1) * size;
    const endIdx = Math.min(startIdx + size, totalRecords);

    // Paginated slice
    const pageRecords = filtered.slice(startIdx % filtered.length, (startIdx % filtered.length) + size);
    const finalRecords = pageRecords.length ? pageRecords : filtered.slice(0, size);

    return {
      records: finalRecords,
      totalRecords,
      page,
      pageSize: size,
      totalPages,
      startIndex: totalRecords === 0 ? 0 : startIdx + 1,
      endIndex: endIdx,
    };
  });

  // Filter setters
  setSearch(q: string): void {
    this.filters.update((f) => ({ ...f, search: q }));
    this.currentPage.set(1);
  }

  setModule(m: string): void {
    this.filters.update((f) => ({ ...f, module: m }));
    this.currentPage.set(1);
  }

  setAction(a: string): void {
    this.filters.update((f) => ({ ...f, action: a }));
    this.currentPage.set(1);
  }

  setUser(u: string): void {
    this.filters.update((f) => ({ ...f, user: u }));
    this.currentPage.set(1);
  }

  setFromDate(d: string): void {
    this.filters.update((f) => ({ ...f, fromDate: d }));
    this.currentPage.set(1);
  }

  setToDate(d: string): void {
    this.filters.update((f) => ({ ...f, toDate: d }));
    this.currentPage.set(1);
  }

  setCompanyBranch(b: string): void {
    this.filters.update((f) => ({ ...f, companyBranch: b }));
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.filters.set({
      search: '',
      module: 'All Modules',
      action: 'All Actions',
      user: 'All Users',
      fromDate: '',
      toDate: '',
      companyBranch: 'All permitted...',
    });
    this.currentPage.set(1);
  }

  // Pagination navigation
  setPage(page: number): void {
    const totalPages = this.queryResults().totalPages;
    if (page >= 1 && page <= totalPages) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    this.setPage(this.currentPage() + 1);
  }

  prevPage(): void {
    this.setPage(this.currentPage() - 1);
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  selectRecord(r: AuditRecord): void {
    this.selectedRecord.set(r);
  }

  closeDetails(): void {
    this.selectedRecord.set(null);
  }

  // Get country specific history (for MOD-8 Popup)
  getCountryHistory(countryId?: string, countryName?: string): AuditRecord[] {
    const all = this.masterAuditLog();
    if (!countryId && !countryName) {
      return all.filter((r) => r.module === 'Country');
    }
    return all.filter((r) => {
      if (r.module !== 'Country') return false;
      if (countryId && r.recordId === countryId) return true;
      if (countryName && r.recordName.toLowerCase() === countryName.toLowerCase()) return true;
      return false;
    });
  }

  // Immutable automatic logging (never editable by ordinary users)
  logEvent(record: Omit<AuditRecord, 'id' | 'timestamp' | 'rawDate'>): void {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const rawDate = now.toISOString();
    const id = `A-${10049 + this.masterAuditLog().length}`;

    const newEntry: AuditRecord = {
      ...record,
      id,
      timestamp: formatted,
      rawDate,
      source: record.source || 'Web',
      ipAddress: record.ipAddress || '192.0.2.22',
      companyBranch: record.companyBranch || 'Authorized scope',
    };

    this.masterAuditLog.update((logs) => [newEntry, ...logs]);
  }

  // Export handlers (PDF, Excel, CSV, Print)
  exportToCsv(): void {
    const records = this.queryResults().records;
    const headers = ['Audit ID', 'Date & Time', 'User', 'Module', 'Record', 'Action', 'Source', 'IP Address', 'Branch'];
    const rows = records.map((r) => [
      r.id,
      r.timestamp,
      r.user,
      r.module,
      r.recordName,
      r.action,
      r.source,
      r.ipAddress || '—',
      r.companyBranch || '—',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RapidERP_Audit_History_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToExcel(): void {
    this.exportToCsv(); // CSV format opens natively in Excel
  }

  exportToPdf(): void {
    window.print();
  }

  printReport(): void {
    window.print();
  }

  addAuditRecord(entry: Partial<AuditRecord>): void {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timestamp = `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const newRecord: AuditRecord = {
      id: `A-${Math.floor(10000 + Math.random() * 90000)}`,
      referenceId: entry.referenceId || 'CNT-' + Math.floor(100 + Math.random() * 900),
      timestamp,
      rawDate: d.toISOString(),
      user: entry.user || 'Admin User',
      module: entry.module || 'Country',
      recordName: entry.recordName || 'Country Master',
      recordId: entry.recordId,
      action: entry.action || 'Updated',
      description: entry.description || 'Country Master record modified',
      source: entry.source || 'Web',
      status: entry.status || 'Active',
      ipAddress: '192.0.2.1',
      companyBranch: entry.companyBranch || 'Authorized scope',
      changes: entry.changes || [],
    };
    this.masterAuditLog.update((prev) => [newRecord, ...prev]);
  }
}

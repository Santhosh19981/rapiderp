import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from './translation.service';

export interface HistoryItem {
  id: string;
  moduleId: string;
  subModuleId?: string;
  title: string;
  moduleLabel: string;
  timestamp: string;
  timeAgo: string;
}

export interface FavoriteItem {
  id: string;
  moduleId: string;
  subModuleId?: string;
  title: string;
  icon: string;
  path: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

export interface SearchEntry {
  id: string;
  title: string;
  category: string;
  moduleId: string;
  subModuleId?: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);
  public translation = inject(TranslationService);

  currentModuleId = signal<string>('dashboard');
  currentSubModuleId = signal<string>('');
  rawModuleLabel = signal<string>('Dashboard');
  rawSubModuleLabel = signal<string>('');

  currentModuleLabel = computed(() => {
    return this.translation.translateModule(this.currentModuleId(), this.rawModuleLabel());
  });

  currentSubModuleLabel = computed(() => {
    const sub = this.currentSubModuleId();
    if (!sub) return '';
    return this.translation.translateSubModule(sub, this.rawSubModuleLabel());
  });

  // Top header panels
  isDarkMode = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);
  currentLanguage = this.translation.currentLanguage;
  isRtl = this.translation.isRtl;
  selectedDateRange = signal<string>('Last 30 days');

  isSearchOpen = signal<boolean>(false);
  isNotificationsOpen = signal<boolean>(false);
  isHistoryOpen = signal<boolean>(false);
  isFavoritesOpen = signal<boolean>(false);
  isProfileOpen = signal<boolean>(false);
  isLanguageOpen = signal<boolean>(false);
  isDateFilterOpen = signal<boolean>(false);
  isHelpModalOpen = signal<boolean>(false);
  helpActiveTab = signal<'list' | 'add' | 'edit' | 'view' | 'history'>('list');

  toggleHelpModal(): void {
    this.isHelpModalOpen.update((v) => !v);
  }

  setHelpTab(tab: 'list' | 'add' | 'edit' | 'view' | 'history'): void {
    this.helpActiveTab.set(tab);
  }

  constructor() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }

  // Notifications
  notifications = signal<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Invoice Paid',
      message: 'Invoice #INV-2026-089 has been paid in full by ABC Corp ($12,450.00)',
      time: '12m ago',
      type: 'success',
      read: false,
    },
    {
      id: 'n2',
      title: 'Low Stock Alert',
      message: 'Item "Industrial Roller Bearings" is below minimum threshold (4 left)',
      time: '45m ago',
      type: 'alert',
      read: false,
    },
    {
      id: 'n3',
      title: 'New Leave Request',
      message: 'Sarah Khan submitted Annual Leave application (Oct 20 - Oct 25)',
      time: '2h ago',
      type: 'info',
      read: false,
    },
    {
      id: 'n4',
      title: 'Monthly VAT Statement Ready',
      message: 'VAT return for previous fiscal quarter has been automatically calculated',
      time: '1d ago',
      type: 'warning',
      read: true,
    },
    {
      id: 'n5',
      title: 'System Backup Completed',
      message: 'Daily encrypted database snapshot saved to cloud storage successfully',
      time: '1d ago',
      type: 'info',
      read: true,
    },
  ]);

  // History / Audit trail
  history = signal<HistoryItem[]>([
    {
      id: 'h1',
      moduleId: 'sales',
      subModuleId: 'invoices',
      title: 'Invoices',
      moduleLabel: 'Sales',
      timestamp: 'Today, 06:14 PM',
      timeAgo: 'Just now',
    },
    {
      id: 'h2',
      moduleId: 'inventory',
      subModuleId: 'inv-items',
      title: 'Items',
      moduleLabel: 'Inventory',
      timestamp: 'Today, 05:42 PM',
      timeAgo: '32m ago',
    },
    {
      id: 'h3',
      moduleId: 'financials',
      subModuleId: 'fin-pnl',
      title: 'Profit And Loss Statement',
      moduleLabel: 'Financials',
      timestamp: 'Today, 04:10 PM',
      timeAgo: '2h ago',
    },
    {
      id: 'h4',
      moduleId: 'hr',
      subModuleId: 'hr-employees',
      title: 'Employees',
      moduleLabel: 'HR',
      timestamp: 'Today, 02:30 PM',
      timeAgo: '4h ago',
    },
    {
      id: 'h5',
      moduleId: 'account',
      subModuleId: 'acc-balance',
      title: 'Balance Sheet',
      moduleLabel: 'Account',
      timestamp: 'Yesterday, 11:20 AM',
      timeAgo: '1d ago',
    },
  ]);

  // Favorites
  favorites = signal<FavoriteItem[]>([
    {
      id: 'fav-1',
      moduleId: 'sales',
      subModuleId: 'invoices',
      title: 'Sales Invoices',
      icon: 'file-invoice',
      path: '/sales/invoices',
    },
    {
      id: 'fav-2',
      moduleId: 'inventory',
      subModuleId: 'inv-reports',
      title: 'Stock Reports',
      icon: 'menu-bars',
      path: '/inventory/reports',
    },
    {
      id: 'fav-3',
      moduleId: 'payroll',
      subModuleId: 'pr-payslip',
      title: 'Payroll Payslips',
      icon: 'clipboard',
      path: '/payroll/payslip',
    },
    {
      id: 'fav-4',
      moduleId: 'account',
      subModuleId: 'acc-chart',
      title: 'Charts of Accounts',
      icon: 'book-ledger',
      path: '/account/chart',
    },
    {
      id: 'fav-5',
      moduleId: 'reports',
      subModuleId: 'rep-sales-summary',
      title: 'Sales Summary',
      icon: 'file-dollar',
      path: '/reports/sales-summary',
    },
  ]);

  // Search catalog with all 41 modules and submodules
  searchCatalog: SearchEntry[] = [
    { id: 'dash', title: 'Dashboard', category: 'Overview', moduleId: 'dashboard', icon: 'dashboard' },
    // Sales
    { id: 's-cust', title: 'Customers', category: 'Sales', moduleId: 'sales', subModuleId: 'customers', icon: 'user-pin' },
    { id: 's-quot', title: 'Quotations', category: 'Sales', moduleId: 'sales', subModuleId: 'quotations', icon: 'calculator' },
    { id: 's-inv', title: 'Invoices', category: 'Sales', moduleId: 'sales', subModuleId: 'invoices', icon: 'file-invoice' },
    { id: 's-cred', title: 'Credit Notes', category: 'Sales', moduleId: 'sales', subModuleId: 'credit-notes', icon: 'clipboard' },
    { id: 's-pay', title: 'Invoice Payments', category: 'Sales', moduleId: 'sales', subModuleId: 'invoice-payments', icon: 'banknote' },
    { id: 's-stmt', title: 'Statement of Customer', category: 'Sales', moduleId: 'sales', subModuleId: 'customer-statement', icon: 'receipt' },
    { id: 's-man', title: 'Manual Invoice', category: 'Sales', moduleId: 'sales', subModuleId: 'manual-invoice', icon: 'file-invoice' },
    // Services
    { id: 'srv-cat', title: 'Service Categories', category: 'Services', moduleId: 'services', subModuleId: 'srv-categories', icon: 'menu-bars' },
    { id: 'srv-main', title: 'Services List', category: 'Services', moduleId: 'services', subModuleId: 'srv-services', icon: 'factory' },
    // Purchase
    { id: 'pur-ord', title: 'Purchase Orders', category: 'Purchase', moduleId: 'purchase', subModuleId: 'pur-orders', icon: 'calculator' },
    { id: 'pur-inv', title: 'Purchase Invoices', category: 'Purchase', moduleId: 'purchase', subModuleId: 'pur-invoices', icon: 'file-invoice' },
    { id: 'pur-pay', title: 'Purchase Payments', category: 'Purchase', moduleId: 'purchase', subModuleId: 'pur-payments', icon: 'banknote' },
    { id: 'pur-ret', title: 'Purchase Returns', category: 'Purchase', moduleId: 'purchase', subModuleId: 'pur-returns', icon: 'return-arrow' },
    // Inventory
    { id: 'inv-grp', title: 'Inventory Groups', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-groups', icon: 'users-group' },
    { id: 'inv-cat', title: 'Inventory Categories', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-categories', icon: 'pos-register' },
    { id: 'inv-sub', title: 'Inventory Sub Categories', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-sub-categories', icon: 'menu-bars' },
    { id: 'inv-un', title: 'Units of Measure', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-unit', icon: 'scales' },
    { id: 'inv-brd', title: 'Brands', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-brand', icon: 'price-tag' },
    { id: 'inv-clr', title: 'Colors', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-color', icon: 'paint-bucket' },
    { id: 'inv-itm', title: 'Inventory Items', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-items', icon: 'package-box' },
    { id: 'inv-lst', title: 'Item Listing', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-listing', icon: 'bullet-list' },
    { id: 'inv-rep', title: 'Stock Reports', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-reports', icon: 'menu-bars' },
    { id: 'inv-lbl', title: 'Print Labels', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-labels', icon: 'printer' },
    // Tasks
    { id: 'tsk-cat', title: 'Task Categories', category: 'Tasks', moduleId: 'tasks', subModuleId: 'tsk-categories', icon: 'user-check' },
    { id: 'tsk-asg', title: 'Task Assign', category: 'Tasks', moduleId: 'tasks', subModuleId: 'tsk-assign', icon: 'checklist' },
    // Projects
    { id: 'prj', title: 'Projects Management', category: 'Projects', moduleId: 'projects', icon: 'projects' },
    // HR
    { id: 'hr-dep', title: 'HR Departments', category: 'HR', moduleId: 'hr', subModuleId: 'hr-departments', icon: 'window-split' },
    { id: 'hr-des', title: 'HR Designations', category: 'HR', moduleId: 'hr', subModuleId: 'hr-designation', icon: 'menu-bars' },
    { id: 'hr-emp', title: 'Employees Registry', category: 'HR', moduleId: 'hr', subModuleId: 'hr-employees', icon: 'user-tie' },
    { id: 'hr-trf', title: 'Employee Transfers', category: 'HR', moduleId: 'hr', subModuleId: 'hr-transfer', icon: 'transfer-arrows' },
    { id: 'hr-cas', title: 'Casual Employees', category: 'HR', moduleId: 'hr', subModuleId: 'hr-casual', icon: 'user' },
    { id: 'hr-tms', title: 'Casual Employee Timesheets', category: 'HR', moduleId: 'hr', subModuleId: 'hr-timesheets', icon: 'clock' },
    // Holidays & Appointments
    { id: 'hld', title: 'Public Holidays', category: 'Holidays', moduleId: 'holidays', icon: 'holidays' },
    { id: 'apt', title: 'Appointments Calendar', category: 'Appointments', moduleId: 'appointments', icon: 'appointments' },
    // Leaves
    { id: 'lv-typ', title: 'Leave Types', category: 'Leaves', moduleId: 'leaves', subModuleId: 'lv-types', icon: 'bed' },
    { id: 'lv-app', title: 'Leave Applications', category: 'Leaves', moduleId: 'leaves', subModuleId: 'lv-applications', icon: 'file-text' },
    { id: 'lv-apr', title: 'Leave Approval', category: 'Leaves', moduleId: 'leaves', subModuleId: 'lv-approval', icon: 'badge-check' },
    // Timesheets
    { id: 'tms', title: 'Staff Timesheets', category: 'Timesheets', moduleId: 'timesheets', icon: 'timesheets' },
    // Payroll
    { id: 'pr-shts', title: 'Salary Sheets', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-sheets', icon: 'pencil' },
    { id: 'pr-pslp', title: 'Employee Payslips', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-payslip', icon: 'clipboard' },
    { id: 'pr-allw', title: 'Allowances', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-allowances', icon: 'wallet' },
    { id: 'pr-adv', title: 'Salary Advances', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-advances', icon: 'wallet-card' },
    { id: 'pr-ln', title: 'Employee Loans', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-loans', icon: 'hand-coin' },
    { id: 'pr-ins', title: 'Insurances', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-insurances', icon: 'shield' },
    { id: 'pr-bon', title: 'Bonuses', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-bonuses', icon: 'gift' },
    { id: 'pr-ded', title: 'Deductions', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-deductions', icon: 'circle-minus' },
    { id: 'pr-stmt', title: 'Statement of Employee', category: 'Payroll', moduleId: 'payroll', subModuleId: 'pr-statement', icon: 'file-text' },
    // Financials
    { id: 'fin-md', title: 'Payment Modes', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-modes', icon: 'circle-p' },
    { id: 'fin-tx', title: 'Tax Rates & VAT', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-tax', icon: 'percent' },
    { id: 'fin-ec', title: 'Expense Categories', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-exp-cat', icon: 'list-123' },
    { id: 'fin-es', title: 'Expense Sub Categories', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-exp-sub', icon: 'indented-list' },
    { id: 'fin-ex', title: 'Expenses Entry', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-expense', icon: 'bracket-dots' },
    { id: 'fin-vt', title: 'VAT Reports', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-vat', icon: 'bar-chart' },
    { id: 'fin-pl', title: 'Profit And Loss Statement', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-pnl', icon: 'line-chart' },
    { id: 'fin-cs', title: 'Cash Flow Register', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-cash', icon: 'banknote' },
    { id: 'fin-st', title: 'Account Statements', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-statements', icon: 'menu-bars' },
    { id: 'fin-ss', title: 'Supplier Statements', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-supplier-statements', icon: 'receipt' },
    // Account
    { id: 'acc-ch', title: 'Charts of Accounts', category: 'Account', moduleId: 'account', subModuleId: 'acc-chart', icon: 'book-ledger' },
    { id: 'acc-tr', title: 'Trading Account', category: 'Account', moduleId: 'account', subModuleId: 'acc-trading', icon: 'coins-stack' },
    { id: 'acc-pl', title: 'Profit and Loss Account', category: 'Account', moduleId: 'account', subModuleId: 'acc-pnl', icon: 'line-chart' },
    { id: 'acc-bl', title: 'Balance Sheet', category: 'Account', moduleId: 'account', subModuleId: 'acc-balance', icon: 'scales' },
    // Assets
    { id: 'ast-c', title: 'Asset Categories', category: 'Assets', moduleId: 'assets', subModuleId: 'ast-categories', icon: 'menu-bars' },
    { id: 'ast-a', title: 'Fixed Assets', category: 'Assets', moduleId: 'assets', subModuleId: 'ast-assets', icon: 'factory' },
    { id: 'ast-r', title: 'Equipment Rentals', category: 'Assets', moduleId: 'assets', subModuleId: 'ast-rentals', icon: 'car' },
    // Reports
    { id: 'rep-ss', title: 'Sales Summary Report', category: 'Reports', moduleId: 'reports', subModuleId: 'rep-sales-summary', icon: 'file-dollar' },
    { id: 'rep-sv', title: 'Sales VAT Report', category: 'Reports', moduleId: 'reports', subModuleId: 'rep-sales-vat', icon: 'file-dollar' },
    { id: 'rep-si', title: 'Sales Item Report', category: 'Reports', moduleId: 'reports', subModuleId: 'rep-sales-item', icon: 'shopping-cart' },
    { id: 'rep-cn', title: 'Credit Note Reports', category: 'Reports', moduleId: 'reports', subModuleId: 'rep-credit-notes', icon: 'file-invoice' },
    // Setup & Direct Modules
    { id: 'cur', title: 'Currencies & Rates', category: 'Setup', moduleId: 'currencies', icon: 'currencies' },
    { id: 'cnt', title: 'Countries Registry', category: 'Setup', moduleId: 'countries', icon: 'countries' },
    { id: 'sta', title: 'States & Provinces', category: 'Setup', moduleId: 'states', icon: 'states' },
    { id: 'cmp', title: 'Company Profiles', category: 'Setup', moduleId: 'company', icon: 'company' },
    { id: 'brn', title: 'Branch Management', category: 'Setup', moduleId: 'branches', icon: 'branches' },
    { id: 'bnk', title: 'Bank Accounts', category: 'Setup', moduleId: 'bank', icon: 'bank' },
    { id: 'prc', title: 'Project Calculations', category: 'Projects', moduleId: 'project-calculations', icon: 'project-calculations' },
    { id: 'sft', title: 'Safety Materials', category: 'Operations', moduleId: 'safety-materials', icon: 'safety-materials' },
    { id: 'cln', title: 'Company Loans', category: 'Financials', moduleId: 'company-loans', icon: 'company-loans' },
    { id: 'doc', title: 'Document Archive', category: 'Documents', moduleId: 'documents', icon: 'documents' },
    { id: 'lgu', title: 'Active Logged Users', category: 'Security', moduleId: 'logged-users', icon: 'logged-users' },
    { id: 'usr', title: 'Users & Permissions', category: 'Security', moduleId: 'users', icon: 'users' },
    { id: 'dtb', title: 'Database Backups', category: 'System', moduleId: 'database', icon: 'database' },
    { id: 'act', title: 'System Activity Logs', category: 'System', moduleId: 'activity-logs', icon: 'activity-logs' },
    { id: 'aud', title: 'Audit History', category: 'System', moduleId: 'audit-history', icon: 'history' },
    { id: 'fny', title: 'Financial Year Settings', category: 'System', moduleId: 'financial-year', icon: 'financial-year' },
    { id: 'cly', title: 'Closing Fiscal Year', category: 'System', moduleId: 'closing-year', icon: 'closing-year' },
    { id: 'smp-c', title: 'Sample Categories', category: 'Sample', moduleId: 'sample', subModuleId: 'smp-categories', icon: 'menu-bars' },
    { id: 'smp-r', title: 'Sample Receiving', category: 'Sample', moduleId: 'sample', subModuleId: 'smp-receiving', icon: 'factory' },
    { id: 'crt', title: 'Digital Certificates', category: 'Certificates', moduleId: 'certificate', icon: 'certificate' },
  ];

  navigateTo(
    moduleId: string,
    subModuleId: string = '',
    moduleLabel: string = '',
    subModuleLabel: string = '',
    updateUrl: boolean = true
  ): void {
    this.currentModuleId.set(moduleId);
    this.currentSubModuleId.set(subModuleId);

    // Compute title labels if not supplied
    const finalModuleLabel = moduleLabel || this.formatTitle(moduleId);
    const finalSubModuleLabel = subModuleLabel || (subModuleId ? this.formatTitle(subModuleId) : '');

    this.rawModuleLabel.set(finalModuleLabel);
    this.rawSubModuleLabel.set(finalSubModuleLabel);

    // Close overlays
    this.closeAllPanels();

    // Log to history
    const pageTitle = this.currentSubModuleLabel() || this.currentModuleLabel();
    this.addHistory(moduleId, subModuleId, pageTitle, this.currentModuleLabel());

    if (updateUrl && this.router) {
      const commands = subModuleId ? ['/landing', moduleId, subModuleId] : ['/landing', moduleId];
      const targetPath = commands.join('/');
      if (!this.router.url.startsWith(targetPath)) {
        this.router.navigate(commands);
      }
    }
  }

  addHistory(moduleId: string, subModuleId: string | undefined, title: string, moduleLabel: string): void {
    const list = this.history();
    const updated = [
      {
        id: 'h-' + Date.now(),
        moduleId,
        subModuleId,
        title,
        moduleLabel,
        timestamp: 'Just now',
        timeAgo: 'Just now',
      },
      ...list.filter((x) => !(x.moduleId === moduleId && x.subModuleId === subModuleId)),
    ].slice(0, 15);
    this.history.set(updated);
  }

  toggleFavorite(moduleId: string, subModuleId: string, title: string, icon: string): void {
    const current = this.favorites();
    const exists = current.find((f) => f.moduleId === moduleId && f.subModuleId === subModuleId);
    if (exists) {
      this.favorites.set(current.filter((f) => f.id !== exists.id));
    } else {
      this.favorites.set([
        ...current,
        {
          id: 'fav-' + Date.now(),
          moduleId,
          subModuleId,
          title,
          icon,
          path: `/${moduleId}${subModuleId ? '/' + subModuleId : ''}`,
        },
      ]);
    }
  }

  isFavorite(moduleId: string, subModuleId: string = ''): boolean {
    return this.favorites().some((f) => f.moduleId === moduleId && (f.subModuleId || '') === subModuleId);
  }

  unreadNotificationCount(): number {
    return this.notifications().filter((n) => !n.read).length;
  }

  markAllNotificationsRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  clearNotifications(): void {
    this.notifications.set([]);
  }

  toggleDarkMode(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    if (typeof document !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggleFullscreen(): void {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      this.isFullscreen.set(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      this.isFullscreen.set(false);
    }
  }

  setLanguage(lang: string): void {
    this.translation.setLanguage(lang);
    this.isLanguageOpen.set(false);
  }

  translateText(key: string, fallback?: string): string {
    return this.translation.translate(key, fallback);
  }

  setDateRange(range: string): void {
    this.selectedDateRange.set(range);
    this.isDateFilterOpen.set(false);
  }

  closeAllPanels(): void {
    this.isSearchOpen.set(false);
    this.isNotificationsOpen.set(false);
    this.isHistoryOpen.set(false);
    this.isFavoritesOpen.set(false);
    this.isProfileOpen.set(false);
    this.isLanguageOpen.set(false);
    this.isDateFilterOpen.set(false);
    this.isHelpModalOpen.set(false);
  }

  private formatTitle(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

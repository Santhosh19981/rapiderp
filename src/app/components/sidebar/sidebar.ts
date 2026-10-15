import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';

export interface SubMenuItem {
  id: string;
  label: string;
  icon: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  subItems?: SubMenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private router = inject(Router);
  public navService = inject(NavigationService);
  private authService = inject(AuthService);

  isCollapsed = signal<boolean>(false);
  isHoverExpanded = signal<boolean>(false);

  // Effective expanded state: true if permanently pinned open OR currently hover-expanded
  effectiveExpanded = computed(() => !this.isCollapsed() || this.isHoverExpanded());

  activeItemId = this.navService.currentModuleId;
  activeSubItemId = this.navService.currentSubModuleId;
  hoveredItemId = signal<string | null>(null);
  flyoutTop = signal<number>(64);
  showCompanyDropdown = signal<boolean>(false);
  selectedCompany = signal<string>('ABC Trading LLC');

  companies = ['ABC Trading LLC', 'Rapid Global Ltd', 'Indus Tech Pvt Ltd'];

  private closeTimer: any = null;
  private sidebarLeaveTimer: any = null;

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: 'sales',
      subItems: [
        { id: 'customers', label: 'Customers', icon: 'user-pin' },
        { id: 'quotations', label: 'Quotations', icon: 'calculator' },
        { id: 'invoices', label: 'Invoices', icon: 'file-invoice' },
        { id: 'credit-notes', label: 'Credit Notes', icon: 'clipboard' },
        { id: 'invoice-payments', label: 'Invoice Payments', icon: 'banknote' },
        { id: 'customer-statement', label: 'Statement of Customer', icon: 'receipt' },
        { id: 'manual-invoice', label: 'Manual Invoice', icon: 'file-invoice' },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      icon: 'services',
      subItems: [
        { id: 'srv-categories', label: 'Categories', icon: 'menu-bars' },
        { id: 'srv-services', label: 'Services', icon: 'factory' },
      ],
    },
    {
      id: 'purchase',
      label: 'Purchase',
      icon: 'purchase',
      subItems: [
        { id: 'pur-orders', label: 'Orders', icon: 'calculator' },
        { id: 'pur-invoices', label: 'Invoices', icon: 'file-invoice' },
        { id: 'pur-payments', label: 'Invoice Payments', icon: 'banknote' },
        { id: 'pur-returns', label: 'Returns', icon: 'return-arrow' },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'inventory',
      subItems: [
        { id: 'inv-groups', label: 'Groups', icon: 'users-group' },
        { id: 'inv-categories', label: 'Categories', icon: 'pos-register' },
        { id: 'inv-sub-categories', label: 'Sub Categories', icon: 'menu-bars' },
        { id: 'inv-unit', label: 'Unit', icon: 'scales' },
        { id: 'inv-brand', label: 'Brand', icon: 'price-tag' },
        { id: 'inv-color', label: 'Color', icon: 'paint-bucket' },
        { id: 'inv-items', label: 'Items', icon: 'package-box' },
        { id: 'inv-listing', label: 'Item Listing', icon: 'bullet-list' },
        { id: 'inv-reports', label: 'Stock Reports', icon: 'menu-bars' },
        { id: 'inv-labels', label: 'Print Labels', icon: 'printer' },
      ],
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'tasks',
      subItems: [
        { id: 'tsk-categories', label: 'Task Categories', icon: 'user-check' },
        { id: 'tsk-assign', label: 'Task Assign', icon: 'checklist' },
      ],
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'projects',
    },
    {
      id: 'hr',
      label: 'HR',
      icon: 'hr',
      subItems: [
        { id: 'hr-departments', label: 'Departments', icon: 'window-split' },
        { id: 'hr-designation', label: 'Designation', icon: 'menu-bars' },
        { id: 'hr-employees', label: 'Employees', icon: 'user-tie' },
        { id: 'hr-transfer', label: 'Transfer', icon: 'transfer-arrows' },
        { id: 'hr-casual', label: 'Casual Employees', icon: 'user' },
        { id: 'hr-timesheets', label: 'Casual Employee Timesheets', icon: 'clock' },
      ],
    },
    {
      id: 'holidays',
      label: 'Holidays',
      icon: 'holidays',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: 'appointments',
    },
    {
      id: 'leaves',
      label: 'Leaves',
      icon: 'leaves',
      subItems: [
        { id: 'lv-types', label: 'Leave Types', icon: 'bed' },
        { id: 'lv-applications', label: 'Leave Applications', icon: 'file-text' },
        { id: 'lv-approval', label: 'Approval', icon: 'badge-check' },
      ],
    },
    {
      id: 'timesheets',
      label: 'Timesheets',
      icon: 'timesheets',
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: 'payroll',
      subItems: [
        { id: 'pr-sheets', label: 'Salary Sheets', icon: 'pencil' },
        { id: 'pr-payslip', label: 'Payslip', icon: 'clipboard' },
        { id: 'pr-allowances', label: 'Allowances', icon: 'wallet' },
        { id: 'pr-advances', label: 'Salary Advances', icon: 'wallet-card' },
        { id: 'pr-loans', label: 'Loans', icon: 'hand-coin' },
        { id: 'pr-insurances', label: 'Insurances', icon: 'shield' },
        { id: 'pr-bonuses', label: 'Bonuses', icon: 'gift' },
        { id: 'pr-deductions', label: 'Deductions', icon: 'circle-minus' },
        { id: 'pr-statement', label: 'Statement of Employee', icon: 'file-text' },
      ],
    },
    {
      id: 'increments',
      label: 'Increments',
      icon: 'increments',
    },
    {
      id: 'retirements',
      label: 'Retirements',
      icon: 'retirements',
    },
    {
      id: 'terminations',
      label: 'Terminations',
      icon: 'terminations',
    },
    {
      id: 'revokes',
      label: 'Revokes',
      icon: 'revokes',
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      icon: 'terms',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: 'suppliers',
    },
    {
      id: 'financials',
      label: 'Financials',
      icon: 'financials',
      subItems: [
        { id: 'fin-modes', label: 'Payment Modes', icon: 'circle-p' },
        { id: 'fin-tax', label: 'Tax Rates', icon: 'percent' },
        { id: 'fin-exp-cat', label: 'Expense Categories', icon: 'list-123' },
        { id: 'fin-exp-sub', label: 'Expense Sub Categories', icon: 'indented-list' },
        { id: 'fin-expense', label: 'Expense', icon: 'bracket-dots' },
        { id: 'fin-vat', label: 'VAT Reports', icon: 'bar-chart' },
        { id: 'fin-pnl', label: 'Profit And Loss Statement', icon: 'line-chart' },
        { id: 'fin-cash', label: 'Cash', icon: 'banknote' },
        { id: 'fin-statements', label: 'Account Statements', icon: 'menu-bars' },
        { id: 'fin-supplier-statements', label: 'Supplier Statements', icon: 'receipt' },
      ],
    },
    {
      id: 'account',
      label: 'Account',
      icon: 'account',
      subItems: [
        { id: 'acc-chart', label: 'Charts of Accounts', icon: 'book-ledger' },
        { id: 'acc-trading', label: 'Trading Account', icon: 'coins-stack' },
        { id: 'acc-pnl', label: 'Profit and Loss', icon: 'line-chart' },
        { id: 'acc-balance', label: 'Balance Sheet', icon: 'scales' },
      ],
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: 'assets',
      subItems: [
        { id: 'ast-categories', label: 'Categories', icon: 'menu-bars' },
        { id: 'ast-assets', label: 'Assets', icon: 'factory' },
        { id: 'ast-rentals', label: 'Rentals', icon: 'car' },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'reports',
      subItems: [
        { id: 'rep-sales-summary', label: 'Sales Summary Report', icon: 'file-dollar' },
        { id: 'rep-sales-vat', label: 'Sales Vat Report', icon: 'file-dollar' },
        { id: 'rep-sales-item', label: 'Sales Item Report', icon: 'shopping-cart' },
        { id: 'rep-credit-notes', label: 'Credit Note Reports', icon: 'file-invoice' },
      ],
    },
    {
      id: 'currencies',
      label: 'Currencies',
      icon: 'currencies',
    },
    {
      id: 'countries',
      label: 'Countries',
      icon: 'countries',
    },
    {
      id: 'states',
      label: 'States',
      icon: 'states',
    },
    {
      id: 'company',
      label: 'Company',
      icon: 'company',
    },
    {
      id: 'branches',
      label: 'Branches',
      icon: 'branches',
    },
    {
      id: 'bank',
      label: 'Bank',
      icon: 'bank',
    },
    {
      id: 'project-calculations',
      label: 'Project Calculations',
      icon: 'project-calculations',
    },
    {
      id: 'safety-materials',
      label: 'Safety Materials',
      icon: 'safety-materials',
    },
    {
      id: 'company-loans',
      label: 'Company Loans',
      icon: 'company-loans',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'documents',
    },
    {
      id: 'logged-users',
      label: 'Logged Users',
      icon: 'logged-users',
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'users',
    },
    {
      id: 'database',
      label: 'Database',
      icon: 'database',
    },
    {
      id: 'activity-logs',
      label: 'Activity Logs',
      icon: 'activity-logs',
    },
    {
      id: 'financial-year',
      label: 'Financial Year',
      icon: 'financial-year',
    },
    {
      id: 'closing-year',
      label: 'Closing Year',
      icon: 'closing-year',
    },
    {
      id: 'sample',
      label: 'Sample',
      icon: 'sample',
      subItems: [
        { id: 'smp-categories', label: 'Categories', icon: 'menu-bars' },
        { id: 'smp-receiving', label: 'Receiving', icon: 'factory' },
      ],
    },
    {
      id: 'certificate',
      label: 'Certificate',
      icon: 'certificate',
    },
  ];

  // Techoze-Style Buttery Smooth Hover Event Handlers with Precise Positioning
  onSidebarMouseEnter(): void {
    if (this.sidebarLeaveTimer) {
      clearTimeout(this.sidebarLeaveTimer);
      this.sidebarLeaveTimer = null;
    }
    if (this.isCollapsed()) {
      this.isHoverExpanded.set(true);
    }
  }

  onSidebarMouseLeave(): void {
    if (this.sidebarLeaveTimer) {
      clearTimeout(this.sidebarLeaveTimer);
    }
    // 180ms grace buffer for fluid cursor transit without abrupt snapping
    this.sidebarLeaveTimer = setTimeout(() => {
      if (this.isCollapsed()) {
        this.isHoverExpanded.set(false);
        this.showCompanyDropdown.set(false);
      }
    }, 180);
  }

  onItemMouseEnter(item: MenuItem, event: MouseEvent): void {
    if (this.sidebarLeaveTimer) {
      clearTimeout(this.sidebarLeaveTimer);
      this.sidebarLeaveTimer = null;
    }
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    if (this.isCollapsed() && !this.isHoverExpanded()) {
      this.isHoverExpanded.set(true);
    }

    if (item.subItems && item.subItems.length > 0) {
      const target = event.currentTarget as HTMLElement;
      if (target) {
        const parent = target.closest('.sidebar-wrapper') as HTMLElement;
        const parentRect = parent ? parent.getBoundingClientRect() : { top: 0 };
        const targetRect = target.getBoundingClientRect();
        const rawTop = targetRect.top - parentRect.top;

        // Ensure popover does not overflow bottom of viewport
        const flyoutEstimatedHeight = Math.min(380, item.subItems.length * 40 + 60);
        const maxTop = window.innerHeight - flyoutEstimatedHeight - 16;
        this.flyoutTop.set(Math.max(8, Math.min(rawTop, maxTop)));
      }
    }

    this.hoveredItemId.set(item.id);
  }

  onItemMouseLeave(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
    // 180ms grace buffer for fluid diagonal mouse transit without closing
    this.closeTimer = setTimeout(() => {
      this.hoveredItemId.set(null);
    }, 180);
  }

  onFlyoutMouseEnter(): void {
    if (this.sidebarLeaveTimer) {
      clearTimeout(this.sidebarLeaveTimer);
      this.sidebarLeaveTimer = null;
    }
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  onFlyoutMouseLeave(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
    this.closeTimer = setTimeout(() => {
      this.hoveredItemId.set(null);
    }, 150);

    if (this.sidebarLeaveTimer) {
      clearTimeout(this.sidebarLeaveTimer);
    }
    this.sidebarLeaveTimer = setTimeout(() => {
      if (this.isCollapsed()) {
        this.isHoverExpanded.set(false);
        this.showCompanyDropdown.set(false);
      }
    }, 180);
  }

  selectItem(item: MenuItem): void {
    if (item.subItems && item.subItems.length > 0) {
      // Navigate to first subitem or keep module active
      const firstSub = item.subItems[0];
      this.navService.navigateTo(item.id, firstSub.id, item.label, firstSub.label);
    } else {
      this.navService.navigateTo(item.id, '', item.label, '');
    }
    this.hoveredItemId.set(null);
    if (this.isCollapsed()) {
      this.isHoverExpanded.set(false);
    }
  }

  selectSubItem(item: MenuItem, sub: SubMenuItem, event: MouseEvent): void {
    event.stopPropagation();
    this.navService.navigateTo(item.id, sub.id, item.label, sub.label);
    this.hoveredItemId.set(null);
    if (this.isCollapsed()) {
      this.isHoverExpanded.set(false);
    }
  }

  toggleCollapse(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isCollapsed.update((v) => !v);
    this.isHoverExpanded.set(false);
    this.hoveredItemId.set(null);
    if (this.isCollapsed()) {
      this.showCompanyDropdown.set(false);
    }
  }

  toggleCompanyDropdown(): void {
    if (this.isCollapsed() && !this.effectiveExpanded()) {
      this.isCollapsed.set(false);
      this.showCompanyDropdown.set(true);
      return;
    }
    this.showCompanyDropdown.update((v) => !v);
  }

  selectCompany(name: string): void {
    this.selectedCompany.set(name);
    this.showCompanyDropdown.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getHoveredItem(): MenuItem | undefined {
    const id = this.hoveredItemId();
    if (!id) return undefined;
    return this.menuItems.find((m) => m.id === id);
  }
}


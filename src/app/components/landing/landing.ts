import { Component, inject, signal, computed, HostListener, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { CountryComponent } from '../country/country';
import { AuditHistoryComponent } from '../audit-history/audit-history';
import { NavigationService, SearchEntry } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import { TenantService } from '../../services/tenant.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, CountryComponent, AuditHistoryComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public navService = inject(NavigationService);
  public authService = inject(AuthService);
  public tenantService = inject(TenantService);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  // Ensure all dropdowns & profile cards are closed by default on landing
  ngOnInit(): void {
    this.closeAll();

    this.route.paramMap.subscribe((params) => {
      const moduleId = params.get('moduleId');
      const subModuleId = params.get('subModuleId') || '';
      if (moduleId) {
        if (this.navService.currentModuleId() !== moduleId || this.navService.currentSubModuleId() !== subModuleId) {
          this.navService.navigateTo(moduleId, subModuleId, '', '', false);
        }
      } else {
        const current = this.navService.currentModuleId() || 'dashboard';
        this.router.navigate(['/landing', current], { replaceUrl: true, queryParamsHandling: 'preserve' });
      }
    });
  }

  // Search input state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  isImageSearchOpen = signal<boolean>(false);
  isListening = signal<boolean>(false);
  speechRecognitionObj: any = null;

  // Uploaded image state
  uploadedImageUrl = signal<string | null>(null);
  uploadedImageName = signal<string | null>(null);

  // Search categories matching Image 3 reference
  searchCategories = ['All', 'Sales', 'Services', 'Inventory', 'HR', 'Financials', 'Reports', 'Setup'];

  // Languages list
  languages = this.navService.translation.languages;

  // Search filter signals for Language & Favorites dropdowns (Matching reference Image 4)
  languageSearch = signal<string>('');
  favoritesSearch = signal<string>('');

  filteredLanguages = computed(() => {
    const q = this.languageSearch().trim().toLowerCase();
    const list = this.navService.translation.languages;
    if (!q) return list;
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.nativeName && l.nativeName.toLowerCase().includes(q)) ||
        l.code.toLowerCase().includes(q)
    );
  });

  filteredFavorites = computed(() => {
    const q = this.favoritesSearch().trim().toLowerCase();
    const list = this.navService.favorites();
    if (!q) return list;
    return list.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.moduleId.toLowerCase().includes(q)
    );
  });

  // Most used / quick access modules
  mostUsedItems = [
    { title: 'Invoices & Billing', category: 'Sales', moduleId: 'sales', subModuleId: 'invoices', icon: 'file-invoice' },
    { title: 'Item Listing & Catalog', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-items', icon: 'package-box' },
    { title: 'Employee Registry', category: 'HR', moduleId: 'hr', subModuleId: 'hr-employees', icon: 'user-tie' },
    { title: 'Profit And Loss Statement', category: 'Financials', moduleId: 'financials', subModuleId: 'fin-pnl', icon: 'line-chart' },
    { title: 'Stock & Inventory Reports', category: 'Inventory', moduleId: 'inventory', subModuleId: 'inv-reports', icon: 'menu-bars' },
    { title: 'Customer Directory', category: 'Sales', moduleId: 'sales', subModuleId: 'customers', icon: 'user-pin' },
  ];

  // Filtered search results
  filteredSearchEntries = computed<SearchEntry[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    return this.navService.searchCatalog.filter((item) => {
      const matchesCategory = cat === 'All' || item.category.toLowerCase() === cat.toLowerCase();
      const matchesQuery = !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.moduleId.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    }).slice(0, 8);
  });

  // Current page watermark display text
  currentPageTitle = computed<string>(() => {
    const sub = this.navService.currentSubModuleLabel();
    const mod = this.navService.currentModuleLabel();
    return sub || mod || this.navService.translateText('Dashboard');
  });

  currentPageModule = computed<string>(() => {
    return this.navService.currentModuleLabel() || 'Rapid ERP';
  });

  isCountryModule = computed<boolean>(() => {
    const mod = (this.navService.currentModuleId() || '').toLowerCase();
    return mod === 'countries' || mod === 'country';
  });

  isAuditHistoryModule = computed<boolean>(() => {
    const mod = (this.navService.currentModuleId() || '').toLowerCase();
    return mod === 'audit-history' || mod === 'audit' || mod === 'activity-logs';
  });

  // Hotkey listener for Ctrl+K (Search) and Escape (Close Overlays)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.toggleSearch();
    } else if (event.key === 'Escape') {
      this.closeAll();
    }
  }

  // Close panels on click outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-popover-container') && !target.closest('.search-trigger-btn')) {
      if (this.navService.isSearchOpen()) {
        this.navService.isSearchOpen.set(false);
      }
    }
    if (!target.closest('.profile-dropdown-container') && !target.closest('.profile-trigger-btn')) {
      if (this.navService.isProfileOpen()) {
        this.navService.isProfileOpen.set(false);
      }
    }
    if (!target.closest('.favorites-dropdown-container') && !target.closest('.favorites-trigger-btn')) {
      if (this.navService.isFavoritesOpen()) {
        this.navService.isFavoritesOpen.set(false);
      }
    }
    if (!target.closest('.language-dropdown-container') && !target.closest('.language-trigger-btn')) {
      if (this.navService.isLanguageOpen()) {
        this.navService.isLanguageOpen.set(false);
      }
    }
  }

  // Top Action Handlers (Image 2 Red Box)
  toggleSearch(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const current = this.navService.isSearchOpen();
    this.closeAll();
    this.navService.isSearchOpen.set(!current);
    if (!current) {
      this.isImageSearchOpen.set(false);
      setTimeout(() => {
        this.searchInputRef?.nativeElement.focus();
      }, 100);
    }
  }

  toggleFullscreen(): void {
    this.navService.toggleFullscreen();
  }

  toggleNotifications(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.navService.isNotificationsOpen();
    this.closeAll();
    this.navService.isNotificationsOpen.set(!current);
  }

  toggleHistory(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.navService.isHistoryOpen();
    this.closeAll();
    this.navService.isHistoryOpen.set(!current);
  }

  toggleFavorites(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.navService.isFavoritesOpen();
    this.closeAll();
    this.navService.isFavoritesOpen.set(!current);
  }

  toggleLanguage(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.navService.isLanguageOpen();
    this.closeAll();
    this.navService.isLanguageOpen.set(!current);
  }

  toggleDarkMode(): void {
    this.navService.toggleDarkMode();
  }

  toggleProfile(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const current = this.navService.isProfileOpen();
    this.closeAll();
    this.navService.isProfileOpen.set(!current);
  }

  closeAll(): void {
    this.navService.closeAllPanels();
    this.isImageSearchOpen.set(false);
    this.stopVoiceSearch();
  }

  // Help Modal State
  isHelpModalOpen = this.navService.isHelpModalOpen;
  helpActiveTab = signal<'list' | 'add' | 'edit' | 'view' | 'history'>('list');

  toggleHelpModal(): void {
    this.navService.toggleHelpModal();
  }

  closeHelpModal(): void {
    this.navService.isHelpModalOpen.set(false);
  }

  setHelpTab(tab: 'list' | 'add' | 'edit' | 'view' | 'history'): void {
    this.helpActiveTab.set(tab);
  }

  // Voice Search with Speech-to-Text
  toggleVoiceSearch(event?: MouseEvent): void {
    if (event) event.stopPropagation();

    if (this.isListening()) {
      this.stopVoiceSearch();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.speechRecognitionObj = new SpeechRecognition();
        this.speechRecognitionObj.continuous = false;
        this.speechRecognitionObj.interimResults = true;
        this.speechRecognitionObj.lang = 'en-US';

        this.speechRecognitionObj.onstart = () => {
          this.isListening.set(true);
        };

        this.speechRecognitionObj.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          this.searchQuery.set(transcript);
        };

        this.speechRecognitionObj.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e.error);
          this.isListening.set(false);
        };

        this.speechRecognitionObj.onend = () => {
          this.isListening.set(false);
        };

        this.speechRecognitionObj.start();
      } catch (err) {
        console.warn('Speech recognition start failed, using fallback voice input:', err);
        this.simulateVoiceRecognition();
      }
    } else {
      // Graceful fallback for environments without SpeechRecognition
      this.simulateVoiceRecognition();
    }
  }

  private simulateVoiceRecognition(): void {
    this.isListening.set(true);
    const mockPhrases = ['Invoices', 'Items catalog', 'Employees', 'Stock report', 'Profit and loss'];
    const chosen = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];

    setTimeout(() => {
      this.searchQuery.set(chosen);
      this.isListening.set(false);
    }, 1200);
  }

  stopVoiceSearch(): void {
    if (this.speechRecognitionObj) {
      try {
        this.speechRecognitionObj.stop();
      } catch (_) {}
      this.speechRecognitionObj = null;
    }
    this.isListening.set(false);
  }

  // Image Search Handlers (Matching Image 2)
  toggleImageSearch(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isImageSearchOpen.update((v) => !v);
  }

  triggerUploadImage(): void {
    this.fileInputRef?.nativeElement.click();
  }

  triggerCameraCapture(): void {
    if (this.cameraInputRef?.nativeElement) {
      this.cameraInputRef.nativeElement.click();
    } else {
      this.triggerUploadImage();
    }
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processImageFile(input.files[0]);
    }
  }

  onImageDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processImageFile(event.dataTransfer.files[0]);
    }
  }

  private processImageFile(file: File): void {
    this.uploadedImageName.set(file.name);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadedImageUrl.set(e.target.result);
      // Simulate intelligent ERP OCR keyword extraction from image
      const queryFromImage = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      this.searchQuery.set(queryFromImage);
    };
    reader.readAsDataURL(file);
  }

  clearUploadedImage(): void {
    this.uploadedImageUrl.set(null);
    this.uploadedImageName.set(null);
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.clearUploadedImage();
  }

  selectSearchResult(entry: SearchEntry): void {
    this.navService.navigateTo(
      entry.moduleId,
      entry.subModuleId || '',
      entry.category,
      entry.title
    );
    this.closeAll();
  }

  askAiAgent(): void {
    const q = this.searchQuery().trim() || 'Rapid ERP assistance';
    alert(`AI Agent searching ERP database for "${q}"...`);
  }

  goToDashboard(): void {
    this.navService.navigateTo('dashboard', '', 'Dashboard', '');
  }

  goToLogin(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleCurrentFavorite(): void {
    const mod = this.navService.currentModuleId();
    const sub = this.navService.currentSubModuleId();
    const title = this.navService.currentSubModuleLabel() || this.navService.currentModuleLabel();
    this.navService.toggleFavorite(mod, sub, title, 'file-text');
  }

  isCurrentFavorite(): boolean {
    return this.navService.isFavorite(
      this.navService.currentModuleId(),
      this.navService.currentSubModuleId()
    );
  }

  // Live Chat Helper
  isLiveChatOpen = signal<boolean>(false);
  chatInput = signal<string>('');
  chatMessages = signal<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello! Welcome to Rapid ERP support. How can we assist you today?',
      time: 'Just now',
    },
  ]);

  toggleLiveChat(): void {
    this.isLiveChatOpen.update((v) => !v);
  }

  sendChatMessage(): void {
    const text = this.chatInput().trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.chatMessages.update((msgs) => [...msgs, { sender: 'user', text, time: now }]);
    this.chatInput.set('');

    setTimeout(() => {
      this.chatMessages.update((msgs) => [
        ...msgs,
        {
          sender: 'bot',
          text: `Thank you for contacting Rapid ERP support! An agent is ready to assist with "${text.slice(0, 30)}...".`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  }

  // Executive Overview Dashboard State & Metrics (Latest UI Reference)
  dashboardSearchQuery = signal<string>('');
  dashboardPeriod = signal<string>('Last 30 days');
  isDashboardDateOpen = signal<boolean>(false);
  dateRanges = ['Today', 'Last 7 days', 'Last 30 days', 'This Quarter', 'This Year'];

  toggleDashboardDateDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isDashboardDateOpen.update((v) => !v);
  }

  setDashboardPeriod(period: string): void {
    this.dashboardPeriod.set(period);
    this.isDashboardDateOpen.set(false);
  }

  // Cash Flow & Operations Time Filter (Image 4 Reference: 9M, 6M, 3M)
  cashFlowPeriod = signal<'9M' | '6M' | '3M'>('9M');
  cashFlowPeriods = ['9M', '6M', '3M'] as const;

  setCashFlowPeriod(period: '9M' | '6M' | '3M'): void {
    this.cashFlowPeriod.set(period);
    this.showToast(`Updated Cash Flow & Operations telemetry for ${period}`);
  }

  toastMessage = signal<string | null>(null);

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }

  exportReport(): void {
    this.showToast('Executive Overview analytics report exported successfully.');
  }

  // Active Orders Highlight Card (Latest UI Reference)
  activeOrders = {
    title: 'ACTIVE ORDERS',
    value: '$128.4k',
    trend: '+18.4%',
    transactions: '942 transactions today',
    target: '$140k',
    pace: '91.7% Pace'
  };

  // API & Cloud Gateway Card (Latest UI Reference)
  apiGateway = {
    title: 'API & Cloud Gateway',
    latency: '24ms Latency',
    uptime: '99.99%',
    nodes: 'Edge CDN Nodes (42)',
    sync: 'Encrypted Sync',
    status: 'All green'
  };

  // Section A - Row 1 Entity Cards
  entityRow1 = [
    {
      id: 'cat',
      shortName: 'Categories',
      count: '5',
      trend: '↑ 12% MoM',
      sub: '16 sub',
      progress: 65,
      icon: 'folder',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconColor: 'text-[#1863c0]',
    },
    {
      id: 'post',
      shortName: 'Total Posts',
      count: '3,420',
      trend: '• Steady volume',
      hasSparkline: true,
      icon: 'file-text',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600',
    },
    {
      id: 'rev',
      shortName: 'Client Re...',
      fullName: 'Client Reviews',
      count: '4.92 ★',
      rating: '98%',
      trend: '↑ 25% ratings',
      icon: 'chat',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      iconColor: 'text-amber-500',
    },
    {
      id: 'srv',
      shortName: 'Services',
      count: '6',
      badge: 'ALL ACTIVE',
      icon: 'settings',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60',
      iconColor: 'text-[#00a2e8]',
    },
    {
      id: 'pro',
      shortName: 'Projects',
      count: '24',
      trend: '• 2 in review',
      icon: 'folder-open',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'sli',
      shortName: 'Hero Slid...',
      fullName: 'Hero Sliders',
      count: '4',
      trend: 'A/B Test active',
      icon: 'image',
      iconBg: 'bg-purple-50 dark:bg-purple-950/60',
      iconColor: 'text-purple-600',
    },
  ];

  // Section A - Row 2 Entity Cards
  entityRow2 = [
    {
      id: 'faq',
      shortName: 'FAQ Data...',
      fullName: 'FAQ Database',
      count: '52',
      trend: '98% answered',
      icon: 'help-circle',
      iconBg: 'bg-teal-50 dark:bg-teal-950/60',
      iconColor: 'text-teal-600',
    },
    {
      id: 'sub',
      shortName: 'Subscrib...',
      fullName: 'Subscribers',
      count: '18.4k',
      trend: '↑ 320 this week',
      icon: 'bell',
      iconBg: 'bg-violet-50 dark:bg-violet-950/60',
      iconColor: 'text-violet-600',
    },
    {
      id: 'sol',
      shortName: 'Solutions',
      count: '8',
      trend: '↑ 18% deploy',
      icon: 'sun',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      iconColor: 'text-amber-600',
    },
    {
      id: 'ind',
      shortName: 'Industries',
      count: '7',
      trend: 'Global matrix',
      icon: 'building',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'cli',
      shortName: 'Clients & ...',
      fullName: 'Clients & Partners',
      count: '5',
      trend: '100% active SLA',
      icon: 'user',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60',
      iconColor: 'text-rose-600',
    },
    {
      id: 'tickets',
      shortName: 'Open Tic...',
      fullName: 'Open Tickets',
      count: '2',
      trend: 'Avg reply 8m',
      icon: 'clock',
      iconBg: 'bg-slate-100 dark:bg-slate-700/60',
      iconColor: 'text-slate-600 dark:text-slate-300',
    },
  ];

  // Section D - Recent Activity Log Table (Latest UI Reference)
  recentActivities = [
    {
      id: 1,
      user: 'John Doe',
      initials: 'JD',
      avatarBg: 'bg-blue-500 text-white',
      action: 'Created new country',
      module: 'COUNTRIES',
      moduleBadge: 'bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300',
      time: '2 minutes ago',
    },
    {
      id: 2,
      user: 'Sarah Wilson',
      initials: 'SW',
      avatarBg: 'bg-emerald-500 text-white',
      action: 'Updated user profile',
      module: 'USERS',
      moduleBadge: 'bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300',
      time: '5 minutes ago',
    },
    {
      id: 3,
      user: 'Mike Chen',
      initials: 'MC',
      avatarBg: 'bg-amber-500 text-white',
      action: 'Added new city',
      module: 'SERVICES',
      moduleBadge: 'bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300',
      time: '12 minutes ago',
    },
    {
      id: 4,
      user: 'Emma Davis',
      initials: 'ED',
      avatarBg: 'bg-rose-500 text-white',
      action: 'Generated report',
      module: 'REPORTS',
      moduleBadge: 'bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300',
      time: '18 minutes ago',
    },
    {
      id: 5,
      user: 'Alex Johnson',
      initials: 'AJ',
      avatarBg: 'bg-[#1863c0] text-white',
      action: 'Modified permissions',
      module: 'SECURITY',
      moduleBadge: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300',
      time: '25 minutes ago',
    },
  ];

  // Section D - System Alerts (Latest UI Reference)
  systemAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Database backup overdue',
      time: '32 minutes ago',
      bg: 'bg-amber-50/70 border-amber-200/80 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200',
      iconColor: 'text-amber-500',
    },
    {
      id: 2,
      type: 'info',
      title: 'System maintenance scheduled for tonight',
      time: '7 hours ago',
      bg: 'bg-blue-50/70 border-blue-200/80 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200',
      iconColor: 'text-[#1863c0]',
    },
    {
      id: 3,
      type: 'success',
      title: 'All services running normally',
      time: '4 hours ago',
      bg: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200',
      iconColor: 'text-emerald-500',
    },
  ];

  // Section D - Quick Stats 2x2 Grid (Latest UI Reference)
  quickStats = [
    { label: 'Database Size', value: '2.4 GB', dotColor: 'bg-blue-500' },
    { label: 'Server Load', value: '38%', badge: 'Opt', badgeColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/50' },
    { label: 'Uptime', value: '99.8%', dotColor: 'bg-emerald-500' },
    { label: 'Online Users', value: '1,247', dotColor: 'bg-cyan-500' },
  ];

  // Section E - System Performance Metrics (Latest UI Reference)
  performanceMetrics = [
    {
      title: 'CPU Usage',
      percentage: 37,
      subtitle: '8 Cores active • 2.8 GHz',
      strokeColor: '#1863c0',
      offset: 158, // 251.2 * (1 - 0.37)
    },
    {
      title: 'Memory',
      percentage: 62,
      subtitle: '9.9 GB of 16 GB',
      strokeColor: '#10b981',
      offset: 95, // 251.2 * (1 - 0.62)
    },
    {
      title: 'Storage',
      percentage: 84,
      subtitle: '420 GB of 500 GB NVMe',
      strokeColor: '#f59e0b',
      offset: 40, // 251.2 * (1 - 0.84)
    },
    {
      title: 'Network',
      percentage: 78,
      subtitle: '780 Mbps Out / 410 Mbps In',
      strokeColor: '#8b5cf6',
      offset: 55, // 251.2 * (1 - 0.78)
    },
  ];

  viewActivity(item: any): void {
    this.showToast(`Viewing activity details for ${item.user}: ${item.action}`);
  }

  editActivity(item: any): void {
    this.showToast(`Editing audit log entry for ${item.user}`);
  }

  selectEntityCard(item: any): void {
    this.showToast(`Inspecting ${item.fullName || item.shortName}: ${item.count} records`);
  }
}

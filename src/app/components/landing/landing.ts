import { Component, inject, signal, computed, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { NavigationService, SearchEntry } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private router = inject(Router);
  public navService = inject(NavigationService);
  private authService = inject(AuthService);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

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
}

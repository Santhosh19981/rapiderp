const fs = require('fs');

const gridViewTemplate = `      <!-- ========================================================================= -->
      <!-- VIEW 1: ITEM GRID VIEW (Default Landing Page - No Footer, No Right Dock)   -->
      <!-- ========================================================================= -->
      @if (activeActionView() === 'grid') {

        <!-- 1. GRID HEADER -->
        <div
          class="item-grid-header relative flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-[#f8fafc] dark:bg-slate-850/90">

          <!-- Left: Title on top, Breadcrumb below -->
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/15 via-[#00a6f4]/20 to-blue-600/15 border border-sky-200/80 dark:border-sky-800 text-[#00a6f4] flex items-center justify-center shrink-0 shadow-xs cursor-pointer">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div class="min-w-0 flex flex-col justify-center">
              <h1 class="text-[17px] sm:text-[19px] font-black text-[#00a6f4] dark:text-[#38bdf8] tracking-tight leading-none truncate cursor-default">
                Item Grid View
              </h1>
              <nav class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium leading-none mt-1 select-none" aria-label="Breadcrumb">
                <span class="hover:text-slate-600 dark:hover:text-slate-300 transition">Administrator</span>
                <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span>General</span>
                <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-slate-500 dark:text-slate-300 font-medium">Item Master</span>
                <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-[#00a6f4] font-bold truncate">Item Grid View</span>
              </nav>
            </div>
          </div>

          <!-- Right: + Add Button -->
          <div class="flex items-center gap-2 sm:gap-2.5">
            <button type="button" (click)="switchToAddMode()"
              class="h-10 px-6 sm:px-7 rounded-full border border-[#00a6f4] bg-white dark:bg-slate-800 text-[#00a6f4] hover:bg-[#00a6f4] hover:text-white text-[16px] sm:text-[18px] font-bold transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5"
              title="Add New Item">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add</span>
            </button>
          </div>
        </div>

        <!-- 2. MAIN SCROLLABLE CONTENT BODY -->
        <div class="item-grid-body flex-1 min-h-0 flex flex-col custom-scrollbar overflow-y-auto" (scroll)="onGridScroll($event)">

          <!-- 6 CAPSULE STAT SUMMARY CARDS (Exact match from Country Grid View) -->
          <div class="capsule-grid shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 xl:gap-2.5 w-full px-4 sm:px-6 pt-3 pb-2">

            <!-- 1. Total - Blue Capsule -->
            <div (click)="setGridFilter('all')"
              class="capsule-card capsule-total w-full h-[50px] rounded-full flex items-center cursor-pointer transition select-none"
              [class.ring-2]="activeGridFilter() === 'all'" [class.ring-[#00a6f4]]="activeGridFilter() === 'all'">
              <div class="capsule-circle-icon circle-total w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0">
                <span class="text-white font-black text-lg leading-none select-none">&#931;</span>
              </div>
              <div class="flex items-center justify-between flex-1 ml-1.5 mr-2.5 min-w-0">
                <span class="capsule-title whitespace-nowrap">Total</span>
                <span class="capsule-count shrink-0 ml-1">{{ totalItemsCount() }}</span>
              </div>
            </div>

            <!-- 2. Active - Mint Green Capsule -->
            <div (click)="setGridFilter('Active')"
              class="capsule-card capsule-active w-full h-[50px] rounded-full flex items-center cursor-pointer transition select-none"
              [class.ring-2]="activeGridFilter() === 'Active'" [class.ring-emerald-500]="activeGridFilter() === 'Active'">
              <div class="capsule-circle-icon circle-active w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </div>
              <div class="flex items-center justify-between flex-1 ml-1.5 mr-2.5 min-w-0">
                <span class="capsule-title whitespace-nowrap">Active</span>
                <span class="capsule-count shrink-0 ml-1">{{ activeItemsCount() }}</span>
              </div>
            </div>

            <!-- 3. Inactive - Teal Capsule -->
            <div (click)="setGridFilter('Inactive')"
              class="capsule-card capsule-inactive w-full h-[50px] rounded-full flex items-center cursor-pointer transition select-none"
              [class.ring-2]="activeGridFilter() === 'Inactive'" [class.ring-teal-500]="activeGridFilter() === 'Inactive'">
              <div class="capsule-circle-icon circle-inactive w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <div class="flex items-center justify-between flex-1 ml-1.5 mr-2.5 min-w-0">
                <span class="capsule-title whitespace-nowrap">Inactive</span>
                <span class="capsule-count shrink-0 ml-1">{{ inactiveItemsCount() }}</span>
              </div>
            </div>

            <!-- 4. Draft - Yellow Capsule -->
            <div (click)="setGridFilter('Draft')"
              class="capsule-card capsule-draft w-full h-[50px] rounded-full flex items-center cursor-pointer transition select-none"
              [class.ring-2]="activeGridFilter() === 'Draft'" [class.ring-amber-500]="activeGridFilter() === 'Draft'">
              <div class="capsule-circle-icon circle-draft w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="13" y2="17" />
                </svg>
              </div>
              <div class="flex items-center justify-between flex-1 ml-1.5 mr-2.5 min-w-0">
                <span class="capsule-title whitespace-nowrap">Draft</span>
                <span class="capsule-count shrink-0 ml-1">{{ draftItemsCount() }}</span>
              </div>
            </div>

            <!-- 5. Updated - Purple Capsule -->
            <div (click)="setGridFilter('updated')"
              class="capsule-card capsule-updated w-full h-[50px] rounded-full flex items-center cursor-pointer transition select-none hover:shadow-md"
              [class.ring-2]="activeGridFilter() === 'updated'" [class.ring-purple-500]="activeGridFilter() === 'updated'"
              title="Recently updated items (30 mins)">
              <div class="capsule-circle-icon circle-updated w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div class="flex items-center justify-between flex-1 ml-1.5 mr-2.5 min-w-0">
                <span class="capsule-title whitespace-nowrap">Updated</span>
                <span class="text-[11px] sm:text-xs font-black text-[#4E516C] shrink-0 whitespace-nowrap ml-1">{{ lastUpdatedTime() }}</span>
              </div>
            </div>

            <!-- 6. Recycle Bin - Red-Coral Capsule -->
            <div (click)="setGridFilter('deleted')"
              class="capsule-card capsule-deleted w-full h-[50px] rounded-full flex items-center cursor-pointer transition select-none hover:shadow-md"
              [class.ring-2]="activeGridFilter() === 'deleted'" [class.ring-rose-500]="activeGridFilter() === 'deleted'"
              title="View Recycle Bin (40 mins)">
              <div class="capsule-circle-icon circle-deleted w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div class="flex items-center justify-between flex-1 ml-1.5 mr-2.5 min-w-0">
                <span class="capsule-title whitespace-nowrap">Recycle Bin</span>
                <span class="text-[11px] sm:text-xs font-black text-[#4E516C] shrink-0 whitespace-nowrap ml-1">{{ lastDeletedTime() }}</span>
              </div>
            </div>

          </div>

          <!-- CONTROLS TOOLBAR (Exact layout from Country Grid View) -->
          <div class="shrink-0 flex items-center justify-between gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-700">
            <!-- Left: Count -->
            <div class="flex items-center gap-2 shrink-0 min-w-0">
              <span class="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Showing <strong class="font-bold text-black dark:text-white">{{ displayedGridItems().length }}</strong> of
                <strong class="font-bold text-black dark:text-white">{{ filteredGridItems().length }}</strong> items
              </span>
            </div>

            <!-- Center: Search Input with Voice Mic -->
            <div class="relative flex-1 max-w-md mx-2">
              <input type="text" [ngModel]="gridSearchQuery()" (ngModelChange)="gridSearchQuery.set($event)"
                placeholder="Search items by name, SKU, category, brand..."
                class="w-full h-8 sm:h-9 pl-9 pr-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#00a6f4] focus:ring-2 focus:ring-[#00a6f4]/20 shadow-2xs transition" />
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button type="button" (click)="toggleGridVoiceSearch($event)"
                [title]="isGridVoiceListening() ? 'Listening...' : 'Voice Search'"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00a6f4] p-1 rounded-full cursor-pointer focus:outline-none transition-colors"
                [class.text-red-500]="isGridVoiceListening()"
                [class.animate-pulse]="isGridVoiceListening()">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>

            <!-- Right: View Switchers (Overview + List) -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="flex items-center bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-full border border-slate-200/80 dark:border-slate-600 shrink-0">
                <button type="button" (click)="handleOverviewClick()"
                  class="h-7 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  title="Overview Dashboard">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                  <span>Overview</span>
                </button>
                <button type="button" (click)="handleTableClick()"
                  class="h-7 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#00a6f4]"
                  title="List / Table View">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6" stroke-linecap="round" />
                    <line x1="8" y1="12" x2="21" y2="12" stroke-linecap="round" />
                    <line x1="8" y1="18" x2="21" y2="18" stroke-linecap="round" />
                    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          <!-- CARDS GRID (Exact 1:1 Country Grid View card style, populated with Item Master data) -->
          <div class="p-3 sm:p-5 flex-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 p-1.5 pb-4">
              @for (item of displayedGridItems(); track item.itemId) {
              <div (click)="openEditFromGrid(item)" class="country-card select-none group/card">

                <!-- Floating Hover Actions: Edit, Delete, Status Toggle -->
                <div class="card-hover-actions" (click)="$event.stopPropagation()">
                  <!-- Edit Icon -->
                  <button type="button" (click)="openEditFromGrid(item, $event)"
                    class="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-[#00a6f4] hover:bg-sky-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Edit Item">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>

                  <!-- Delete Icon -->
                  <button type="button" (click)="deleteItemFromGrid(item, $event)"
                    class="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Delete Item">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <!-- Status Toggle Icon -->
                  <button type="button" (click)="toggleItemStatusInGrid(item, $event)"
                    class="w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer"
                    [class.text-slate-400]="item.status === 'Active'" [class.hover:text-rose-500]="item.status === 'Active'"
                    [class.hover:bg-rose-50]="item.status === 'Active'"
                    [class.dark:hover:bg-slate-700]="item.status === 'Active'"
                    [class.text-emerald-500]="item.status !== 'Active'"
                    [class.hover:bg-emerald-50]="item.status !== 'Active'"
                    [class.dark:hover:bg-emerald-950/40]="item.status !== 'Active'"
                    [title]="item.status === 'Active' ? 'Set Inactive': 'Set Active'">
                    @if (item.status === 'Active') {
                    <svg class="w-4 h-4 text-slate-400 hover:text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    } @else {
                    <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    }
                  </button>
                </div>

                <!-- Top Row - Item Icon + Item Name -->
                <div class="flex items-center gap-2 w-full min-w-0 pr-1">
                  <div class="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 text-[#00a6f4] flex items-center justify-center shrink-0">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>
                  <h3
                    class="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 group-hover/card:text-[#00a6f4] dark:group-hover/card:text-[#38bdf8] transition-colors truncate max-w-full group-hover/card:max-w-[calc(100%-105px)]"
                    [title]="item.nameEn">
                    {{ item.nameEn }}
                  </h3>
                </div>

                <!-- Middle Row - Sales Price and Status -->
                <div class="grid grid-cols-2 gap-2 w-full">
                  <!-- Sales Price - Left -->
                  <div class="min-w-0">
                    <div
                      class="text-[10px] text-slate-400 dark:text-slate-500 group-hover/card:text-[#00a6f4] dark:group-hover/card:text-[#38bdf8] font-medium leading-tight mb-0.5 transition-colors">
                      Sales Price
                    </div>
                    <div class="text-[12px] font-medium text-slate-800 dark:text-slate-100 truncate">
                      {{ item.currency || 'AED' }} {{ item.salesPrice }}
                    </div>
                  </div>

                  <!-- Status - Right -->
                  <div class="text-right min-w-0 cursor-pointer" (click)="toggleItemStatusInGrid(item, $event)"
                    [title]="'Status: ' + item.status + ' (Click to toggle)'">
                    <div
                      class="text-[10px] text-slate-400 dark:text-slate-500 group-hover/card:text-[#00a6f4] dark:group-hover/card:text-[#38bdf8] font-medium leading-tight mb-0.5 transition-colors">
                      Status
                    </div>
                    <span
                      class="inline-block text-[11px] font-bold"
                      [class.text-emerald-500]="item.status === 'Active'"
                      [class.text-slate-400]="item.status === 'Inactive'"
                      [class.text-amber-500]="item.status === 'Draft'">
                      {{ item.status }}
                    </span>
                  </div>
                </div>

                <!-- Bottom Row - SKU and Category -->
                <div class="grid grid-cols-2 gap-2 w-full pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                  <!-- SKU - Left -->
                  <div class="min-w-0">
                    <div
                      class="text-[10px] text-slate-400 dark:text-slate-500 group-hover/card:text-[#00a6f4] dark:group-hover/card:text-[#38bdf8] font-medium leading-tight mb-0.5 transition-colors">
                      SKU
                    </div>
                    <div class="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 truncate">
                      {{ item.sku }}
                    </div>
                  </div>

                  <!-- Category - Right -->
                  <div class="text-right min-w-0">
                    <div
                      class="text-[10px] text-slate-400 dark:text-slate-500 group-hover/card:text-[#00a6f4] dark:group-hover/card:text-[#38bdf8] font-medium leading-tight mb-0.5 transition-colors">
                      Category
                    </div>
                    <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate" [title]="item.category">
                      {{ item.category }}
                    </div>
                  </div>
                </div>

              </div>
              }
            </div>

            <!-- Empty State if no items -->
            @if (filteredGridItems().length === 0) {
            <div class="py-12 flex flex-col items-center justify-center text-center">
              <div class="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 text-[#00a6f4] flex items-center justify-center mb-3">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">No items match the selected filter</h4>
              <p class="text-xs text-slate-400 mt-1 max-w-xs">Try selecting a different status capsule above or clearing the search query.</p>
              <button type="button" (click)="setGridFilter('all'); gridSearchQuery.set('')"
                class="mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-[#00a6f4] border border-[#00a6f4] hover:bg-[#00a6f4] hover:text-white transition cursor-pointer">
                Show All Items
              </button>
            </div>
            }
          </div>

        </div>

      } @else {
`;

let content = fs.readFileSync('src/app/components/item/item.html', 'utf8');

// Target 1: Insert grid view right after opening of item-shell
const shellStart = '<div\r\n      class="item-shell flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-[#E2E4EB] dark:border-slate-700 overflow-hidden shadow-xs">';
const shellStartLF = '<div\n      class="item-shell flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-[#E2E4EB] dark:border-slate-700 overflow-hidden shadow-xs">';

let isLF = false;
let idx = content.indexOf(shellStart);
if (idx === -1) {
  idx = content.indexOf(shellStartLF);
  isLF = true;
}

if (idx === -1) {
  console.error('Could not find item-shell start');
  process.exit(1);
}

const matchStr = isLF ? shellStartLF : shellStart;
const beforeShell = content.substring(0, idx + matchStr.length);
let afterShell = content.substring(idx + matchStr.length);

// Also remove old inner grid section:
// Find '} @else if (activeActionView() === 'grid') {' and replace with comment or empty
const oldGridStart = isLF ? "} @else if (activeActionView() === 'grid') {" : "} @else if (activeActionView() === 'grid') {";
const oldGridIdx = afterShell.indexOf(oldGridStart);
const tableStart = isLF ? "} @else if (activeActionView() === 'table') {" : "} @else if (activeActionView() === 'table') {";
const tableIdx = afterShell.indexOf(tableStart);

if (oldGridIdx !== -1 && tableIdx !== -1 && tableIdx > oldGridIdx) {
  console.log('Found inner old grid view, cleaning it up');
  afterShell = afterShell.substring(0, oldGridIdx) + afterShell.substring(tableIdx);
}

const newContent = beforeShell + (isLF ? '\n' : '\r\n') + gridViewTemplate + afterShell;

// Write to scratch first to check
fs.writeFileSync('scratch/test_item.html', newContent, 'utf8');
console.log('Wrote scratch/test_item.html, validating blocks...');

const lines = newContent.split(/\r?\n/);
let stack = [];
lines.forEach((line, lineIdx) => {
  const lineNum = lineIdx + 1;
  const ifMatches = line.match(/@(?:if|for|defer|switch)\b/g);
  if (ifMatches) {
    ifMatches.forEach(() => stack.push({ line: lineNum, text: line.trim() }));
  }
  const trimmed = line.trim();
  if (trimmed === '}' || trimmed.startsWith('} @else')) {
    const popped = stack.pop();
    if (!popped) {
      console.log('Extra closing brace at line ' + lineNum);
    }
  }
});
console.log('Unclosed blocks in test_item.html:', stack.length);
if (stack.length > 0) {
  console.log('Remaining unclosed:', stack);
}

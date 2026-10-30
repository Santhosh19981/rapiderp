const fs = require('fs');

const itemHtmlPath = 'src/app/components/item/item.html';
let content = fs.readFileSync(itemHtmlPath, 'utf8');

// 1. Target start of activeActionView === 'grid'
const targetStart = `@if (activeActionView() === 'grid') {\n\n        <!-- 1. GRID HEADER -->`;
if (!content.includes(targetStart)) {
  console.error('Target start not found!');
  process.exit(1);
}

// 2. Target end of grid section before @else {
const targetEnd = `      } @else {\n\n\n      <!-- ========================================================================= -->\n      <!-- 1. TOP HEADER: Title, Breadcrumb & Record Navigation Pager`;
if (!content.includes(targetEnd)) {
  console.error('Target end not found!');
  process.exit(1);
}

// Read the grid section body to preserve and update with images
const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

// Inside grid cards, replace the svg icon box with product photo:
const oldCardIcon = `<div class="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 text-[#00a6f4] flex items-center justify-center shrink-0">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>`;

const newCardImage = `<div class="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-2xs">
                    <img [src]="item.productImage" [alt]="item.nameEn"
                      (error)="onItemImageError($event, item)"
                      class="w-full h-full object-cover rounded-lg" />
                  </div>`;

// Extract everything from `<div class="country-body flex-1 min-h-0 flex flex-col custom-scrollbar` to `</div>\n\n        </div>`
const bodyStart = content.indexOf('<div class="country-body flex-1 min-h-0 flex flex-col custom-scrollbar', startIndex);
let gridBody = content.substring(bodyStart, endIndex);

// Replace card icon with image
gridBody = gridBody.replace(oldCardIcon, newCardImage);

const newHeaderAndSharedViews = `@if (activeActionView() === 'grid' || activeActionView() === 'table') {

        <!-- 1. MODULE HEADER (Shared between Grid & List View with Video Tutorial) -->
        <div
          class="item-grid-header relative flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 h-14 sm:h-16 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-[#f8fafc] dark:bg-slate-850/90">

          <!-- Left: Title on top, Breadcrumb below -->
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <!-- Video / Tutorial Play Button -->
            <button type="button" (click)="openVideoTutorial()" title="Tutorial"
              class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#00a6f4] via-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-[#00a6f4]/30 hover:scale-105 hover:shadow-lg transition cursor-pointer">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            </button>
            <div class="min-w-0 flex flex-col justify-center">
              <div class="flex items-center gap-2">
                <h1 class="text-[15px] sm:text-[19px] font-black text-[#00a6f4] dark:text-[#38bdf8] tracking-tight leading-none truncate cursor-default">
                  {{ activeActionView() === 'grid' ? 'Item Grid View' : 'Item List View' }}
                </h1>
                <!-- Video play icon button right beside title text -->
                <button type="button" (click)="openVideoTutorial()" title="Tutorial"
                  class="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#00a6f4] hover:bg-[#00a6f4] hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs">
                  <svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </button>
              </div>
              <nav class="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium leading-none mt-1 select-none" aria-label="Breadcrumb">
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
                <span class="text-[#00a6f4] font-bold truncate">
                  {{ activeActionView() === 'grid' ? 'Item Grid View' : 'Item List View' }}
                </span>
              </nav>
            </div>
          </div>

          <!-- Right: + Add Button -->
          <div class="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button type="button" (click)="switchToAddMode()"
              class="h-8.5 sm:h-10 px-3.5 sm:px-7 rounded-full border border-[#00a6f4] bg-white dark:bg-slate-800 text-[#00a6f4] hover:bg-[#00a6f4] hover:text-white text-xs sm:text-[18px] font-bold transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
              title="Add">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add</span>
            </button>
          </div>
        </div>

        @if (activeActionView() === 'grid') {
` + gridBody + `
        } @else {
          <!-- ========================================================================= -->
          <!-- VIEW 2: ITEM LIST VIEW (1:1 Exact Replica of Country List View)           -->
          <!-- ========================================================================= -->
          <div class="flex-1 min-h-0 flex flex-col md:overflow-hidden bg-[#f8fafc] dark:bg-slate-900">

            <!-- CONTROLS TOOLBAR (1:1 Exact match to Country List View Toolbar) -->
            <div class="shrink-0 flex items-center justify-between gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
              <!-- Left Zone: Import, Visibility, History, Recycle Bin -->
              <div class="flex items-center gap-2 shrink-0 min-w-0">
                <button type="button" (click)="openImportModal()"
                  class="h-[32px] px-3.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                  title="Import">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="12" x2="12" y2="3" />
                  </svg>
                  <span>Import</span>
                </button>

                <button type="button" (click)="toggleVisibilityPanel($event)"
                  class="h-[32px] px-3.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  [class.bg-[#00a6f4]]="isVisibilityOpen()" [class.text-white]="isVisibilityOpen()"
                  [class.border-[#00a6f4]]="isVisibilityOpen()" [class.border-slate-300]="!isVisibilityOpen()"
                  [class.dark:border-slate-600]="!isVisibilityOpen()" [class.bg-white]="!isVisibilityOpen()"
                  [class.dark:bg-slate-800]="!isVisibilityOpen()" [class.text-slate-700]="!isVisibilityOpen()"
                  [class.dark:text-slate-200]="!isVisibilityOpen()" [class.hover:bg-slate-50]="!isVisibilityOpen()"
                  [class.dark:hover:bg-slate-700]="!isVisibilityOpen()"
                  title="Visibility">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Visibility</span>
                </button>

                <button type="button" (click)="openHistoryModal('all')"
                  class="h-[32px] px-3.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                  title="History">
                  <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>History</span>
                </button>

                <button type="button" (click)="openRecycleBinModal()"
                  class="h-[32px] px-3.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  [class.bg-rose-50]="activeGridFilter() === 'deleted'"
                  [class.border-rose-400]="activeGridFilter() === 'deleted'"
                  [class.text-rose-600]="activeGridFilter() === 'deleted'"
                  [class.border-slate-300]="activeGridFilter() !== 'deleted'"
                  [class.dark:border-slate-600]="activeGridFilter() !== 'deleted'"
                  [class.bg-white]="activeGridFilter() !== 'deleted'"
                  [class.dark:bg-slate-800]="activeGridFilter() !== 'deleted'"
                  [class.text-slate-700]="activeGridFilter() !== 'deleted'"
                  [class.dark:text-slate-200]="activeGridFilter() !== 'deleted'"
                  [class.hover:bg-slate-50]="activeGridFilter() !== 'deleted'" title="Recycle">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span>Recycle Bin</span>
                  <span class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    4
                  </span>
                </button>
              </div>

              <!-- Center Zone: Centered Search Input with voice mic -->
              <div class="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4 relative flex items-center">
                <input type="text" [ngModel]="itemListSearchQuery()"
                  (ngModelChange)="itemListSearchQuery.set($event)" placeholder="Search" autofocus
                  class="w-full h-8 sm:h-9 pl-9 pr-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#00a6f4] focus:ring-2 focus:ring-[#00a6f4]/20 shadow-2xs transition" />
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button type="button" (click)="toggleGridVoiceSearch($event)"
                  [title]="isGridVoiceListening() ? 'Listening' : 'Voice'"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00a6f4] p-1 rounded-full cursor-pointer focus:outline-none transition-colors"
                  [class.text-red-500]="isGridVoiceListening()"
                  [class.animate-pulse]="isGridVoiceListening()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>

              <!-- Right Zone: Overview + Grid switcher, Share, Export, Filter -->
              <div class="flex items-center gap-2 shrink-0">
                <div class="flex items-center bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-full border border-slate-200/80 dark:border-slate-600 shrink-0">
                  <button type="button" (click)="handleOverviewClick()"
                    class="h-7 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    title="Overview">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="7" height="9" x="3" y="3" rx="1" />
                      <rect width="7" height="5" x="14" y="3" rx="1" />
                      <rect width="7" height="9" x="14" y="12" rx="1" />
                      <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                    <span>Overview</span>
                  </button>

                  <button type="button" (click)="handleGridClick()"
                    class="h-7 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#00a6f4]"
                    title="Grid">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>Grid</span>
                  </button>
                </div>

                <span class="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></span>

                <button type="button" (click)="toggleSharePanel()"
                  class="h-[32px] px-3.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                  title="Share">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share</span>
                </button>

                <button type="button" (click)="toggleExportPanel()"
                  class="h-[32px] px-3.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                  title="Export">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Export</span>
                </button>

                <button type="button" (click)="toggleFilterPanel()"
                  class="h-[32px] px-3.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                  title="Filter">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>Filter</span>
                </button>
              </div>
            </div>

            <!-- Bulk actions sub-bar -->
            @if (selectedItemIds().size > 0) {
            <div class="flex items-center gap-2.5 px-6 py-2 bg-transparent shrink-0">
              <button type="button" (click)="bulkDeleteItems()"
                class="px-4 py-1.5 rounded-full bg-[#dff3fd] hover:bg-[#cbeafe] text-[#0284c7] dark:bg-sky-950/50 dark:text-sky-300 font-semibold text-xs transition cursor-pointer">
                Bulk Delete
              </button>
              <button type="button" (click)="bulkUpdateItems()"
                class="px-4 py-1.5 rounded-full bg-[#dff3fd] hover:bg-[#cbeafe] text-[#0284c7] dark:bg-sky-950/50 dark:text-sky-300 font-semibold text-xs transition cursor-pointer">
                Bulk Update
              </button>
              <span class="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">
                Selected {{ selectedItemIds().size }} of total {{ filteredItemList().length }}
              </span>
            </div>
            }

            <!-- Main Table Wrapper -->
            <div class="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 overflow-hidden">
              <div class="flex-1 min-w-0 md:min-h-0 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E4EB] dark:border-slate-700 overflow-hidden shadow-xs">
                <!-- Rows Scrollable Table -->
                <div class="country-table-scroll overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  <table class="country-table w-full text-start text-xs min-w-[1250px]">
                    <thead>
                      <tr class="ag-header-row border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[12px] font-semibold bg-[#f8fafc] dark:bg-slate-800/90 select-none">
                        <th class="col-select sticky-col w-12 py-3 px-3 text-center bg-[#f8fafc] dark:bg-slate-800">
                          <label class="custom-checkbox-wrap">
                            <input type="checkbox" class="sr-only custom-checkbox-input"
                              [checked]="isPageAllSelected()" [indeterminate]="isPagePartlySelected()"
                              (change)="togglePageSelection()" title="Select" />
                            <span class="custom-checkbox-box">
                              <svg class="custom-checkbox-icon check-icon" viewBox="0 0 16 16" fill="none"
                                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
                              </svg>
                            </span>
                          </label>
                        </th>
                        <th class="py-3 px-4 text-left font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('nameEn')">
                          <span class="flex items-center gap-1.5">
                            Item Name
                            @if (tableSortKey() === 'nameEn') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-left font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('sku')">
                          <span class="flex items-center gap-1.5">
                            SKU / Code
                            @if (tableSortKey() === 'sku') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-left font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('itemType')">
                          <span class="flex items-center gap-1.5">
                            Item Type
                            @if (tableSortKey() === 'itemType') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-left font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('category')">
                          <span class="flex items-center gap-1.5">
                            Category
                            @if (tableSortKey() === 'category') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-left font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('brand')">
                          <span class="flex items-center gap-1.5">
                            Brand
                            @if (tableSortKey() === 'brand') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-left font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('baseUom')">
                          <span class="flex items-center gap-1.5">
                            Base UOM
                            @if (tableSortKey() === 'baseUom') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-right font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('salesPrice')">
                          <span class="flex items-center justify-end gap-1.5">
                            Sales Price
                            @if (tableSortKey() === 'salesPrice') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-right font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('costPrice')">
                          <span class="flex items-center justify-end gap-1.5">
                            Cost Price
                            @if (tableSortKey() === 'costPrice') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-right font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('marginPct')">
                          <span class="flex items-center justify-end gap-1.5">
                            Margin %
                            @if (tableSortKey() === 'marginPct') {
                              <span class="text-xs">{{ tableSortDir() === 'asc' ? 'â–²' : 'â–¼' }}</span>
                            }
                          </span>
                        </th>
                        <th class="py-3 px-3 text-center font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8] cursor-pointer" (click)="toggleTableSort('status')">
                          Status
                        </th>
                        <th class="col-action py-3 px-3.5 text-center font-bold text-[12px] text-[#00a6f4] dark:text-[#38bdf8]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                      @for (item of pagedItemList(); track item.itemId; let rIdx = $index) {
                      <tr (click)="openEditFromGrid(item)"
                        class="group hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                        [class.bg-sky-50/60]="selectedItemIds().has(item.itemId)">
                        <!-- Select Checkbox -->
                        <td class="py-3 px-3 text-center" (click)="$event.stopPropagation()">
                          <label class="custom-checkbox-wrap">
                            <input type="checkbox" class="sr-only custom-checkbox-input"
                              [checked]="selectedItemIds().has(item.itemId)"
                              (change)="toggleRowSelection(item.itemId)" />
                            <span class="custom-checkbox-box">
                              <svg class="custom-checkbox-icon check-icon" viewBox="0 0 16 16" fill="none"
                                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
                              </svg>
                            </span>
                          </label>
                        </td>

                        <!-- Item Name (Image Thumbnail + Name) -->
                        <td class="py-2.5 px-4">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-2xs">
                              <img [src]="item.productImage" [alt]="item.nameEn"
                                (error)="onItemImageError($event, item)"
                                class="w-full h-full object-cover rounded-lg" />
                            </div>
                            <div class="min-w-0">
                              <div class="font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#00a6f4] transition-colors truncate max-w-[240px]" [title]="item.nameEn">
                                {{ item.nameEn }}
                              </div>
                              @if (item.nameAr) {
                              <div class="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[220px]">
                                {{ item.nameAr }}
                              </div>
                              }
                            </div>
                          </div>
                        </td>

                        <!-- SKU / Code -->
                        <td class="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {{ item.sku }}
                        </td>

                        <!-- Item Type -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {{ item.itemType || 'Stock Item' }}
                          </span>
                        </td>

                        <!-- Category -->
                        <td class="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {{ item.category }}
                        </td>

                        <!-- Brand -->
                        <td class="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {{ item.brand || 'â€”' }}
                        </td>

                        <!-- Base UOM -->
                        <td class="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {{ item.baseUom }}
                        </td>

                        <!-- Sales Price -->
                        <td class="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          AED {{ item.salesPrice | number:'1.2-2' }}
                        </td>

                        <!-- Cost Price -->
                        <td class="py-3 px-3 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          AED {{ item.costPrice | number:'1.2-2' }}
                        </td>

                        <!-- Margin % -->
                        <td class="py-3 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {{ item.marginPct || 38.82 }}%
                        </td>

                        <!-- Status Pill (Exact 1:1 Country List View Badge) -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                            [class.bg-emerald-50]="item.status === 'Active'"
                            [class.text-emerald-600]="item.status === 'Active'"
                            [class.border-emerald-200]="item.status === 'Active'"
                            [class.dark:bg-emerald-950/40]="item.status === 'Active'"
                            [class.dark:text-emerald-400]="item.status === 'Active'"
                            [class.dark:border-emerald-800]="item.status === 'Active'"
                            [class.bg-rose-50]="item.status === 'Inactive'"
                            [class.text-rose-600]="item.status === 'Inactive'"
                            [class.border-rose-200]="item.status === 'Inactive'"
                            [class.dark:bg-rose-950/40]="item.status === 'Inactive'"
                            [class.dark:text-rose-400]="item.status === 'Inactive'"
                            [class.dark:border-rose-800]="item.status === 'Inactive'"
                            [class.bg-sky-50]="item.status === 'Draft'"
                            [class.text-[#00a6f4]]="item.status === 'Draft'"
                            [class.border-sky-200]="item.status === 'Draft'"
                            [class.dark:bg-sky-950/40]="item.status === 'Draft'"
                            [class.dark:text-[#38bdf8]]="item.status === 'Draft'"
                            [class.dark:border-sky-800]="item.status === 'Draft'">
                            <span class="w-1.5 h-1.5 rounded-full"
                              [class.bg-emerald-500]="item.status === 'Active'"
                              [class.bg-rose-500]="item.status === 'Inactive'"
                              [class.bg-[#00a6f4]]="item.status === 'Draft'"></span>
                            {{ item.status }}
                          </span>
                        </td>

                        <!-- Action (Relative time + Hover actions) -->
                        <td class="py-3 px-3.5 text-center whitespace-nowrap" (click)="$event.stopPropagation()">
                          <div class="flex items-center justify-center gap-1.5">
                            <span class="text-xs text-slate-500 dark:text-slate-400 group-hover:hidden">
                              {{ getItemRelativeTime(item, rIdx) }}
                            </span>
                            <div class="hidden group-hover:flex items-center gap-1">
                              <button type="button" (click)="openEditFromGrid(item, $event)"
                                class="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-[#00a6f4] hover:bg-sky-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                title="Edit">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                              <button type="button" (click)="deleteItemFromGrid(item, $event)"
                                class="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                title="Delete">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      } @empty {
                      <tr>
                        <td colspan="12" class="py-12 text-center text-slate-400 text-xs font-semibold">
                          No items match the search query.
                        </td>
                      </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Bottom Pagination (Exact 1:1 replica of Country List View Pagination) -->
                <div class="relative z-30 shrink-0 flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <!-- Left: Page Size Selectors (10, 25, 50, 75, ...) -->
                  <div class="flex items-center space-x-2 relative">
                    @for (size of pageSizeOptions; track size) {
                    <button type="button" (click)="setPageSize(size)"
                      class="h-8 min-w-[60px] px-4 rounded-full border text-sm font-medium cursor-pointer transition-all flex items-center justify-center select-none shadow-xs"
                      [class.border-[#0070ba]]="pageSize() === size" [class.bg-[#0070ba]]="pageSize() === size"
                      [class.text-white]="pageSize() === size" [class.hover:bg-[#005a96]]="pageSize() === size"
                      [class.border-sky-300]="pageSize() !== size" [class.bg-white]="pageSize() !== size"
                      [class.text-sky-500]="pageSize() !== size" [class.hover:bg-[#0070ba]]="pageSize() !== size"
                      [class.hover:border-[#0070ba]]="pageSize() !== size"
                      [class.hover:text-white]="pageSize() !== size" [class.dark:bg-slate-800]="pageSize() !== size"
                      [class.dark:text-white]="pageSize() !== size" [class.dark:border-sky-800]="pageSize() !== size">
                      {{ size }}
                    </button>
                    }

                    <!-- '...' more page sizes button -->
                    <div class="relative" data-popover>
                      <button type="button" (click)="togglePageSizeMenu($event)"
                        class="h-8 min-w-[60px] px-4 rounded-full border text-sm font-medium cursor-pointer transition-all flex items-center justify-center select-none shadow-xs"
                        [class.border-[#0070ba]]="isPageSizeMenuOpen() || pageSize() > 75"
                        [class.bg-[#0070ba]]="isPageSizeMenuOpen() || pageSize() > 75"
                        [class.text-white]="isPageSizeMenuOpen() || pageSize() > 75"
                        [class.border-sky-300]="!isPageSizeMenuOpen() && pageSize() <= 75"
                        [class.bg-white]="!isPageSizeMenuOpen() && pageSize() <= 75"
                        [class.text-sky-500]="!isPageSizeMenuOpen() && pageSize() <= 75"
                        title="Rows">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                          <circle cx="19" cy="12" r="1.5" fill="currentColor"></circle>
                          <circle cx="5" cy="12" r="1.5" fill="currentColor"></circle>
                        </svg>
                      </button>

                      <!-- Extended page size popup menu -->
                      @if (isPageSizeMenuOpen()) {
                      <div class="absolute bottom-full mb-3 left-0 w-36 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-sky-200 dark:border-slate-700 p-3 flex flex-col gap-2 z-40 animate-in fade-in duration-150">
                        @for (opt of extendedPageSizes; track opt) {
                        <button type="button" (click)="selectExtendedPageSize(opt)"
                          class="w-full py-1.5 px-3 rounded-full border border-sky-200 dark:border-slate-700 text-[#0070ba] text-xs font-bold hover:bg-[#e6f6fe] dark:hover:bg-slate-700 transition text-center cursor-pointer"
                          [class.bg-[#e6f6fe]]="pageSize() === opt">
                          {{ opt }}
                        </button>
                        }
                        @if (!isCustomPageSizeOpen()) {
                        <button type="button" (click)="isCustomPageSizeOpen.set(true)"
                          class="w-full py-1.5 px-3 rounded-full border border-sky-200 dark:border-slate-700 text-[#0070ba] text-xs font-bold hover:bg-[#e6f6fe] dark:hover:bg-slate-700 transition text-center cursor-pointer">
                          Custom
                        </button>
                        } @else {
                        <div class="flex flex-col gap-1.5 pt-1 border-t border-sky-100 dark:border-slate-700">
                          <div class="flex items-center gap-1.5">
                            <input type="number" min="10" max="999" [value]="customPageSizeInput()"
                              (input)="onCustomPageSizeChange($any($event.target).value)"
                              (keydown.enter)="isCustomPageSizeValid() && applyCustomPageSize()"
                              placeholder="10 - 999" autofocus
                              class="w-20 px-2.5 py-1 text-center rounded-full border text-xs font-semibold focus:outline-none bg-white dark:bg-slate-750"
                              [class.border-rose-400]="pageSizeErrorMessage() && customPageSizeInput()"
                              [class.text-rose-600]="pageSizeErrorMessage() && customPageSizeInput()"
                              [class.border-sky-300]="!pageSizeErrorMessage() || !customPageSizeInput()"
                              [class.text-[#0070ba]]="!pageSizeErrorMessage() || !customPageSizeInput()" />
                            <button type="button" (click)="applyCustomPageSize()"
                              [disabled]="!isCustomPageSizeValid()" [class.opacity-40]="!isCustomPageSizeValid()"
                              class="flex-1 py-1 px-2.5 rounded-full bg-[#0070ba] text-white text-xs font-bold transition shadow-2xs">
                              Go
                            </button>
                          </div>
                        </div>
                        }
                      </div>
                      }
                    </div>
                  </div>

                  <!-- Center: Range Label -->
                  <div class="text-sm text-gray-600 dark:text-slate-300 font-normal select-none">
                    {{ pageRangeLabel() }}
                  </div>

                  <!-- Right: Pagination Navigation Controls -->
                  <div class="flex items-center space-x-2">
                    <!-- First Page (Â«) -->
                    <button type="button" (click)="goToPage(1)" [disabled]="currentPage() === 1"
                      class="h-8 px-3.5 min-w-[44px] rounded-full flex items-center justify-center bg-sky-200 border border-sky-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 hover:bg-[#0070ba] hover:border-[#0070ba] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-xs"
                      title="First" aria-label="First page">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m11 17-5-5 5-5" />
                        <path d="m18 17-5-5 5-5" />
                      </svg>
                    </button>

                    <!-- Previous Page (â€¹) -->
                    <button type="button" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
                      class="h-8 px-3.5 min-w-[44px] rounded-full flex items-center justify-center bg-sky-200 border border-sky-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 hover:bg-[#0070ba] hover:border-[#0070ba] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-xs"
                      title="Previous" aria-label="Previous page">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>

                    <!-- Active Page Number Pill -->
                    <div class="relative z-50" data-popover>
                      <div (click)="togglePageDropdown($event)"
                        class="h-8 w-16 px-2 rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer select-none transition hover:border-[#0070ba] shadow-xs"
                        title="Page">
                        <input type="number" min="1" [max]="totalPages()" [value]="pageInputValue()"
                          (input)="onPageInputKey($any($event.target).value)"
                          (keydown.enter)="commitPageInput(); isPageDropdownOpen.set(false)"
                          (blur)="commitPageInput()" (click)="togglePageDropdown($event)"
                          class="w-full text-center text-sm font-semibold text-sky-500 dark:text-[#38bdf8] bg-transparent outline-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-pointer" />
                      </div>

                      <!-- Dropdown Popover -->
                      @if (isPageDropdownOpen()) {
                      <div class="page-dropdown-container absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-32 bg-[#f8fcff] dark:bg-slate-800 rounded-[28px] border-2 border-[#a5e3fd] dark:border-slate-600 p-2.5 z-50 animate-in fade-in duration-150"
                        (click)="$event.stopPropagation()">
                        <div class="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 text-center">
                          @for (p of pagesList(); track p) {
                          <button type="button" (click)="selectPageFromDropdown(p)"
                            class="py-1 px-2 rounded-full text-xs font-bold transition cursor-pointer"
                            [class.bg-[#00a6f4]]="p === currentPage()" [class.text-white]="p === currentPage()"
                            [class.hover:bg-sky-100]="p !== currentPage()" [class.text-slate-700]="p !== currentPage()">
                            {{ p }}
                          </button>
                          }
                        </div>
                      </div>
                      }
                    </div>

                    <!-- Next Page (â€º) -->
                    <button type="button" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()"
                      class="h-8 px-3.5 min-w-[44px] rounded-full flex items-center justify-center bg-sky-200 border border-sky-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 hover:bg-[#0070ba] hover:border-[#0070ba] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-xs"
                      title="Next" aria-label="Next page">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>

                    <!-- Last Page (Â») -->
                    <button type="button" (click)="goToPage(totalPages())" [disabled]="currentPage() === totalPages()"
                      class="h-8 px-3.5 min-w-[44px] rounded-full flex items-center justify-center bg-sky-200 border border-sky-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 hover:bg-[#0070ba] hover:border-[#0070ba] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-xs"
                      title="Last" aria-label="Last page">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m13 17 5-5-5-5" />
                        <path d="m6 17 5-5-5-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        }
      } @else {
`;

content = content.substring(0, startIndex) + newHeaderAndSharedViews + content.substring(endIndex + '      } @else {'.length);
fs.writeFileSync(itemHtmlPath, content, 'utf8');
console.log('Successfully updated item.html with Country List View 1:1 replica, video icon, and card images!');

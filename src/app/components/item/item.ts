import {
  Component,
  inject,
  signal,
  computed,
  HostListener,
  OnInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from './item.service';
import {
  ItemMaster,
  ItemStatus,
  ItemType,
  AlternateUomEntry,
  BarcodeEntry,
  PriceListEntry,
  BranchPriceEntry,
  CustomerGroupPriceEntry,
  ApprovedSupplierEntry,
  VariantMatrixEntry,
  PackagingLevelEntry,
  CustomAttributeEntry,
  DocumentAttachment
} from './item.models';
import { NavigationService } from '../../services/navigation.service';
import { DropdownOption } from '../select-dropdown/select-dropdown';

export type ItemSectionTab =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N'
  | 'all';

export interface SectionTabItem {
  id: ItemSectionTab;
  letter: string;
  name: string;
  shortName: string;
  fieldCount: string;
  icon: string;
  sectionKey: string;
}

export interface SearchableFormField {
  id: string;
  label: string;
  category: 'General' | 'Tab' | 'Field';
  tabId?: ItemSectionTab;
  sectionKey?: string;
  subKey?: string;
  location: string;
  keywords?: string;
}

export interface VideoTutorialStep {
  step: number;
  title: string;
  description: string;
  actionHint: string;
  badge: string;
}

export interface GuideTopic {
  id: string;
  title: string;
  category: 'create' | 'edit' | 'tabs' | 'navigation' | 'shortcuts';
  summary: string;
  steps: string[];
  tips?: string;
  jumpTab?: ItemSectionTab;
  jumpFieldId?: string;
}

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item.html',
  styleUrl: './item.css',
})
export class ItemComponent implements OnInit {
  public itemService = inject(ItemService);
  public navService = inject(NavigationService);

  @ViewChild('nameEnInput') nameEnInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('barcodeInput') barcodeInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('tabsContainer') tabsContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('fieldSearchInput') fieldSearchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('fieldSearchContainer') fieldSearchContainerRef?: ElementRef<HTMLDivElement>;

  // All 14 Enterprise Retail Section Tabs + All Sections (Single Word Tab Names)
  readonly sectionTabs: SectionTabItem[] = [
    { id: 'A', letter: 'A', name: 'Identity', shortName: 'Identity', fieldCount: '15 fields', icon: 'tag', sectionKey: 'identity' },
    { id: 'B', letter: 'B', name: 'Attributes', shortName: 'Attributes', fieldCount: '14 fields', icon: 'layers', sectionKey: 'attributes' },
    { id: 'C', letter: 'C', name: 'Barcodes', shortName: 'Barcodes', fieldCount: '10 fields', icon: 'barcode', sectionKey: 'barcode' },
    { id: 'D', letter: 'D', name: 'Units', shortName: 'Units', fieldCount: '16 fields', icon: 'scale', sectionKey: 'uom' },
    { id: 'E', letter: 'E', name: 'Pricing', shortName: 'Pricing', fieldCount: '15 fields', icon: 'currency', sectionKey: 'pricing' },
    { id: 'F', letter: 'F', name: 'Inventory', shortName: 'Inventory', fieldCount: '18 fields', icon: 'boxes', sectionKey: 'inventory' },
    { id: 'G', letter: 'G', name: 'Purchasing', shortName: 'Purchasing', fieldCount: '13 fields', icon: 'truck', sectionKey: 'purchasing' },
    { id: 'H', letter: 'H', name: 'Sales', shortName: 'Sales', fieldCount: '16 fields', icon: 'receipt', sectionKey: 'pos' },
    { id: 'I', letter: 'I', name: 'Variants', shortName: 'Variants', fieldCount: '12 fields', icon: 'grid', sectionKey: 'variants' },
    { id: 'J', letter: 'J', name: 'Tax', shortName: 'Tax', fieldCount: '12 fields', icon: 'shield', sectionKey: 'tax' },
    { id: 'K', letter: 'K', name: 'Accounting', shortName: 'Accounting', fieldCount: '10 fields', icon: 'ledger', sectionKey: 'accounting' },
    { id: 'L', letter: 'L', name: 'Documents', shortName: 'Documents', fieldCount: '7 fields', icon: 'paperclip', sectionKey: 'documents' },
    { id: 'M', letter: 'M', name: 'Organization', shortName: 'Organization', fieldCount: '9 fields', icon: 'building', sectionKey: 'organization' },
    { id: 'N', letter: 'N', name: 'Audit', shortName: 'Audit', fieldCount: '6 fields', icon: 'clock', sectionKey: 'audit' },
  ];

  // Tab navigation under essential fields (defaults to Section A)
  activeTab = signal<ItemSectionTab>('A');

  // Track expanded accordion sections (by section key) - ALL COLLAPSED BY DEFAULT
  expandedSections = signal<Record<string, boolean>>({
    'identity': false, // Section A
    'attributes': false, // Section B
    'barcode': false, // Section C
    'uom': false, // Section D
    'pricing': false, // Section E
    'inventory': false, // Section F
    'purchasing': false, // Section G
    'pos': false, // Section H
    'variants': false, // Section I
    'tax': false, // Section J
    'accounting': false, // Section K
    'documents': false, // Section L
    'organization': false, // Section M
    'audit': false // Section N
  });

  // Page Mode: 'add' (Create New Item), 'edit' (Edit Existing Item), or 'view' (Read-Only Inspection)
  pageMode = signal<'add' | 'edit' | 'view'>('edit');

  // Stay on page toggle
  stayOnPage = signal<boolean>(true);

  // Form Signals for Essential Information
  formItemType = signal<ItemType>('Stock Item');
  formNameEn = signal<string>('Premium Colombian Coffee Beans 1kg');
  formNameAr = signal<string>('حبوب بن كولومبي فاخرة 1 كجم');
  formSku = signal<string>('COF-COL-001');
  formCategory = signal<string>('Beverages & Hot Drinks');
  formBrand = signal<string>('Café Del Sol');
  formBaseUom = signal<string>('Piece');
  formSalesPrice = signal<number>(85.00);
  formCostPrice = signal<number>(52.00);
  formBarcode = signal<string>('6291041001234');
  formTrackInventory = signal<boolean>(true);
  formStatus = signal<ItemStatus>('Active');

  // Section A - Product Identity
  formShortName = signal<string>('Colombian Coffee 1kg');
  formDescEn = signal<string>('Single-origin 100% Arabica roasted whole coffee beans with rich chocolate notes.');
  formDescAr = signal<string>('حبوب بن أرابيكا نقية 100% محمصة بعناية مع نكهات الكاكاو والكراميل الغنية.');
  formSubcategory = signal<string>('Coffee Beans');
  formManufacturer = signal<string>('Sol Roasters Corp');
  formModelNumber = signal<string>('CDR-1000');
  formProductImage = signal<string>('assets/images/coffee.png');
  formAdditionalImages = signal<string[]>([
    'assets/images/coffee_pack.png'
  ]);
  formTags = signal<string[]>(['Coffee', 'Arabica', 'Organic', 'Retail Pack']);
  newTagInput = signal<string>('');

  // Section B - Classification & Attributes
  formDepartment = signal<string>('Food & Beverage');
  formProductGroup = signal<string>('Dry Groceries');
  formProductClass = signal<string>('Specialty Beverages');
  formProductSubclass = signal<string>('Whole Bean');
  formMerchandiseHierarchy = signal<string>('Grocery > Packaged > Coffee');
  formCountryOfOrigin = signal<string>('Colombia');
  formSeason = signal<string>('All Season');
  formCollection = signal<string>('Barista Reserve 2026');
  formTargetAudience = signal<string>('All Demographics');
  formMaterial = signal<string>('Organic Whole Bean');
  formColor = signal<string>('Dark Roast');
  formSize = signal<string>('1000g');
  formStyle = signal<string>('Vacuum Sealed Pouch');
  formCustomAttributes = signal<CustomAttributeEntry[]>([
    { id: 'ca1', name: 'Roast Level', value: 'Medium-Dark' },
    { id: 'ca2', name: 'Caffeine Content', value: 'High' }
  ]);
  newCustomAttrName = signal<string>('');
  newCustomAttrValue = signal<string>('');

  // Section C - Barcode & Identification
  formPrimaryBarcode = signal<string>('6291041001234');
  formBarcodeType = signal<string>('EAN-13');
  formAdditionalBarcodes = signal<BarcodeEntry[]>([
    { id: 'b1', barcode: '6291041001234-BX', type: 'Code 128', packaging: 'Inner Box (6 pcs)', isPrimary: false },
    { id: 'b2', barcode: '6291041001234-CT', type: 'ITF-14', packaging: 'Master Carton (24 pcs)', isPrimary: false }
  ]);
  formGtin = signal<string>('006291041001234');
  formQrCode = signal<string>('QR-COF-COL-001');
  formMpn = signal<string>('COL-ARABICA-1KG');
  formSupplierItemCode = signal<string>('SUP-COF-78');
  formSerialTracking = signal<boolean>(false);
  formBatchTracking = signal<boolean>(true);
  formExpiryTracking = signal<boolean>(true);

  // Section D - Units of Measure
  formSalesUom = signal<string>('Piece');
  formPurchaseUom = signal<string>('Carton');
  formStockingUom = signal<string>('Piece');
  formAlternateUoms = signal<AlternateUomEntry[]>([
    { id: 'u1', uom: 'Box (6 pcs)', conversionFactor: 6, barcode: '6291041001234-BX', salesAllowed: true, purchaseAllowed: true },
    { id: 'u2', uom: 'Carton (24 pcs)', conversionFactor: 24, barcode: '6291041001234-CT', salesAllowed: false, purchaseAllowed: true }
  ]);
  formUomConversionFactor = signal<number>(1);
  formAllowFractionalQty = signal<boolean>(false);
  formDecimalPrecision = signal<number>(0);
  formWeightUom = signal<string>('kg');
  formNetWeight = signal<number>(1.0);
  formGrossWeight = signal<number>(1.05);
  formLength = signal<number>(12);
  formWidth = signal<number>(8);
  formHeight = signal<number>(28);
  formVolume = computed(() => {
    return +(this.formLength() * this.formWidth() * this.formHeight()).toFixed(2);
  });

  // Section E - Pricing
  formMinSellingPrice = signal<number>(75.00);
  formMaxDiscountPct = signal<number>(15);
  formPriceIncludesTax = signal<boolean>(true);
  formSalesTaxCategory = signal<string>('Standard 5% VAT');
  formPurchaseTaxCategory = signal<string>('Standard 5% VAT');
  formPriceLists = signal<PriceListEntry[]>([
    { id: 'pl1', name: 'Retail Walk-in', price: 85.00, currency: 'AED', minQty: 1 },
    { id: 'pl2', name: 'Wholesale Tier 1', price: 68.00, currency: 'AED', minQty: 24 }
  ]);
  formBranchPrices = signal<BranchPriceEntry[]>([
    { id: 'bp1', branch: 'Dubai Mall Flagship', price: 89.00, cost: 52.00 },
    { id: 'bp2', branch: 'Abu Dhabi Marina Mall', price: 85.00, cost: 52.00 }
  ]);
  formCustomerGroupPrices = signal<CustomerGroupPriceEntry[]>([
    { id: 'cg1', groupName: 'VIP Club Members', price: 76.50, discountPct: 10 },
    { id: 'cg2', groupName: 'Wholesale B2B Clients', price: 68.00, discountPct: 20 },
    { id: 'cg3', groupName: 'Corporate Staff Tier', price: 72.25, discountPct: 15 }
  ]);
  formWholesalePrice = signal<number>(68.00);
  formPromotionalPricingEligible = signal<boolean>(true);
  formPriceEffectiveFrom = signal<string>('2026-01-01');
  formPriceEffectiveTo = signal<string>('2026-12-31');

  // Real-time Calculated Margin % and Markup %
  formMarginPct = computed(() => {
    const s = this.formSalesPrice();
    const c = this.formCostPrice();
    if (!s || s <= 0) return 0;
    return +(((s - c) / s) * 100).toFixed(2);
  });

  formMarkupPct = computed(() => {
    const s = this.formSalesPrice();
    const c = this.formCostPrice();
    if (!c || c <= 0) return 0;
    return +(((s - c) / c) * 100).toFixed(2);
  });

  // Section F - Inventory & Stock Control
  formAllowNegativeStock = signal<boolean>(false);
  formMinStock = signal<number>(50);
  formMaxStock = signal<number>(500);
  formReorderPoint = signal<number>(100);
  formReorderQuantity = signal<number>(200);
  formSafetyStock = signal<number>(40);
  formEoq = signal<number>(250);
  formDefaultWarehouse = signal<string>('Main Central DC - Dubai');
  formDefaultBin = signal<string>('RACK-A04-SHELF-2');
  formPreferredPickingLocation = signal<string>('ZONE-A-FAST-MOVER');
  formValuationMethod = signal<'FIFO' | 'Weighted Average' | 'Standard Cost'>('FIFO');
  formShelfLifeDays = signal<number>(365);
  formLeadTimeDays = signal<number>(7);
  formAbcClassification = signal<'A' | 'B' | 'C'>('A');
  formCycleCountRequired = signal<boolean>(true);

  // Section G - Purchasing & Suppliers
  formPurchasingAllowed = signal<boolean>(true);
  formPreferredSupplier = signal<string>('Global Coffee Importers LLC');
  formApprovedSuppliers = signal<ApprovedSupplierEntry[]>([
    { id: 's1', supplierName: 'Global Coffee Importers LLC', supplierItemCode: 'GCI-COL-1K', purchasePrice: 52.00, leadTimeDays: 5, currency: 'AED' },
    { id: 's2', supplierName: 'Andean Roast Supply Co', supplierItemCode: 'ARS-882', purchasePrice: 54.50, leadTimeDays: 14, currency: 'AED' }
  ]);
  formDefaultPurchaseUom = signal<string>('Carton');
  formDefaultPurchasePrice = signal<number>(1248.00);
  formMinOrderQuantity = signal<number>(5);
  formMaxOrderQuantity = signal<number>(100);
  formPurchaseMultiple = signal<number>(1);
  formSupplierLeadTime = signal<number>(7);
  formCountryOfSupply = signal<string>('Colombia');
  formLastPurchasePrice = signal<number>(52.00);
  formLastPurchaseDate = signal<string>('2026-10-15');

  // Section H - Sales & Retail POS
  formSalesAllowed = signal<boolean>(true);
  formPosEnabled = signal<boolean>(true);
  formPosDisplayName = signal<string>('Colombian Coffee 1kg');
  formPosButtonColor = signal<string>('#964B00');
  formWeighableItem = signal<boolean>(false);
  formSoldByWeightLength = signal<boolean>(false);
  formOpenPriceAllowed = signal<boolean>(false);
  formDiscountAllowed = signal<boolean>(true);
  formReturnAllowed = signal<boolean>(true);
  formAgeRestrictionRequired = signal<boolean>(false);
  formWarrantyRequired = signal<boolean>(false);
  formWarrantyPeriodMonths = signal<number>(0);
  formCommissionEligible = signal<boolean>(false);
  formCommissionRule = signal<string>('Standard Retail (0%)');
  formRecommendedRetailPrice = signal<number>(89.00);
  formDisplayOrder = signal<number>(1);

  // Section I - Product Variants & Packaging
  formHasVariants = signal<boolean>(false);
  formVariantAttributes = signal<string[]>(['Size', 'Color']);
  formVariantMatrix = signal<VariantMatrixEntry[]>([]);
  formParentItem = signal<string>('');
  formPackagingLevels = signal<PackagingLevelEntry[]>([
    { id: 'pkg1', levelName: 'Inner Pack', unitsPerPackage: 6, barcode: '6291041001234-BX', weightKg: 6.3, dimensions: '30x20x30 cm' },
    { id: 'pkg2', levelName: 'Master Carton', unitsPerPackage: 24, barcode: '6291041001234-CT', weightKg: 25.4, dimensions: '65x45x35 cm' }
  ]);

  // Section J - Tax, Compliance & Regulatory
  formTaxCategory = signal<string>('Standard Rate Goods');
  formTaxExemptionEligible = signal<boolean>(false);
  formTaxExemptionReason = signal<string>('');
  formHsCode = signal<string>('0901.21.00');
  formRegulatoryClassification = signal<string>('Food & Beverage - Municipality Approved');
  formRequiresImportDoc = signal<boolean>(true);
  formCertificationRequired = signal<boolean>(true);
  formCertificationDetails = signal<string>('Halal Certified, FairTrade Organic');
  formComplianceNotes = signal<string>('Keep in dry, cool location away from direct sunlight.');

  // Section K - Accounting Integration
  formInventoryAssetAccount = signal<string>('1310 - Finished Goods Inventory');
  formSalesRevenueAccount = signal<string>('4110 - Retail Sales Revenue');
  formSalesReturnsAccount = signal<string>('4120 - Sales Returns & Allowances');
  formCogsAccount = signal<string>('5110 - Cost of Goods Sold - Retail');
  formPurchaseExpenseAccount = signal<string>('5210 - Inbound Freight & Duty');
  formPurchaseReturnsAccount = signal<string>('1390 - Purchase Returns Offset');
  formInvAdjustmentAccount = signal<string>('5910 - Inventory Discrepancy & Shrinkage');
  formPriceDiffAccount = signal<string>('5920 - Purchase Price Variance');
  formTaxAccountMapping = signal<string>('VAT-OUTPUT-5%');
  formCostingMethodOverride = signal<string>('Default Company Valuation');

  // Section L - Documents & Attachments
  formAttachments = signal<DocumentAttachment[]>([
    { id: 'd1', name: 'Product_Specification_Sheet.pdf', type: 'PDF', size: '1.2 MB', uploadedAt: '2026-09-10', category: 'Specification' },
    { id: 'd2', name: 'Organic_Halal_Certificate.pdf', type: 'PDF', size: '850 KB', uploadedAt: '2026-08-22', category: 'Compliance' }
  ]);
  formInternalNotes = signal<string>('Top-selling premium roasted coffee beans. Always prioritize stock replenishment.');

  // Section M - Organization & Availability
  formAvailableCompanies = signal<string[]>(['ABC TRADING LLC']);
  formAvailableBranches = signal<string[]>(['All Branches', 'Dubai Flagship', 'Abu Dhabi Mall']);
  formAvailableWarehouses = signal<string[]>(['Main Central DC - Dubai', 'Al Quoz Warehouse']);
  formSalesChannels = signal<string[]>(['Retail POS', 'B2B Wholesale', 'Online Store (E-Commerce)']);
  formOnlineStoreEnabled = signal<boolean>(true);
  formEcommerceCategory = signal<string>('Pantry > Hot Drinks > Coffee');
  formPublishOnline = signal<boolean>(true);
  formAvailEffectiveFrom = signal<string>('2026-01-01');
  formAvailEffectiveTo = signal<string>('2030-12-31');
  formItemApprovalRequired = signal<boolean>(false);

  // Section N - Audit & System Information
  formItemId = signal<string>('ITM-00101');
  formCreatedBy = signal<string>('Admin User');
  formCreatedAt = signal<string>('2026-01-15 09:30');
  formUpdatedBy = signal<string>('Santhosh Kumar');
  formUpdatedAt = signal<string>('2026-10-24 14:12');
  formApprovedBy = signal<string>('Operations Manager');
  formRecordVersion = signal<number>(3);

  // Dropdown Master Options
  itemTypeOptions: ItemType[] = ['Stock Item', 'Service Item', 'Non-Stock Item', 'Fixed Asset', 'Assembly/Bundle'];
  statusOptions: ItemStatus[] = ['Draft', 'Active', 'Inactive'];
  categoryOptions: string[] = [
    'Beverages & Hot Drinks',
    'Electronics & Audio',
    'Organic Pantry',
    'Wearables & Fitness',
    'Fragrances & Luxury',
    'Apparel & Fashion',
    'Fresh Produce',
    'Home & Living'
  ];
  brandOptions: string[] = [
    'Café Del Sol',
    'AcousticPro',
    'Terra Verde',
    'PulseTech',
    'Al Emarat Royal',
    'Sony',
    'Samsung',
    'Nike',
    'Nestlé',
    'RapidBrand'
  ];
  uomOptions: string[] = ['Piece', 'Carton', 'Box', 'Bottle', 'Pack', 'Kg', 'Gram', 'Liter', 'Meter', 'Pair'];
  barcodeTypeOptions: string[] = ['EAN-13', 'UPC-A', 'Code 128', 'QR Code', 'ITF-14', 'Data Matrix'];
  valuationMethodOptions: ('FIFO' | 'Weighted Average' | 'Standard Cost')[] = ['FIFO', 'Weighted Average', 'Standard Cost'];
  posColors: string[] = ['#964B00', '#0284C7', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#475569', '#DC2626'];

  // Voice Search / Dictation State
  isVoiceListening = signal<boolean>(false);
  speechRecognitionObj: any = null;

  // Barcode Scanner Modal State
  isBarcodeModalOpen = signal<boolean>(false);
  scannedCodeTemp = signal<string>('');

  // AI Assistant Modal State
  isAiModalOpen = signal<boolean>(false);
  aiInputText = signal<string>('');
  aiActiveTab = signal<'voice' | 'text' | 'smart-paste'>('voice');
  isAiGenerating = signal<boolean>(false);

  // Toast Notification State
  toastMessage = signal<string | null>(null);

  // Modals for Clear & Reset Confirmation
  isClearModalOpen = signal<boolean>(false);

  // Action Dock Panel State
  isMoreActionsOpen = signal<boolean>(false);
  activeActionView = signal<'form' | 'overview' | 'grid' | 'table'>('form');
  actionPanelPage = signal<'top' | 'bottom'>('top');

  scrollActionPanel(direction: 'up' | 'down'): void {
    this.actionPanelPage.set(direction === 'down' ? 'bottom' : 'top');
  }

  itemListSearchQuery = signal<string>('');
  itemListCategoryFilter = signal<string>('All');

  filteredItemList = computed(() => {
    const q = this.itemListSearchQuery().toLowerCase().trim();
    const cat = this.itemListCategoryFilter();
    return this.itemService.items().filter((item) => {
      const matchCat = cat === 'All' || item.category === cat;
      const matchQ =
        !q ||
        item.nameEn.toLowerCase().includes(q) ||
        (item.nameAr && item.nameAr.includes(q)) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.includes(q));
      return matchCat && matchQ;
    });
  });

  overviewKpi = computed(() => {
    const items = this.itemService.items();
    const totalItems = items.length;
    const totalValuation = items.reduce((sum, it) => sum + ((it.salesPrice || 0) * 125), 0);
    const activeCount = items.filter((it) => it.status === 'Active').length;
    const avgMargin = items.length > 0
      ? Math.round(items.reduce((sum, it) => sum + (it.marginPct || 38), 0) / items.length)
      : 38;
    return { totalItems, totalValuation, activeCount, avgMargin };
  });

  // Accordion Sections Limit Toggle (First 7 sections vs All 14 matching Screenshot 4 reference)
  showAllSections = signal<boolean>(false);

  toggleShowMoreSections(): void {
    this.showAllSections.update((v) => !v);
  }

  // Expanded sub-sections for remaining fields inside each tab
  expandedSubSections = signal<Record<string, boolean>>({
    identity_more: false,
    attributes_more: false,
    barcode_more: false,
    uom_more: false,
    pricing_more: false,
    inventory_more: false,
    purchasing_more: false,
    pos_more: false,
    variants_more: false,
    tax_more: false,
    accounting_more: false,
    documents_more: false,
    organization_more: false,
    audit_more: false,
  });

  toggleSubSection(key: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.expandedSubSections.update((m) => ({
      ...m,
      [key]: !m[key]
    }));
  }

  isSubSectionExpanded(key: string): boolean {
    return !!this.expandedSubSections()[key];
  }

  // Record Index Display (< 5 >)
  currentDisplayNumber = computed(() => this.itemService.currentIndex() + 1);
  totalRecordsCount = computed(() => this.itemService.totalCount());

  // =========================================================================
  // FIELD & TAB SEARCH BAR (Voice input + Direct Jump & Focus)
  // =========================================================================
  fieldSearchQuery = signal<string>('');
  isFieldSearchOpen = signal<boolean>(false);
  isFieldVoiceListening = signal<boolean>(false);
  fieldSpeechRecognitionObj: any = null;
  voiceStatusText = signal<string | null>(null);
  isItemNameVoiceListening = signal<boolean>(false);
  itemNameSpeechObj: any = null;

  // Master Catalog of Searchable Form Fields & Tabs
  readonly searchableFields: SearchableFormField[] = [
    // General Information (Top Essential Row Fields)
    { id: 'field-itemType', label: 'Item Type', category: 'General', location: 'General Information', keywords: 'type stock service nonstock asset bundle item type' },
    { id: 'field-nameEn', label: 'Item Name (EN)', category: 'General', location: 'General Information', keywords: 'name english title product item label' },
    { id: 'field-nameAr', label: 'Item Name (AR)', category: 'General', location: 'General Information', keywords: 'arabic name title اسم الصنف' },
    { id: 'field-sku', label: 'SKU / Item Code', category: 'General', location: 'General Information', keywords: 'sku code barcode identifier stock keeping unit' },
    { id: 'field-category', label: 'Category', category: 'General', location: 'General Information', keywords: 'category group family line beverages electronics' },
    { id: 'field-subcategory', label: 'Subcategory', category: 'General', location: 'General Information', keywords: 'subcategory sub-category coffee beans' },
    { id: 'field-brand', label: 'Brand', category: 'General', location: 'General Information', keywords: 'brand maker label manufacturer vendor' },
    { id: 'field-baseUom', label: 'Base UOM', category: 'General', location: 'General Information', keywords: 'base uom unit measure piece box pack kg' },
    { id: 'field-salesPrice', label: 'Sales Price', category: 'General', location: 'General Information', keywords: 'sales price selling retail aed rate amount' },
    { id: 'field-costPrice', label: 'Cost Price', category: 'General', location: 'General Information', keywords: 'cost price purchase buying expense base' },
    { id: 'field-marginMarkup', label: 'Margin / Markup %', category: 'General', location: 'General Information', keywords: 'margin markup profit percentage gross' },
    { id: 'field-barcode', label: 'Barcode / GTIN', category: 'General', location: 'General Information', keywords: 'barcode gtin ean upc scan qr code' },

    // Tabs
    { id: 'tab-btn-A', label: 'Identity (Tab)', category: 'Tab', tabId: 'A', sectionKey: 'identity', location: 'Tab Navigation', keywords: 'tab identity product details short name manufacturer origin' },
    { id: 'tab-btn-B', label: 'Attributes (Tab)', category: 'Tab', tabId: 'B', sectionKey: 'attributes', location: 'Tab Navigation', keywords: 'tab attributes classification department group season collection' },
    { id: 'tab-btn-C', label: 'Barcodes (Tab)', category: 'Tab', tabId: 'C', sectionKey: 'barcode', location: 'Tab Navigation', keywords: 'tab barcodes tracking batch serial expiry gtin qr' },
    { id: 'tab-btn-D', label: 'Units (Tab)', category: 'Tab', tabId: 'D', sectionKey: 'uom', location: 'Tab Navigation', keywords: 'tab units uom conversion weight dimensions volume' },
    { id: 'tab-btn-E', label: 'Pricing (Tab)', category: 'Tab', tabId: 'E', sectionKey: 'pricing', location: 'Tab Navigation', keywords: 'tab pricing wholesale discount price lists branch tiers' },
    { id: 'tab-btn-F', label: 'Inventory (Tab)', category: 'Tab', tabId: 'F', sectionKey: 'inventory', location: 'Tab Navigation', keywords: 'tab inventory stock levels warehouse min max reorder safety' },
    { id: 'tab-btn-G', label: 'Purchasing (Tab)', category: 'Tab', tabId: 'G', sectionKey: 'purchasing', location: 'Tab Navigation', keywords: 'tab purchasing suppliers vendor lead time moq' },
    { id: 'tab-btn-H', label: 'Sales (Tab)', category: 'Tab', tabId: 'H', sectionKey: 'pos', location: 'Tab Navigation', keywords: 'tab sales pos retail buttons weighable warranty commission' },
    { id: 'tab-btn-I', label: 'Variants (Tab)', category: 'Tab', tabId: 'I', sectionKey: 'variants', location: 'Tab Navigation', keywords: 'tab variants packaging matrix inner box carton' },
    { id: 'tab-btn-J', label: 'Tax (Tab)', category: 'Tab', tabId: 'J', sectionKey: 'tax', location: 'Tab Navigation', keywords: 'tab tax compliance hs code vat tariff exemption' },
    { id: 'tab-btn-K', label: 'Accounting (Tab)', category: 'Tab', tabId: 'K', sectionKey: 'accounting', location: 'Tab Navigation', keywords: 'tab accounting gl ledger asset revenue cogs expense' },
    { id: 'tab-btn-L', label: 'Documents (Tab)', category: 'Tab', tabId: 'L', sectionKey: 'documents', location: 'Tab Navigation', keywords: 'tab documents attachments pdf files certs notes' },
    { id: 'tab-btn-M', label: 'Organization (Tab)', category: 'Tab', tabId: 'M', sectionKey: 'organization', location: 'Tab Navigation', keywords: 'tab organization availability branches warehouses ecommerce channels' },
    { id: 'tab-btn-N', label: 'Audit (Tab)', category: 'Tab', tabId: 'N', sectionKey: 'audit', location: 'Tab Navigation', keywords: 'tab audit system history log created updated version' },

    // Section A (Identity) Fields
    { id: 'field-shortName', label: 'Short Name', category: 'Field', tabId: 'A', sectionKey: 'identity', location: 'Tab: Identity', keywords: 'short name receipt display print pos' },
    { id: 'field-manufacturer', label: 'Manufacturer', category: 'Field', tabId: 'A', sectionKey: 'identity', location: 'Tab: Identity', keywords: 'manufacturer factory company producer maker' },
    { id: 'field-countryOfOrigin', label: 'Country of Origin', category: 'Field', tabId: 'A', sectionKey: 'identity', location: 'Tab: Identity', keywords: 'country of origin made in provenance source' },
    { id: 'field-modelNumber', label: 'Model Number', category: 'Field', tabId: 'A', sectionKey: 'identity', location: 'Tab: Identity', keywords: 'model number part partno cdr' },
    { id: 'field-material', label: 'Material / Fabric', category: 'Field', tabId: 'A', sectionKey: 'identity', location: 'Tab: Identity', keywords: 'material fabric organic composition' },
    { id: 'field-color', label: 'Color / Roast', category: 'Field', tabId: 'A', sectionKey: 'identity', location: 'Tab: Identity', keywords: 'color roast shade finish dark medium' },
    { id: 'field-descEn', label: 'Description (EN)', category: 'Field', tabId: 'A', sectionKey: 'identity', subKey: 'identity_more', location: 'Tab: Identity (Expanded)', keywords: 'description english long details info' },
    { id: 'field-descAr', label: 'Description (AR)', category: 'Field', tabId: 'A', sectionKey: 'identity', subKey: 'identity_more', location: 'Tab: Identity (Expanded)', keywords: 'arabic description وصف عربي تفاصيل' },
    { id: 'field-tags', label: 'Product Tags', category: 'Field', tabId: 'A', sectionKey: 'identity', subKey: 'identity_more', location: 'Tab: Identity (Expanded)', keywords: 'tags keywords labels badges filter search' },

    // Section B (Attributes) Fields
    { id: 'field-department', label: 'Department', category: 'Field', tabId: 'B', sectionKey: 'attributes', location: 'Tab: Attributes', keywords: 'department dept food beverage grocery' },
    { id: 'field-productGroup', label: 'Product Group', category: 'Field', tabId: 'B', sectionKey: 'attributes', location: 'Tab: Attributes', keywords: 'product group dry groceries segment' },
    { id: 'field-productClass', label: 'Product Class', category: 'Field', tabId: 'B', sectionKey: 'attributes', location: 'Tab: Attributes', keywords: 'class specialty beverages classification' },
    { id: 'field-season', label: 'Season', category: 'Field', tabId: 'B', sectionKey: 'attributes', location: 'Tab: Attributes', keywords: 'season summer winter all season spring' },
    { id: 'field-collection', label: 'Collection', category: 'Field', tabId: 'B', sectionKey: 'attributes', location: 'Tab: Attributes', keywords: 'collection line reserve series vintage' },
    { id: 'field-size', label: 'Product Size', category: 'Field', tabId: 'B', sectionKey: 'attributes', subKey: 'attributes_more', location: 'Tab: Attributes (Expanded)', keywords: 'size volume 1000g net weight pack' },
    { id: 'field-style', label: 'Style / Packaging Type', category: 'Field', tabId: 'B', sectionKey: 'attributes', subKey: 'attributes_more', location: 'Tab: Attributes (Expanded)', keywords: 'style packaging pouch sealed bottle' },
    { id: 'field-customAttributes', label: 'Custom Attributes', category: 'Field', tabId: 'B', sectionKey: 'attributes', subKey: 'attributes_more', location: 'Tab: Attributes (Expanded)', keywords: 'custom attributes properties key value roast level caffeine' },

    // Section C (Barcodes) Fields
    { id: 'field-primaryBarcode', label: 'Primary Barcode', category: 'Field', tabId: 'C', sectionKey: 'barcode', location: 'Tab: Barcodes', keywords: 'primary barcode ean-13 upc code scan' },
    { id: 'field-barcodeType', label: 'Barcode Type', category: 'Field', tabId: 'C', sectionKey: 'barcode', location: 'Tab: Barcodes', keywords: 'barcode type code 128 qr itf ean upc' },
    { id: 'field-gtin', label: 'GTIN Number', category: 'Field', tabId: 'C', sectionKey: 'barcode', location: 'Tab: Barcodes', keywords: 'gtin global trade item number 14' },
    { id: 'field-qrCode', label: 'QR Code Data', category: 'Field', tabId: 'C', sectionKey: 'barcode', location: 'Tab: Barcodes', keywords: 'qr code 2d matrix scanner' },
    { id: 'field-serialTracking', label: 'Serial Tracking', category: 'Field', tabId: 'C', sectionKey: 'barcode', location: 'Tab: Barcodes', keywords: 'serial tracking sn unique machine device' },
    { id: 'field-batchTracking', label: 'Batch Tracking', category: 'Field', tabId: 'C', sectionKey: 'barcode', location: 'Tab: Barcodes', keywords: 'batch tracking lot number production' },
    { id: 'field-expiryTracking', label: 'Expiry Date Tracking', category: 'Field', tabId: 'C', sectionKey: 'barcode', location: 'Tab: Barcodes', keywords: 'expiry date tracking expiration shelf life' },

    // Section D (Units) Fields
    { id: 'field-salesUom', label: 'Sales UOM', category: 'Field', tabId: 'D', sectionKey: 'uom', location: 'Tab: Units', keywords: 'sales uom unit of measure piece box' },
    { id: 'field-purchaseUom', label: 'Purchase UOM', category: 'Field', tabId: 'D', sectionKey: 'uom', location: 'Tab: Units', keywords: 'purchase uom carton crate container unit' },
    { id: 'field-stockingUom', label: 'Stocking UOM', category: 'Field', tabId: 'D', sectionKey: 'uom', location: 'Tab: Units', keywords: 'stocking uom inventory base unit' },
    { id: 'field-netWeight', label: 'Net Weight', category: 'Field', tabId: 'D', sectionKey: 'uom', subKey: 'uom_more', location: 'Tab: Units (Expanded)', keywords: 'net weight kg gram mass' },
    { id: 'field-grossWeight', label: 'Gross Weight', category: 'Field', tabId: 'D', sectionKey: 'uom', subKey: 'uom_more', location: 'Tab: Units (Expanded)', keywords: 'gross weight total weight packaging' },
    { id: 'field-dimensions', label: 'Dimensions (L x W x H)', category: 'Field', tabId: 'D', sectionKey: 'uom', subKey: 'uom_more', location: 'Tab: Units (Expanded)', keywords: 'dimensions length width height cm volume' },

    // Section E (Pricing) Fields
    { id: 'field-minSellingPrice', label: 'Min Selling Price', category: 'Field', tabId: 'E', sectionKey: 'pricing', location: 'Tab: Pricing', keywords: 'min selling price floor minimum bottom' },
    { id: 'field-maxDiscountPct', label: 'Max Discount %', category: 'Field', tabId: 'E', sectionKey: 'pricing', location: 'Tab: Pricing', keywords: 'max discount percentage limit cap' },
    { id: 'field-wholesalePrice', label: 'Wholesale Price', category: 'Field', tabId: 'E', sectionKey: 'pricing', location: 'Tab: Pricing', keywords: 'wholesale price b2b bulk trade' },
    { id: 'field-priceLists', label: 'Price Lists', category: 'Field', tabId: 'E', sectionKey: 'pricing', location: 'Tab: Pricing', keywords: 'price lists walk-in wholesale tier account' },
    { id: 'field-branchPrices', label: 'Branch Prices', category: 'Field', tabId: 'E', sectionKey: 'pricing', location: 'Tab: Pricing', keywords: 'branch prices dubai abu dhabi mall' },

    // Section F (Inventory) Fields
    { id: 'field-minStock', label: 'Minimum Stock', category: 'Field', tabId: 'F', sectionKey: 'inventory', location: 'Tab: Inventory', keywords: 'min stock minimum alert threshold' },
    { id: 'field-maxStock', label: 'Maximum Stock', category: 'Field', tabId: 'F', sectionKey: 'inventory', location: 'Tab: Inventory', keywords: 'max stock ceiling warehouse limit' },
    { id: 'field-reorderPoint', label: 'Reorder Point (ROP)', category: 'Field', tabId: 'F', sectionKey: 'inventory', location: 'Tab: Inventory', keywords: 'reorder point rop replenishment trigger' },
    { id: 'field-reorderQuantity', label: 'Reorder Quantity', category: 'Field', tabId: 'F', sectionKey: 'inventory', location: 'Tab: Inventory', keywords: 'reorder quantity roq order batch' },
    { id: 'field-defaultWarehouse', label: 'Default Warehouse', category: 'Field', tabId: 'F', sectionKey: 'inventory', location: 'Tab: Inventory', keywords: 'default warehouse main dc central location' },
    { id: 'field-defaultBin', label: 'Default Bin / Shelf', category: 'Field', tabId: 'F', sectionKey: 'inventory', location: 'Tab: Inventory', keywords: 'default bin rack shelf location zone' },

    // Section G (Purchasing) Fields
    { id: 'field-preferredSupplier', label: 'Preferred Supplier', category: 'Field', tabId: 'G', sectionKey: 'purchasing', location: 'Tab: Purchasing', keywords: 'preferred supplier vendor primary source' },
    { id: 'field-defaultPurchasePrice', label: 'Default Purchase Price', category: 'Field', tabId: 'G', sectionKey: 'purchasing', location: 'Tab: Purchasing', keywords: 'default purchase price buying cost rate' },
    { id: 'field-minOrderQuantity', label: 'Min Order Qty (MOQ)', category: 'Field', tabId: 'G', sectionKey: 'purchasing', location: 'Tab: Purchasing', keywords: 'min order quantity moq minimum purchase' },

    // Section H (Sales) Fields
    { id: 'field-posDisplayName', label: 'POS Display Name', category: 'Field', tabId: 'H', sectionKey: 'pos', location: 'Tab: Sales', keywords: 'pos display name retail button label title' },
    { id: 'field-posButtonColor', label: 'POS Button Color', category: 'Field', tabId: 'H', sectionKey: 'pos', location: 'Tab: Sales', keywords: 'pos button color tile theme brown blue' },
    { id: 'field-weighableItem', label: 'Weighable Item Flag', category: 'Field', tabId: 'H', sectionKey: 'pos', location: 'Tab: Sales', keywords: 'weighable scale barcode kg price per kg' },

    // Section J (Tax) Fields
    { id: 'field-taxCategory', label: 'Tax Category / VAT', category: 'Field', tabId: 'J', sectionKey: 'tax', location: 'Tab: Tax', keywords: 'tax category vat rate 5% exempt standard' },
    { id: 'field-hsCode', label: 'HS Code / Tariff', category: 'Field', tabId: 'J', sectionKey: 'tax', location: 'Tab: Tax', keywords: 'hs code customs tariff harmonized code import' },

    // Section K (Accounting) Fields
    { id: 'field-inventoryAssetAccount', label: 'Inventory Asset Account', category: 'Field', tabId: 'K', sectionKey: 'accounting', location: 'Tab: Accounting', keywords: 'inventory asset gl account balance sheet 1310' },
    { id: 'field-salesRevenueAccount', label: 'Sales Revenue Account', category: 'Field', tabId: 'K', sectionKey: 'accounting', location: 'Tab: Accounting', keywords: 'sales revenue account pnl income 4110' },
    { id: 'field-cogsAccount', label: 'COGS Account', category: 'Field', tabId: 'K', sectionKey: 'accounting', location: 'Tab: Accounting', keywords: 'cogs cost of goods sold expense 5110' },

    // Section L (Documents) Fields
    { id: 'field-attachments', label: 'Document Attachments', category: 'Field', tabId: 'L', sectionKey: 'documents', location: 'Tab: Documents', keywords: 'documents attachments pdf files lab certs' },
    { id: 'field-internalNotes', label: 'Internal Notes', category: 'Field', tabId: 'L', sectionKey: 'documents', location: 'Tab: Documents', keywords: 'internal notes comments memo operational' },

    // Section M (Organization) Fields
    { id: 'field-availableBranches', label: 'Branch Availability', category: 'Field', tabId: 'M', sectionKey: 'organization', location: 'Tab: Organization', keywords: 'branches stores retail outlets availability' },
    { id: 'field-onlineStoreEnabled', label: 'Online Store (E-Commerce)', category: 'Field', tabId: 'M', sectionKey: 'organization', location: 'Tab: Organization', keywords: 'online store ecommerce web shop publish website' },

    // Section N (Audit) Fields
    { id: 'field-auditLog', label: 'Audit Trail Records', category: 'Field', tabId: 'N', sectionKey: 'audit', location: 'Tab: Audit', keywords: 'audit trail history delta user timestamp record' },
  ];

  filteredFormFields = computed<SearchableFormField[]>(() => {
    const q = this.fieldSearchQuery().trim().toLowerCase();
    if (!q) {
      return this.searchableFields.slice(0, 10);
    }
    return this.searchableFields.filter((f) => {
      return (
        f.label.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        (f.keywords && f.keywords.toLowerCase().includes(q))
      );
    }).slice(0, 12);
  });

  selectSearchField(field: SearchableFormField): void {
    this.fieldSearchQuery.set(field.label);
    this.isFieldSearchOpen.set(false);

    if (field.category === 'Tab' && field.tabId) {
      this.selectTab(field.tabId);
      this.showToast(`Switched to tab: ${field.label}`);
      return;
    }

    if (field.tabId) {
      this.selectTab(field.tabId);
      if (field.sectionKey) {
        this.expandedSections.update((sec) => ({ ...sec, [field.sectionKey!]: true }));
      }
      if (field.subKey) {
        this.expandedSubSections.update((sub) => ({ ...sub, [field.subKey!]: true }));
      }
    }

    setTimeout(() => {
      const el = document.getElementById(field.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          el.focus();
        }
        el.classList.add('field-highlight-pulse');
        setTimeout(() => el.classList.remove('field-highlight-pulse'), 2500);
      }
      this.showToast(`Focused: ${field.label} (${field.location})`);
    }, 120);
  }

  toggleFieldVoiceSearch(event?: Event): void {
    if (event) event.stopPropagation();

    if (this.isFieldVoiceListening()) {
      this.stopFieldVoiceSearch();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.fieldSpeechRecognitionObj = new SpeechRecognition();
        this.fieldSpeechRecognitionObj.continuous = false;
        this.fieldSpeechRecognitionObj.interimResults = true;
        this.fieldSpeechRecognitionObj.lang = 'en-US';

        this.fieldSpeechRecognitionObj.onstart = () => {
          this.isFieldVoiceListening.set(true);
          this.isFieldSearchOpen.set(true);
        };

        this.fieldSpeechRecognitionObj.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((res: any) => res[0])
            .map((res: any) => res.transcript)
            .join('');
          this.fieldSearchQuery.set(transcript);
        };

        this.fieldSpeechRecognitionObj.onerror = () => {
          this.isFieldVoiceListening.set(false);
        };

        this.fieldSpeechRecognitionObj.onend = () => {
          this.isFieldVoiceListening.set(false);
          this.processVoiceSearchTranscript();
        };

        this.fieldSpeechRecognitionObj.start();
      } catch (err) {
        this.simulateFieldVoiceSearch();
      }
    } else {
      this.simulateFieldVoiceSearch();
    }
  }

  private processVoiceSearchTranscript(): void {
    const q = this.fieldSearchQuery().toLowerCase().trim();
    if (!q) return;

    if (q.includes('overview') || q.includes('chart') || q.includes('kpi') || q.includes('dashboard')) {
      this.handleOverviewClick();
      this.voiceStatusText.set('Voice Command: Opening Item Overview');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }
    if (q.includes('grid')) {
      this.handleGridClick();
      this.voiceStatusText.set('Voice Command: Opening Grid Item List');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }
    if (q.includes('table')) {
      this.handleTableClick();
      this.voiceStatusText.set('Voice Command: Opening Table Item List');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }
    if (q.includes('add') || q.includes('new')) {
      this.switchToAddMode();
      this.voiceStatusText.set('Voice Command: Switched to Add Mode');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }
    if (q.includes('edit')) {
      this.switchToEditMode();
      this.voiceStatusText.set('Voice Command: Switched to Edit Mode');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }
    if (q.includes('view') || q.includes('inspect')) {
      this.switchToViewMode();
      this.voiceStatusText.set('Voice Command: Switched to View Mode');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }
    if (q.includes('video') || q.includes('tutorial')) {
      this.openVideoTutorial();
      this.voiceStatusText.set('Voice Command: Playing Tutorial Video');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }
    if (q.includes('guide') || q.includes('help')) {
      this.openGuideModal();
      this.voiceStatusText.set('Voice Command: Opening Guide Assistance');
      setTimeout(() => this.voiceStatusText.set(null), 3000);
      return;
    }

    const topMatch = this.filteredFormFields()[0];
    if (topMatch) {
      this.selectSearchField(topMatch);
      this.voiceStatusText.set(`Focused: ${topMatch.label}`);
      setTimeout(() => this.voiceStatusText.set(null), 2500);
    }
  }

  private simulateFieldVoiceSearch(): void {
    this.isFieldVoiceListening.set(true);
    this.isFieldSearchOpen.set(true);
    const sampleTerms = ['Sales Price', 'Barcode', 'Cost Price', 'Identity', 'Pricing', 'Inventory', 'Item Overview'];
    const pick = sampleTerms[Math.floor(Math.random() * sampleTerms.length)];

    setTimeout(() => {
      this.fieldSearchQuery.set(pick);
      this.isFieldVoiceListening.set(false);
      this.processVoiceSearchTranscript();
    }, 1200);
  }

  stopFieldVoiceSearch(): void {
    if (this.fieldSpeechRecognitionObj) {
      try {
        this.fieldSpeechRecognitionObj.stop();
      } catch (_) {}
      this.fieldSpeechRecognitionObj = null;
    }
    this.isFieldVoiceListening.set(false);
  }

  toggleItemNameVoice(): void {
    if (this.isItemNameVoiceListening()) {
      try {
        this.itemNameSpeechObj?.stop();
      } catch (_) {}
      this.isItemNameVoiceListening.set(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.itemNameSpeechObj = new SpeechRecognition();
        this.itemNameSpeechObj.continuous = false;
        this.itemNameSpeechObj.interimResults = true;
        this.itemNameSpeechObj.lang = 'en-US';

        this.itemNameSpeechObj.onstart = () => {
          this.isItemNameVoiceListening.set(true);
        };

        this.itemNameSpeechObj.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((res: any) => res[0])
            .map((res: any) => res.transcript)
            .join('');
          this.formNameEn.set(transcript);
        };

        this.itemNameSpeechObj.onerror = () => {
          this.isItemNameVoiceListening.set(false);
        };

        this.itemNameSpeechObj.onend = () => {
          this.isItemNameVoiceListening.set(false);
          this.showToast(`Voice transcribed: ${this.formNameEn()}`);
        };

        this.itemNameSpeechObj.start();
      } catch (err) {
        this.simulateItemNameVoice();
      }
    } else {
      this.simulateItemNameVoice();
    }
  }

  private simulateItemNameVoice(): void {
    this.isItemNameVoiceListening.set(true);
    setTimeout(() => {
      this.formNameEn.set('Organic Dark Roast Espresso Beans 1kg');
      this.isItemNameVoiceListening.set(false);
      this.showToast('Voice transcribed: "Organic Dark Roast Espresso Beans 1kg"');
    }, 1200);
  }

  focusItemNameField(): void {
    const el = document.getElementById('field-nameEn') || document.querySelector('input[name="nameEn"]') as HTMLElement;
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-[#00a6f4]', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-4', 'ring-[#00a6f4]', 'ring-offset-2'), 2500);
    }
  }

  // =========================================================================
  // VIDEO TUTORIAL PLAYER (Short interactive video tutorial for Add / Edit)
  // =========================================================================
  isVideoModalOpen = signal<boolean>(false);
  videoCurrentStep = signal<number>(1);
  videoIsPlaying = signal<boolean>(true);
  videoPlaybackSpeed = signal<number>(1);
  videoProgressPct = signal<number>(20);
  private videoInterval: any = null;

  readonly addPageVideoSteps: VideoTutorialStep[] = [
    { step: 1, title: 'Item Type & Name Entry', description: 'Select whether this is a Stock or Service item, then enter both English and Arabic product names in General Information.', actionHint: 'Fill Item Type, Name (EN), and Name (AR)', badge: 'Step 1 of 5' },
    { step: 2, title: 'Auto-Generate SKU & Barcodes', description: 'Click the "Auto" pill next to SKU and the barcode icon to generate unique enterprise identifiers automatically.', actionHint: 'Click Auto SKU & Generate Barcode', badge: 'Step 2 of 5' },
    { step: 3, title: 'Set Pricing & Real-Time Margins', description: 'Enter Cost Price and Sales Price. Rapid ERP automatically calculates live Margin % and Markup %.', actionHint: 'Specify AED Cost & Sales Price', badge: 'Step 3 of 5' },
    { step: 4, title: 'Assign Units & Stock Thresholds', description: 'Configure Base UOM, Minimum/Maximum stock limits, and default warehouse locations.', actionHint: 'Configure Inventory & Reorder Rules', badge: 'Step 4 of 5' },
    { step: 5, title: 'Save & Commit Item Master', description: 'Click "Save Item" at bottom right (or press Alt+S). The item is committed into inventory with automatic audit log.', actionHint: 'Click Save Item (Alt+S)', badge: 'Step 5 of 5' }
  ];

  readonly editPageVideoSteps: VideoTutorialStep[] = [
    { step: 1, title: 'Navigate Between Existing Items', description: 'Use the top-right header pagination pager (< 1 >) or press Alt+Left / Alt+Right to browse items.', actionHint: 'Browse records using header pager', badge: 'Step 1 of 5' },
    { step: 2, title: 'Instant Field Jump (Alt+F)', description: 'Type or speak in the General Information search bar to instantly jump and focus any field or tab.', actionHint: 'Use Field Search to auto-focus', badge: 'Step 2 of 5' },
    { step: 3, title: 'Modify Pricing & Attributes', description: 'Update wholesale tiers, branch pricing, POS display button color, or supplier item codes.', actionHint: 'Edit product details and prices', badge: 'Step 3 of 5' },
    { step: 4, title: 'Expand Collapsed Accordions', description: 'Click any section header (+) to expand only the specific tab details you need to modify.', actionHint: 'Expand relevant accordions on-demand', badge: 'Step 4 of 5' },
    { step: 5, title: 'Update & Commit Changes', description: 'Click "Update Item" at bottom right (or press Alt+S) to save revisions with version history.', actionHint: 'Click Update Item (Alt+S)', badge: 'Step 5 of 5' }
  ];

  readonly viewPageVideoSteps: VideoTutorialStep[] = [
    { step: 1, title: 'Inspect Specifications & Pricing', description: 'Review SKU, GTIN barcode, real-time Margin % and selling prices in clear read-only layout.', actionHint: 'Inspect Primary Specs & Pricing', badge: 'Step 1 of 5' },
    { step: 2, title: 'Check Product Identity & Media', description: 'View brand, manufacturer, country of origin, and associated product gallery assets.', actionHint: 'Review Identity & Documents', badge: 'Step 2 of 5' },
    { step: 3, title: 'Review Warehouse Stock & UOM', description: 'Inspect stock quantities across central warehouse bins and alternate conversion units.', actionHint: 'Examine Stock & Bin Locations', badge: 'Step 3 of 5' },
    { step: 4, title: 'Audit Trail & Change History', description: 'Inspect timestamped audit events to see who created or updated the item record.', actionHint: 'Review Lifecycle & Audit History', badge: 'Step 4 of 5' },
    { step: 5, title: 'One-Click Switch to Edit Mode', description: 'Click "Edit This Item" button or press Alt+E anytime you need to modify record data.', actionHint: 'Click Edit Mode (Alt+E)', badge: 'Step 5 of 5' }
  ];

  currentVideoSteps = computed(() => {
    if (this.pageMode() === 'add') return this.addPageVideoSteps;
    if (this.pageMode() === 'view') return this.viewPageVideoSteps;
    return this.editPageVideoSteps;
  });

  currentVideoStepInfo = computed(() => {
    const steps = this.currentVideoSteps();
    const curr = this.videoCurrentStep();
    return steps.find((s) => s.step === curr) || steps[0];
  });

  openVideoTutorial(): void {
    this.videoCurrentStep.set(1);
    this.videoProgressPct.set(20);
    this.videoIsPlaying.set(true);
    this.isVideoModalOpen.set(true);
    this.startVideoProgressTimer();
  }

  closeVideoTutorial(): void {
    this.stopVideoProgressTimer();
    this.isVideoModalOpen.set(false);
  }

  toggleVideoPlayPause(): void {
    if (this.videoIsPlaying()) {
      this.videoIsPlaying.set(false);
      this.stopVideoProgressTimer();
    } else {
      this.videoIsPlaying.set(true);
      this.startVideoProgressTimer();
    }
  }

  setVideoStep(step: number): void {
    this.videoCurrentStep.set(step);
    this.videoProgressPct.set(step * 20);
  }

  nextVideoStep(): void {
    const curr = this.videoCurrentStep();
    if (curr < 5) {
      this.setVideoStep(curr + 1);
    } else {
      this.setVideoStep(1);
    }
  }

  prevVideoStep(): void {
    const curr = this.videoCurrentStep();
    if (curr > 1) {
      this.setVideoStep(curr - 1);
    }
  }

  restartVideoTutorial(): void {
    this.setVideoStep(1);
    this.videoIsPlaying.set(true);
    this.startVideoProgressTimer();
  }

  private startVideoProgressTimer(): void {
    this.stopVideoProgressTimer();
    this.videoInterval = setInterval(() => {
      if (this.videoIsPlaying()) {
        const nextPct = this.videoProgressPct() + 2;
        if (nextPct >= 100) {
          this.nextVideoStep();
        } else {
          this.videoProgressPct.set(nextPct);
        }
      }
    }, 450);
  }

  private stopVideoProgressTimer(): void {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
  }

  // =========================================================================
  // GUIDE ASSISTANCE MODAL (Comprehensive help, search, navigation guidance)
  // =========================================================================
  isGuideModalOpen = signal<boolean>(false);
  guideSearchQuery = signal<string>('');
  guideActiveCategory = signal<'all' | 'create' | 'edit' | 'tabs' | 'navigation' | 'shortcuts'>('all');

  readonly guideTopics: GuideTopic[] = [
    {
      id: 'g-create',
      title: 'How to Create a New Item Master',
      category: 'create',
      summary: 'Complete walkthrough on creating a product from scratch with required fields.',
      steps: [
        'Click the "+ New Item" button in the header or press Alt+N to enter Add Mode.',
        'Choose Item Type (e.g. Stock Item, Service Item, Fixed Asset).',
        'Enter Item Name in English (required) and Arabic.',
        'Click the "Auto" pill next to SKU to generate an intelligent catalog SKU code.',
        'Click the barcode scanner button or type a barcode / GTIN.',
        'Set Sales Price and Cost Price; verify real-time Margin % and Markup % pills.',
        'Explore any required tabs (e.g. Identity, Units, Pricing, Inventory).',
        'Click "Save Item" (Alt+S) at the bottom right. A success toast will confirm creation.'
      ],
      tips: 'You can leave optional accordions collapsed; Rapid ERP saves all default values cleanly.'
    },
    {
      id: 'g-edit',
      title: 'How to Edit and Update Existing Items',
      category: 'edit',
      summary: 'Navigating records, making modifications, and updating item parameters.',
      steps: [
        'Use the top-right Record Pager (< 1 >) or press Alt+Left / Alt+Right to navigate records.',
        'Switch directly to Edit Mode (Alt+E) if currently in Add Mode.',
        'Modify any field directly in General Information or within any specific tab.',
        'Click the header of any collapsed accordion (+) to reveal its fields.',
        'Click "Update Item" (Alt+S) to commit changes. The item version number will increment in the Audit trail.'
      ],
      tips: 'You can also jump directly to any field using the Field Search bar (Alt+F).'
    },
    {
      id: 'g-search',
      title: 'Using Field Search & Voice Jump (Alt+F)',
      category: 'navigation',
      summary: 'Find and focus any form field or tab directly without manual scrolling.',
      steps: [
        'Click the search bar on the right side of "General Information" or press Alt+F.',
        'Type any field name (e.g. "sales price", "reorder", "hs code", "supplier", "weight").',
        'Alternatively, click the microphone button (🎙️) and speak the field name.',
        'Select the field from the dropdown: Rapid ERP automatically switches to the tab, expands the accordion, scrolls smoothly, and highlights the input with a pulsing glow!'
      ],
      tips: 'Selecting a Tab name directly jumps straight to that tab.'
    },
    {
      id: 'g-tabs',
      title: 'Master Guide to the 14 Tabs',
      category: 'tabs',
      summary: 'Overview of what data each single-word tab contains and when to use it.',
      steps: [
        '1. Identity: Short name for receipts, manufacturer, country of origin, model number, images, tags.',
        '2. Attributes: Department, product group, class, season, collection, size, custom specs.',
        '3. Barcodes: Primary EAN/UPC, GTIN-14, QR code, batch tracking, serial & expiry tracking.',
        '4. Units: Sales/Purchase UOMs, multi-tier conversion factors, net/gross weight, dimensions.',
        '5. Pricing: Minimum selling price, max discount %, wholesale tiers, branch pricing.',
        '6. Inventory: Min/Max thresholds, reorder points (ROP/ROQ), default warehouse, bin location.',
        '7. Purchasing: Preferred supplier, supplier item code, lead time, MOQ, purchase history.',
        '8. Sales: POS display names, POS button colors, open price rules, return & warranty periods.',
        '9. Variants: Color/size variant matrix generation, multi-level inner & master carton packaging.',
        '10. Tax: VAT rate categories, HS tariff codes, municipality regulatory classifications.',
        '11. Accounting: GL integration accounts (Inventory Asset, Sales Revenue, COGS, Variance).',
        '12. Documents: Specification sheets, Halal/Organic certificates, internal operational notes.',
        '13. Organization: Branch store availability, subsidiary company scoping, online e-commerce flags.',
        '14. Audit: Immutable audit trail, record versions, creator/updater timestamps and deltas.'
      ]
    },
    {
      id: 'g-shortcuts',
      title: 'Keyboard Shortcuts for Power Users',
      category: 'shortcuts',
      summary: 'Boost data entry speed using keyboard shortcuts across the application.',
      steps: [
        'Alt + S / Ctrl + S: Save or Update current item',
        'Alt + N: Create new item (Add Mode)',
        'Alt + E: Edit item mode',
        'Alt + F: Focus Field & Tab search bar',
        'Alt + Left / Alt + Right: Previous / Next item record',
        'Alt + 1 to Alt + 8: Jump directly to Tabs 1 to 8',
        'Alt + P: Watch interactive video tutorial',
        'Alt + H or ?: Open this Guide Assistance drawer',
        'Alt + B: Open Barcode Scanner simulator',
        'Alt + C: Open Clear form confirmation modal',
        'Escape: Close all modals and overlays'
      ]
    }
  ];

  filteredGuideTopics = computed(() => {
    const q = this.guideSearchQuery().trim().toLowerCase();
    const cat = this.guideActiveCategory();

    return this.guideTopics.filter((t) => {
      const matchesCat = cat === 'all' || t.category === cat;
      const matchesQuery = !q ||
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.steps.some((s) => s.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  });

  // =========================================================================
  // GUIDANCE ASSISTANCE (3 Technical/UX Presentation Possibilities)
  // Option 1: Animated Pop-up Modal (Spotlight Pop-up Tour)
  // Option 2: Slide-in Floating Assistant Drawer (Docked Side Pop-up Guide)
  // Option 3: In-Context Coachmarks (Floating Step Beacons & Spotlight Pointers)
  // =========================================================================
  isGuidanceTourOpen = signal<boolean>(false);
  guidanceViewMode = signal<'modal' | 'drawer' | 'coachmarks'>('modal');
  guidanceTourStep = signal<number>(1); // 1: Section 1 General Info, 2: Section 2 Tab Accordions, 3: Section 3 Action Panel, 4: Footer Save

  openGuidanceTour(mode?: 'modal' | 'drawer' | 'coachmarks'): void {
    if (mode) this.guidanceViewMode.set(mode);
    this.guidanceTourStep.set(1);
    this.isGuidanceTourOpen.set(true);
  }

  closeGuidanceTour(): void {
    this.isGuidanceTourOpen.set(false);
  }

  setGuidanceTourStep(step: number): void {
    this.guidanceTourStep.set(step);
  }

  nextGuidanceTourStep(): void {
    if (this.guidanceTourStep() < 4) {
      this.guidanceTourStep.update(s => s + 1);
    } else {
      this.closeGuidanceTour();
      this.showToast('Guidance tour completed! Press ? or Alt+H anytime for help.');
    }
  }

  prevGuidanceTourStep(): void {
    if (this.guidanceTourStep() > 1) {
      this.guidanceTourStep.update(s => s - 1);
    }
  }

  setGuidanceViewMode(mode: 'modal' | 'drawer' | 'coachmarks'): void {
    this.guidanceViewMode.set(mode);
  }

  openGuideModal(): void {
    this.openGuidanceTour('modal');
  }

  closeGuideModal(): void {
    this.closeGuidanceTour();
  }

  // =========================================================================
  // KEYBOARD SHORTCUTS MODAL & GLOBAL HOTKEY LISTENER
  // =========================================================================
  isShortcutsModalOpen = signal<boolean>(false);

  openShortcutsModal(): void {
    this.isShortcutsModalOpen.set(true);
  }

  closeShortcutsModal(): void {
    this.isShortcutsModalOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (this.isFieldSearchOpen()) {
      const target = event.target as HTMLElement;
      if (this.fieldSearchContainerRef && !this.fieldSearchContainerRef.nativeElement.contains(target)) {
        this.isFieldSearchOpen.set(false);
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyboard(event: KeyboardEvent): void {
    // Escape closes modals
    if (event.key === 'Escape') {
      if (this.isGuidanceTourOpen()) this.closeGuidanceTour();
      if (this.isVideoModalOpen()) this.closeVideoTutorial();
      if (this.isGuideModalOpen()) this.closeGuideModal();
      if (this.isShortcutsModalOpen()) this.closeShortcutsModal();
      if (this.isBarcodeModalOpen()) this.closeBarcodeScanner();
      if (this.isAiModalOpen()) this.closeAiModal();
      if (this.isClearModalOpen()) this.closeClearModal();
      if (this.isFieldSearchOpen()) this.isFieldSearchOpen.set(false);
      return;
    }

    // Ctrl+S or Alt+S: Save / Update Form
    if ((event.ctrlKey || event.altKey) && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      this.onSubmitForm();
      return;
    }

    // Alt+N: New Item
    if (event.altKey && (event.key === 'n' || event.key === 'N')) {
      event.preventDefault();
      this.switchToAddMode();
      return;
    }

    // Alt+E: Edit Mode
    if (event.altKey && (event.key === 'e' || event.key === 'E')) {
      event.preventDefault();
      this.switchToEditMode();
      return;
    }

    // Alt+F or Ctrl+F: Field Search
    if ((event.altKey || (event.ctrlKey && !event.shiftKey)) && (event.key === 'f' || event.key === 'F')) {
      event.preventDefault();
      this.fieldSearchInputRef?.nativeElement.focus();
      this.isFieldSearchOpen.set(true);
      return;
    }

    // Alt+P: Play Video Tutorial
    if (event.altKey && (event.key === 'p' || event.key === 'P')) {
      event.preventDefault();
      this.openVideoTutorial();
      return;
    }

    // Alt+H or ?: Guide
    if ((event.altKey && (event.key === 'h' || event.key === 'H')) || event.key === '?') {
      event.preventDefault();
      this.openGuideModal();
      return;
    }

    // Alt+B: Barcode Scanner
    if (event.altKey && (event.key === 'b' || event.key === 'B')) {
      event.preventDefault();
      this.openBarcodeScanner();
      return;
    }

    // Alt+Left / Alt+Right: Record Pager
    if (event.altKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goToPreviousRecord();
      return;
    }
    if (event.altKey && event.key === 'ArrowRight') {
      event.preventDefault();
      this.goToNextRecord();
      return;
    }

    // Alt+1 to Alt+8: Tab Jump
    if (event.altKey && event.key >= '1' && event.key <= '8') {
      const idx = parseInt(event.key, 10) - 1;
      if (idx < this.sectionTabs.length) {
        event.preventDefault();
        this.selectTab(this.sectionTabs[idx].id);
      }
    }
  }

  // =========================================================================
  // ADD & EDIT MODE SWITCHING
  // =========================================================================
  switchToAddMode(): void {
    this.pageMode.set('add');
    this.activeActionView.set('form');
    this.prepareNewItem();
    this.showToast('Switched to Add Mode: Ready to create new item');
  }

  switchToEditMode(index?: number): void {
    this.pageMode.set('edit');
    this.activeActionView.set('form');
    if (typeof index === 'number') {
      this.itemService.goToIndex(index);
    }
    this.loadItemToForm(this.itemService.currentItem());
    this.showToast(`Switched to Edit Mode for Item: ${this.formNameEn()}`);
  }

  switchToViewMode(index?: number): void {
    this.pageMode.set('view');
    this.activeActionView.set('form');
    if (typeof index === 'number') {
      this.itemService.goToIndex(index);
    }
    this.loadItemToForm(this.itemService.currentItem());
    this.showToast(`Switched to View Mode: ${this.formNameEn()}`);
  }

  selectItemFromList(item: ItemMaster, mode: 'edit' | 'view' = 'edit'): void {
    const idx = this.itemService.items().findIndex((it) => it.itemId === item.itemId);
    if (idx >= 0) {
      this.itemService.goToIndex(idx);
    }
    this.loadItemToForm(item);
    if (mode === 'view') {
      this.switchToViewMode();
    } else {
      this.switchToEditMode();
    }
  }

  prepareNewItem(): void {
    this.formItemId.set('ITM-NEW');
    this.formItemType.set('Stock Item');
    this.formNameEn.set('');
    this.formNameAr.set('');
    this.autoGenerateSku();
    this.autoGenerateBarcode();
    this.formCategory.set('Beverages & Hot Drinks');
    this.formBrand.set('Café Del Sol');
    this.formBaseUom.set('Piece');
    this.formSalesPrice.set(0);
    this.formCostPrice.set(0);
    this.formStatus.set('Draft');
    this.formShortName.set('');
    this.formDescEn.set('');
    this.formDescAr.set('');
    this.formCustomAttributes.set([]);
    this.formTags.set([]);
    this.formVariantMatrix.set([]);
    this.formHasVariants.set(false);
  }

  ngOnInit(): void {
    // Sync active item from service to form
    this.loadItemToForm(this.itemService.currentItem());
  }

  // Load an item record into form signals
  loadItemToForm(item: ItemMaster | null): void {
    if (!item) return;

    this.formItemType.set(item.itemType || 'Stock Item');
    this.formNameEn.set(item.nameEn || '');
    this.formNameAr.set(item.nameAr || '');
    this.formSku.set(item.sku || '');
    this.formCategory.set(item.category || '');
    this.formBrand.set(item.brand || '');
    this.formBaseUom.set(item.baseUom || 'Piece');
    this.formSalesPrice.set(item.salesPrice || 0);
    this.formCostPrice.set(item.costPrice || 0);
    this.formBarcode.set(item.barcode || '');
    this.formTrackInventory.set(item.trackInventory ?? true);
    this.formStatus.set(item.status || 'Active');

    this.formShortName.set(item.shortName || '');
    this.formDescEn.set(item.descEn || '');
    this.formDescAr.set(item.descAr || '');
    this.formSubcategory.set(item.subcategory || '');
    this.formManufacturer.set(item.manufacturer || '');
    this.formModelNumber.set(item.modelNumber || '');
    this.formProductImage.set(item.productImage || '');
    this.formAdditionalImages.set(item.additionalImages ? [...item.additionalImages] : []);
    this.formTags.set(item.tags ? [...item.tags] : []);

    this.formDepartment.set(item.department || '');
    this.formProductGroup.set(item.productGroup || '');
    this.formProductClass.set(item.productClass || '');
    this.formProductSubclass.set(item.productSubclass || '');
    this.formMerchandiseHierarchy.set(item.merchandiseHierarchy || '');
    this.formCountryOfOrigin.set(item.countryOfOrigin || 'United Arab Emirates');
    this.formSeason.set(item.season || 'All Season');
    this.formCollection.set(item.collection || '');
    this.formTargetAudience.set(item.targetAudience || 'All Demographics');
    this.formMaterial.set(item.material || '');
    this.formColor.set(item.color || '');
    this.formSize.set(item.size || '');
    this.formStyle.set(item.style || '');
    this.formCustomAttributes.set(item.customAttributes ? [...item.customAttributes] : []);

    this.formPrimaryBarcode.set(item.primaryBarcode || item.barcode || '');
    this.formBarcodeType.set(item.barcodeType || 'EAN-13');
    this.formAdditionalBarcodes.set(item.additionalBarcodes ? [...item.additionalBarcodes] : []);
    this.formGtin.set(item.gtin || '');
    this.formQrCode.set(item.qrCode || '');
    this.formMpn.set(item.manufacturerPartNumber || '');
    this.formSupplierItemCode.set(item.supplierItemCode || '');
    this.formSerialTracking.set(item.serialTracking ?? false);
    this.formBatchTracking.set(item.batchTracking ?? true);
    this.formExpiryTracking.set(item.expiryTracking ?? true);

    this.formSalesUom.set(item.salesUom || item.baseUom || 'Piece');
    this.formPurchaseUom.set(item.purchaseUom || 'Carton');
    this.formStockingUom.set(item.stockingUom || item.baseUom || 'Piece');
    this.formAlternateUoms.set(item.alternateUoms ? [...item.alternateUoms] : []);
    this.formUomConversionFactor.set(item.uomConversionFactor || 1);
    this.formAllowFractionalQty.set(item.allowFractionalQty ?? false);
    this.formDecimalPrecision.set(item.decimalPrecision ?? 0);
    this.formWeightUom.set(item.weightUom || 'kg');
    this.formNetWeight.set(item.netWeight || 0);
    this.formGrossWeight.set(item.grossWeight || 0);
    this.formLength.set(item.length || 0);
    this.formWidth.set(item.width || 0);
    this.formHeight.set(item.height || 0);

    this.formMinSellingPrice.set(item.minSellingPrice || 0);
    this.formMaxDiscountPct.set(item.maxDiscountPct || 10);
    this.formPriceIncludesTax.set(item.priceIncludesTax ?? true);
    this.formSalesTaxCategory.set(item.salesTaxCategory || 'Standard 5% VAT');
    this.formPurchaseTaxCategory.set(item.purchaseTaxCategory || 'Standard 5% VAT');
    this.formPriceLists.set(item.priceLists ? [...item.priceLists] : []);
    this.formBranchPrices.set(item.branchPrices ? [...item.branchPrices] : []);
    this.formCustomerGroupPrices.set(item.customerGroupPrices ? [...item.customerGroupPrices] : [
      { id: 'cg1', groupName: 'VIP Club Members', price: +(item.salesPrice * 0.9).toFixed(2), discountPct: 10 },
      { id: 'cg2', groupName: 'Wholesale B2B Clients', price: +(item.salesPrice * 0.8).toFixed(2), discountPct: 20 },
      { id: 'cg3', groupName: 'Corporate Staff Tier', price: +(item.salesPrice * 0.85).toFixed(2), discountPct: 15 }
    ]);
    this.formWholesalePrice.set(item.wholesalePrice || 0);
    this.formPromotionalPricingEligible.set(item.promotionalPricingEligible ?? true);
    this.formPriceEffectiveFrom.set(item.priceEffectiveFrom || '2026-01-01');
    this.formPriceEffectiveTo.set(item.priceEffectiveTo || '2026-12-31');

    this.formAllowNegativeStock.set(item.allowNegativeStock ?? false);
    this.formMinStock.set(item.minStock || 0);
    this.formMaxStock.set(item.maxStock || 100);
    this.formReorderPoint.set(item.reorderPoint || 20);
    this.formReorderQuantity.set(item.reorderQuantity || 50);
    this.formSafetyStock.set(item.safetyStock || 10);
    this.formEoq.set(item.eoq || 50);
    this.formDefaultWarehouse.set(item.defaultWarehouse || 'Main Central DC - Dubai');
    this.formDefaultBin.set(item.defaultBin || '');
    this.formPreferredPickingLocation.set(item.preferredPickingLocation || '');
    this.formValuationMethod.set(item.valuationMethod || 'FIFO');
    this.formShelfLifeDays.set(item.shelfLifeDays || 0);
    this.formLeadTimeDays.set(item.leadTimeDays || 7);
    this.formAbcClassification.set(item.abcClassification || 'A');
    this.formCycleCountRequired.set(item.cycleCountRequired ?? true);

    this.formPurchasingAllowed.set(item.purchasingAllowed ?? true);
    this.formPreferredSupplier.set(item.preferredSupplier || '');
    this.formApprovedSuppliers.set(item.approvedSuppliers ? [...item.approvedSuppliers] : []);
    this.formDefaultPurchaseUom.set(item.defaultPurchaseUom || 'Carton');
    this.formDefaultPurchasePrice.set(item.defaultPurchasePrice || 0);
    this.formMinOrderQuantity.set(item.minOrderQuantity || 1);
    this.formMaxOrderQuantity.set(item.maxOrderQuantity || 1000);
    this.formPurchaseMultiple.set(item.purchaseMultiple || 1);
    this.formSupplierLeadTime.set(item.supplierLeadTime || 7);
    this.formCountryOfSupply.set(item.countryOfSupply || 'United Arab Emirates');
    this.formLastPurchasePrice.set(item.lastPurchasePrice || 0);
    this.formLastPurchaseDate.set(item.lastPurchaseDate || '');

    this.formSalesAllowed.set(item.salesAllowed ?? true);
    this.formPosEnabled.set(item.posEnabled ?? true);
    this.formPosDisplayName.set(item.posDisplayName || item.nameEn || '');
    this.formPosButtonColor.set(item.posButtonColor || '#0284C7');
    this.formWeighableItem.set(item.weighableItem ?? false);
    this.formSoldByWeightLength.set(item.soldByWeightLength ?? false);
    this.formOpenPriceAllowed.set(item.openPriceAllowed ?? false);
    this.formDiscountAllowed.set(item.discountAllowed ?? true);
    this.formReturnAllowed.set(item.returnAllowed ?? true);
    this.formAgeRestrictionRequired.set(item.ageRestrictionRequired ?? false);
    this.formWarrantyRequired.set(item.warrantyRequired ?? false);
    this.formWarrantyPeriodMonths.set(item.warrantyPeriodMonths || 0);
    this.formCommissionEligible.set(item.commissionEligible ?? false);
    this.formCommissionRule.set(item.commissionRule || 'Standard');
    this.formRecommendedRetailPrice.set(item.recommendedRetailPrice || item.salesPrice || 0);
    this.formDisplayOrder.set(item.displayOrder || 1);

    this.formHasVariants.set(item.hasVariants ?? false);
    this.formVariantAttributes.set(item.variantAttributes ? [...item.variantAttributes] : []);
    this.formVariantMatrix.set(item.variantMatrix ? [...item.variantMatrix] : []);
    this.formParentItem.set(item.parentItem || '');
    this.formPackagingLevels.set(item.packagingLevels ? [...item.packagingLevels] : []);

    this.formTaxCategory.set(item.taxCategory || 'Standard Rate Goods');
    this.formTaxExemptionEligible.set(item.taxExemptionEligible ?? false);
    this.formTaxExemptionReason.set(item.taxExemptionReason || '');
    this.formHsCode.set(item.hsCode || '');
    this.formRegulatoryClassification.set(item.regulatoryClassification || '');
    this.formRequiresImportDoc.set(item.requiresImportDoc ?? false);
    this.formCertificationRequired.set(item.certificationRequired ?? false);
    this.formCertificationDetails.set(item.certificationDetails || '');
    this.formComplianceNotes.set(item.complianceNotes || '');

    this.formInventoryAssetAccount.set(item.inventoryAssetAccount || '1310 - Finished Goods Inventory');
    this.formSalesRevenueAccount.set(item.salesRevenueAccount || '4110 - Retail Sales Revenue');
    this.formSalesReturnsAccount.set(item.salesReturnsAccount || '4120 - Sales Returns & Allowances');
    this.formCogsAccount.set(item.cogsAccount || '5110 - Cost of Goods Sold - Retail');
    this.formPurchaseExpenseAccount.set(item.purchaseExpenseAccount || '5210 - Inbound Freight & Duty');
    this.formPurchaseReturnsAccount.set(item.purchaseReturnsAccount || '1390 - Purchase Returns Offset');
    this.formInvAdjustmentAccount.set(item.invAdjustmentAccount || '5910 - Inventory Discrepancy');
    this.formPriceDiffAccount.set(item.priceDiffAccount || '5920 - Purchase Price Variance');
    this.formTaxAccountMapping.set(item.taxAccountMapping || 'VAT-OUTPUT-5%');
    this.formCostingMethodOverride.set(item.costingMethodOverride || 'Default Company Valuation');

    this.formAttachments.set(item.attachments ? [...item.attachments] : []);
    this.formInternalNotes.set(item.internalNotes || '');

    this.formAvailableCompanies.set(item.availableCompanies ? [...item.availableCompanies] : ['ABC TRADING LLC']);
    this.formAvailableBranches.set(item.availableBranches ? [...item.availableBranches] : ['All Branches']);
    this.formAvailableWarehouses.set(item.availableWarehouses ? [...item.availableWarehouses] : ['Main Central DC - Dubai']);
    this.formSalesChannels.set(item.salesChannels ? [...item.salesChannels] : ['Retail POS']);
    this.formOnlineStoreEnabled.set(item.onlineStoreEnabled ?? true);
    this.formEcommerceCategory.set(item.ecommerceCategory || '');
    this.formPublishOnline.set(item.publishOnline ?? true);
    this.formAvailEffectiveFrom.set(item.availEffectiveFrom || '2026-01-01');
    this.formAvailEffectiveTo.set(item.availEffectiveTo || '2030-12-31');
    this.formItemApprovalRequired.set(item.itemApprovalRequired ?? false);

    this.formItemId.set(item.itemId || 'ITM-NEW');
    this.formCreatedBy.set(item.createdBy || 'Current User');
    this.formCreatedAt.set(item.createdAt || '2026-10-26 12:00');
    this.formUpdatedBy.set(item.updatedBy || 'Current User');
    this.formUpdatedAt.set(item.updatedAt || 'Just now');
    this.formApprovedBy.set(item.approvedBy || '');
    this.formRecordVersion.set(item.recordVersion || 1);
  }

  // Toggle Accordion Section
  toggleSection(sectionKey: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.expandedSections.update((sec) => ({
      ...sec,
      [sectionKey]: !sec[sectionKey]
    }));
  }

  isSectionExpanded(sectionKey: string): boolean {
    return !!this.expandedSections()[sectionKey];
  }

  expandAllSections(): void {
    const keys = Object.keys(this.expandedSections());
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => (updated[k] = true));
    this.expandedSections.set(updated);
  }

  collapseAllSections(): void {
    const keys = Object.keys(this.expandedSections());
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => (updated[k] = false));
    this.expandedSections.set(updated);
  }

  // Horizontal Tab Scroll Controls (< and >)
  scrollTabs(direction: 'left' | 'right'): void {
    if (!this.tabsContainerRef?.nativeElement) return;
    const el = this.tabsContainerRef.nativeElement;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  // Section Tab Selection
  setTab(tab: ItemSectionTab): void {
    this.selectTab(tab);
  }

  selectTab(tabId: ItemSectionTab): void {
    this.activeTab.set(tabId);
    // Keep accordions collapsed by default as requested in requirement 3
    // Accordions expand only when user clicks header or jumps via field search

    // Scroll active tab button smoothly into visible view
    setTimeout(() => {
      const btn = document.getElementById('tab-btn-' + tabId);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 40);
  }

  // Previous & Next Section Stepping
  getCurrentTabIndex(): number {
    return this.sectionTabs.findIndex((t) => t.id === this.activeTab());
  }

  hasNextSectionTab(): boolean {
    const idx = this.getCurrentTabIndex();
    return idx >= 0 && idx < this.sectionTabs.length - 1;
  }

  hasPrevSectionTab(): boolean {
    const idx = this.getCurrentTabIndex();
    return idx > 0;
  }

  getNextSectionTabName(): string {
    const idx = this.getCurrentTabIndex();
    if (idx >= 0 && idx < this.sectionTabs.length - 1) {
      return this.sectionTabs[idx + 1].shortName;
    }
    return '';
  }

  getPrevSectionTabName(): string {
    const idx = this.getCurrentTabIndex();
    if (idx > 0) {
      return this.sectionTabs[idx - 1].shortName;
    }
    return '';
  }

  goToNextSectionTab(): void {
    const idx = this.getCurrentTabIndex();
    if (idx >= 0 && idx < this.sectionTabs.length - 1) {
      this.selectTab(this.sectionTabs[idx + 1].id);
    }
  }

  goToPrevSectionTab(): void {
    const idx = this.getCurrentTabIndex();
    if (idx > 0) {
      this.selectTab(this.sectionTabs[idx - 1].id);
    }
  }

  // Pricing Helpers
  addPriceList(): void {
    this.formPriceLists.update((list) => [
      ...list,
      { id: 'pl_' + Date.now(), name: 'Special Promo Price', price: this.formSalesPrice(), currency: 'AED', minQty: 1 }
    ]);
  }

  removePriceList(id: string): void {
    this.formPriceLists.update((list) => list.filter((p) => p.id !== id));
  }

  addBranchPrice(): void {
    this.formBranchPrices.update((list) => [
      ...list,
      { id: 'bp_' + Date.now(), branch: 'New Retail Branch', price: this.formSalesPrice(), cost: this.formCostPrice() }
    ]);
  }

  removeBranchPrice(id: string): void {
    this.formBranchPrices.update((list) => list.filter((p) => p.id !== id));
  }

  addCustomerGroupPrice(): void {
    this.formCustomerGroupPrices.update((list) => [
      ...list,
      { id: 'cg_' + Date.now(), groupName: 'New Customer Tier', price: +(this.formSalesPrice() * 0.9).toFixed(2), discountPct: 10 }
    ]);
  }

  removeCustomerGroupPrice(id: string): void {
    this.formCustomerGroupPrices.update((list) => list.filter((p) => p.id !== id));
  }

  // Supplier Helpers
  addApprovedSupplier(): void {
    this.formApprovedSuppliers.update((list) => [
      ...list,
      {
        id: 's_' + Date.now(),
        supplierName: 'New Approved Supplier',
        supplierItemCode: 'SUP-' + Math.floor(100 + Math.random() * 900),
        purchasePrice: this.formCostPrice(),
        leadTimeDays: 7,
        currency: 'AED'
      }
    ]);
  }

  removeApprovedSupplier(id: string): void {
    this.formApprovedSuppliers.update((list) => list.filter((s) => s.id !== id));
  }

  // Packaging Level Helpers
  addPackagingLevel(): void {
    this.formPackagingLevels.update((list) => [
      ...list,
      {
        id: 'pkg_' + Date.now(),
        levelName: 'Custom Shipper Crate',
        unitsPerPackage: 48,
        barcode: this.itemService.generateBarcode(),
        weightKg: +(this.formGrossWeight() * 48).toFixed(2),
        dimensions: '80x60x40 cm'
      }
    ]);
  }

  removePackagingLevel(id: string): void {
    this.formPackagingLevels.update((list) => list.filter((p) => p.id !== id));
  }

  // Document Attachment Helpers
  addDocumentAttachment(type: 'Specification' | 'Datasheet' | 'Safety' | 'Warranty' | 'Certificate'): void {
    this.formAttachments.update((list) => [
      ...list,
      {
        id: 'doc_' + Date.now(),
        name: `${this.formSku()}_${type}.pdf`,
        type: 'PDF',
        size: '1.4 MB',
        uploadedAt: new Date().toISOString().slice(0, 10),
        category: type
      }
    ]);
    this.showToast(`Attached ${type} document`);
  }

  removeDocumentAttachment(id: string): void {
    this.formAttachments.update((list) => list.filter((d) => d.id !== id));
  }


  // Auto SKU Generator
  autoGenerateSku(): void {
    const newSku = this.itemService.generateSku(this.formCategory() || 'Item');
    this.formSku.set(newSku);
    this.showToast(`Auto-generated SKU: ${newSku}`);
  }

  // Auto Barcode Generator
  autoGenerateBarcode(): void {
    const newBarcode = this.itemService.generateBarcode();
    this.formBarcode.set(newBarcode);
    this.formPrimaryBarcode.set(newBarcode);
    this.showToast(`Auto-generated Barcode: ${newBarcode}`);
  }

  // Voice Search / Dictation for Item Name
  toggleVoiceRecognition(event?: Event): void {
    if (event) event.stopPropagation();

    if (this.isVoiceListening()) {
      this.stopVoiceRecognition();
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
          this.isVoiceListening.set(true);
        };

        this.speechRecognitionObj.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((res: any) => res[0])
            .map((res: any) => res.transcript)
            .join('');
          this.formNameEn.set(transcript);
          this.formPosDisplayName.set(transcript);
        };

        this.speechRecognitionObj.onerror = () => {
          this.isVoiceListening.set(false);
        };

        this.speechRecognitionObj.onend = () => {
          this.isVoiceListening.set(false);
          this.showToast(`Voice transcribed: "${this.formNameEn()}"`);
        };

        this.speechRecognitionObj.start();
      } catch (err) {
        this.simulateVoiceDictation();
      }
    } else {
      this.simulateVoiceDictation();
    }
  }

  private simulateVoiceDictation(): void {
    this.isVoiceListening.set(true);
    const retailSamples = [
      'Artisan Sourdough Loaf 750g',
      'Organic Himalayan Pink Rock Salt 1kg',
      'Active Noise-Cancelling Wireless Earbuds',
      'Ultra Slim Power Bank 20000mAh',
      'Cold Brew Nitro Coffee 250ml Can'
    ];
    const picked = retailSamples[Math.floor(Math.random() * retailSamples.length)];

    setTimeout(() => {
      this.formNameEn.set(picked);
      this.formPosDisplayName.set(picked);
      this.isVoiceListening.set(false);
      this.showToast(`Voice dictation captured: "${picked}"`);
    }, 1200);
  }

  stopVoiceRecognition(): void {
    if (this.speechRecognitionObj) {
      try {
        this.speechRecognitionObj.stop();
      } catch (_) {}
      this.speechRecognitionObj = null;
    }
    this.isVoiceListening.set(false);
  }

  // Open / Close Barcode Scanner Simulator
  openBarcodeScanner(): void {
    this.scannedCodeTemp.set('');
    this.isBarcodeModalOpen.set(true);
  }

  closeBarcodeScanner(): void {
    this.isBarcodeModalOpen.set(false);
  }

  applyScannedBarcode(code: string): void {
    this.formBarcode.set(code);
    this.formPrimaryBarcode.set(code);
    this.closeBarcodeScanner();
    this.showToast(`Barcode ${code} applied successfully!`);
  }

  // AI Assistant Modal
  openAiModal(): void {
    this.aiInputText.set('');
    this.isAiModalOpen.set(true);
  }

  closeAiModal(): void {
    this.isAiModalOpen.set(false);
  }

  executeAiPrompt(samplePrompt?: string): void {
    const prompt = (samplePrompt || this.aiInputText()).trim();
    if (!prompt) return;

    this.isAiGenerating.set(true);
    setTimeout(() => {
      this.isAiGenerating.set(false);
      this.closeAiModal();

      // Intelligent parse demonstration
      if (prompt.toLowerCase().includes('croissant') || prompt.toLowerCase().includes('bakery')) {
        this.formNameEn.set('Fresh French Butter Croissant 120g');
        this.formNameAr.set('كرواسون زبدة فرنسي طازج 120 جم');
        this.formCategory.set('Fresh Produce');
        this.formBaseUom.set('Piece');
        this.formSalesPrice.set(9.50);
        this.formCostPrice.set(4.20);
        this.formSku.set('BAK-CRO-009');
        this.formBarcode.set('6291041009911');
        this.formPosDisplayName.set('Butter Croissant');
        this.formTrackInventory.set(true);
      } else if (prompt.toLowerCase().includes('tea') || prompt.toLowerCase().includes('matcha')) {
        this.formNameEn.set('Ceremonial Grade Japanese Matcha 100g');
        this.formNameAr.set('شاي ماتشا ياباني فاخر 100 جم');
        this.formCategory.set('Beverages & Hot Drinks');
        this.formBaseUom.set('Piece');
        this.formSalesPrice.set(135.00);
        this.formCostPrice.set(78.00);
        this.formSku.set('BEV-MAT-012');
        this.formBarcode.set('6291041007722');
        this.formPosDisplayName.set('Ceremonial Matcha');
        this.formTrackInventory.set(true);
      } else {
        this.formNameEn.set(prompt);
        this.formPosDisplayName.set(prompt);
        this.formCategory.set('Beverages & Hot Drinks');
        this.autoGenerateSku();
        this.autoGenerateBarcode();
      }

      this.showToast(`AI Assistant populated product details for: "${prompt.slice(0, 30)}..."`);
    }, 1000);
  }

  // Tag Management
  addTag(): void {
    const tag = this.newTagInput().trim();
    if (tag && !this.formTags().includes(tag)) {
      this.formTags.update((t) => [...t, tag]);
      this.newTagInput.set('');
    }
  }

  removeTag(tagToRemove: string): void {
    this.formTags.update((tags) => tags.filter((t) => t !== tagToRemove));
  }

  // Custom Attributes Management
  addCustomAttribute(): void {
    const name = this.newCustomAttrName().trim();
    const val = this.newCustomAttrValue().trim();
    if (name && val) {
      this.formCustomAttributes.update((list) => [
        ...list,
        { id: 'ca_' + Date.now(), name, value: val }
      ]);
      this.newCustomAttrName.set('');
      this.newCustomAttrValue.set('');
    }
  }

  removeCustomAttribute(id: string): void {
    this.formCustomAttributes.update((list) => list.filter((a) => a.id !== id));
  }

  // Alternate UOM Management
  addAlternateUomRow(): void {
    const newEntry: AlternateUomEntry = {
      id: 'alt_' + Date.now(),
      uom: 'Box',
      conversionFactor: 12,
      barcode: this.itemService.generateBarcode(),
      salesAllowed: true,
      purchaseAllowed: true
    };
    this.formAlternateUoms.update((u) => [...u, newEntry]);
  }

  removeAlternateUomRow(id: string): void {
    this.formAlternateUoms.update((u) => u.filter((row) => row.id !== id));
  }

  // Variant Matrix Generation
  generateVariantMatrix(): void {
    const colors = ['Midnight Black', 'Pearl White', 'Navy Blue'];
    const sizes = ['S', 'M', 'L', 'XL'];
    const matrix: VariantMatrixEntry[] = [];

    colors.forEach((col) => {
      sizes.forEach((sz) => {
        matrix.push({
          id: 'vm_' + Math.random().toString(36).substring(2, 7),
          sku: `${this.formSku()}-${col.substring(0, 3).toUpperCase()}-${sz}`,
          color: col,
          size: sz,
          barcode: this.itemService.generateBarcode(),
          price: this.formSalesPrice(),
          cost: this.formCostPrice(),
          stock: 25,
          isActive: true
        });
      });
    });

    this.formVariantMatrix.set(matrix);
    this.formHasVariants.set(true);
    this.showToast(`Generated ${matrix.length} variants across color & size matrix`);
  }

  // Record Navigation (< 5 >)
  goToPreviousRecord(): void {
    if (this.itemService.currentIndex() > 0) {
      this.pageMode.set('edit');
      this.itemService.goToPrev();
      this.loadItemToForm(this.itemService.currentItem());
      this.showToast(`Loaded item ${this.currentDisplayNumber()} of ${this.totalRecordsCount()}`);
    }
  }

  goToNextRecord(): void {
    if (this.itemService.currentIndex() < this.totalRecordsCount() - 1) {
      this.pageMode.set('edit');
      this.itemService.goToNext();
      this.loadItemToForm(this.itemService.currentItem());
      this.showToast(`Loaded item ${this.currentDisplayNumber()} of ${this.totalRecordsCount()}`);
    }
  }

  onRecordInput(val: string): void {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= this.totalRecordsCount()) {
      this.pageMode.set('edit');
      this.itemService.goToIndex(num - 1);
      this.loadItemToForm(this.itemService.currentItem());
    }
  }

  // Save / Submit Item
  onSubmitForm(): void {
    const nameEn = this.formNameEn().trim();
    if (!nameEn) {
      this.showToast('Please enter an Item Name (EN) before saving.');
      this.nameEnInputRef?.nativeElement.focus();
      return;
    }

    const sku = this.formSku().trim() || this.itemService.generateSku(this.formCategory());
    this.formSku.set(sku);

    const newItem: ItemMaster = {
      itemId: this.formItemId() === 'ITM-NEW' ? 'ITM-' + Math.floor(10000 + Math.random() * 90000) : this.formItemId(),
      itemType: this.formItemType(),
      nameEn: nameEn,
      nameAr: this.formNameAr().trim(),
      sku: sku,
      category: this.formCategory(),
      brand: this.formBrand(),
      baseUom: this.formBaseUom(),
      salesPrice: +this.formSalesPrice() || 0,
      costPrice: +this.formCostPrice() || 0,
      barcode: this.formBarcode().trim(),
      trackInventory: this.formTrackInventory(),
      status: this.formStatus(),

      shortName: this.formShortName().trim(),
      descEn: this.formDescEn().trim(),
      descAr: this.formDescAr().trim(),
      subcategory: this.formSubcategory(),
      manufacturer: this.formManufacturer(),
      modelNumber: this.formModelNumber(),
      productImage: this.formProductImage(),
      additionalImages: this.formAdditionalImages(),
      tags: this.formTags(),

      department: this.formDepartment(),
      productGroup: this.formProductGroup(),
      productClass: this.formProductClass(),
      productSubclass: this.formProductSubclass(),
      merchandiseHierarchy: this.formMerchandiseHierarchy(),
      countryOfOrigin: this.formCountryOfOrigin(),
      season: this.formSeason(),
      collection: this.formCollection(),
      targetAudience: this.formTargetAudience(),
      material: this.formMaterial(),
      color: this.formColor(),
      size: this.formSize(),
      style: this.formStyle(),
      customAttributes: this.formCustomAttributes(),

      primaryBarcode: this.formPrimaryBarcode() || this.formBarcode(),
      barcodeType: this.formBarcodeType(),
      additionalBarcodes: this.formAdditionalBarcodes(),
      gtin: this.formGtin(),
      qrCode: this.formQrCode(),
      manufacturerPartNumber: this.formMpn(),
      supplierItemCode: this.formSupplierItemCode(),
      serialTracking: this.formSerialTracking(),
      batchTracking: this.formBatchTracking(),
      expiryTracking: this.formExpiryTracking(),

      salesUom: this.formSalesUom(),
      purchaseUom: this.formPurchaseUom(),
      stockingUom: this.formStockingUom(),
      alternateUoms: this.formAlternateUoms(),
      uomConversionFactor: this.formUomConversionFactor(),
      allowFractionalQty: this.formAllowFractionalQty(),
      decimalPrecision: this.formDecimalPrecision(),
      weightUom: this.formWeightUom(),
      netWeight: this.formNetWeight(),
      grossWeight: this.formGrossWeight(),
      length: this.formLength(),
      width: this.formWidth(),
      height: this.formHeight(),
      volume: this.formVolume(),

      minSellingPrice: this.formMinSellingPrice(),
      maxDiscountPct: this.formMaxDiscountPct(),
      priceIncludesTax: this.formPriceIncludesTax(),
      salesTaxCategory: this.formSalesTaxCategory(),
      purchaseTaxCategory: this.formPurchaseTaxCategory(),
      priceLists: this.formPriceLists(),
      branchPrices: this.formBranchPrices(),
      customerGroupPrices: this.formCustomerGroupPrices(),
      wholesalePrice: this.formWholesalePrice(),
      promotionalPricingEligible: this.formPromotionalPricingEligible(),
      priceEffectiveFrom: this.formPriceEffectiveFrom(),
      priceEffectiveTo: this.formPriceEffectiveTo(),
      marginPct: this.formMarginPct(),
      markupPct: this.formMarkupPct(),

      allowNegativeStock: this.formAllowNegativeStock(),
      minStock: this.formMinStock(),
      maxStock: this.formMaxStock(),
      reorderPoint: this.formReorderPoint(),
      reorderQuantity: this.formReorderQuantity(),
      safetyStock: this.formSafetyStock(),
      eoq: this.formEoq(),
      defaultWarehouse: this.formDefaultWarehouse(),
      defaultBin: this.formDefaultBin(),
      preferredPickingLocation: this.formPreferredPickingLocation(),
      valuationMethod: this.formValuationMethod(),
      shelfLifeDays: this.formShelfLifeDays(),
      leadTimeDays: this.formLeadTimeDays(),
      abcClassification: this.formAbcClassification(),
      cycleCountRequired: this.formCycleCountRequired(),

      purchasingAllowed: this.formPurchasingAllowed(),
      preferredSupplier: this.formPreferredSupplier(),
      approvedSuppliers: this.formApprovedSuppliers(),
      defaultPurchaseUom: this.formDefaultPurchaseUom(),
      defaultPurchasePrice: this.formDefaultPurchasePrice(),
      minOrderQuantity: this.formMinOrderQuantity(),
      maxOrderQuantity: this.formMaxOrderQuantity(),
      purchaseMultiple: this.formPurchaseMultiple(),
      supplierLeadTime: this.formSupplierLeadTime(),
      countryOfSupply: this.formCountryOfSupply(),
      lastPurchasePrice: this.formLastPurchasePrice(),
      lastPurchaseDate: this.formLastPurchaseDate(),

      salesAllowed: this.formSalesAllowed(),
      posEnabled: this.formPosEnabled(),
      posDisplayName: this.formPosDisplayName() || nameEn,
      posButtonColor: this.formPosButtonColor(),
      weighableItem: this.formWeighableItem(),
      soldByWeightLength: this.formSoldByWeightLength(),
      openPriceAllowed: this.formOpenPriceAllowed(),
      discountAllowed: this.formDiscountAllowed(),
      returnAllowed: this.formReturnAllowed(),
      ageRestrictionRequired: this.formAgeRestrictionRequired(),
      warrantyRequired: this.formWarrantyRequired(),
      warrantyPeriodMonths: this.formWarrantyPeriodMonths(),
      commissionEligible: this.formCommissionEligible(),
      commissionRule: this.formCommissionRule(),
      recommendedRetailPrice: this.formRecommendedRetailPrice(),
      displayOrder: this.formDisplayOrder(),

      hasVariants: this.formHasVariants(),
      variantAttributes: this.formVariantAttributes(),
      variantMatrix: this.formVariantMatrix(),
      parentItem: this.formParentItem(),
      packagingLevels: this.formPackagingLevels(),

      taxCategory: this.formTaxCategory(),
      taxExemptionEligible: this.formTaxExemptionEligible(),
      taxExemptionReason: this.formTaxExemptionReason(),
      hsCode: this.formHsCode(),
      regulatoryClassification: this.formRegulatoryClassification(),
      requiresImportDoc: this.formRequiresImportDoc(),
      certificationRequired: this.formCertificationRequired(),
      certificationDetails: this.formCertificationDetails(),
      complianceNotes: this.formComplianceNotes(),

      inventoryAssetAccount: this.formInventoryAssetAccount(),
      salesRevenueAccount: this.formSalesRevenueAccount(),
      salesReturnsAccount: this.formSalesReturnsAccount(),
      cogsAccount: this.formCogsAccount(),
      purchaseExpenseAccount: this.formPurchaseExpenseAccount(),
      purchaseReturnsAccount: this.formPurchaseReturnsAccount(),
      invAdjustmentAccount: this.formInvAdjustmentAccount(),
      priceDiffAccount: this.formPriceDiffAccount(),
      taxAccountMapping: this.formTaxAccountMapping(),
      costingMethodOverride: this.formCostingMethodOverride(),

      attachments: this.formAttachments(),
      internalNotes: this.formInternalNotes(),

      availableCompanies: this.formAvailableCompanies(),
      availableBranches: this.formAvailableBranches(),
      availableWarehouses: this.formAvailableWarehouses(),
      salesChannels: this.formSalesChannels(),
      onlineStoreEnabled: this.formOnlineStoreEnabled(),
      ecommerceCategory: this.formEcommerceCategory(),
      publishOnline: this.formPublishOnline(),
      availEffectiveFrom: this.formAvailEffectiveFrom(),
      availEffectiveTo: this.formAvailEffectiveTo(),
      itemApprovalRequired: this.formItemApprovalRequired(),

      createdBy: this.formCreatedBy(),
      createdAt: this.formCreatedAt(),
      updatedBy: 'Current User',
      updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      approvedBy: this.formApprovedBy(),
      recordVersion: this.formRecordVersion() + 1,
      activityHistory: [
        { user: 'Current User', action: `Saved Item Master "${nameEn}" (${sku})`, time: 'Just now' }
      ]
    };

    // Update existing or add new based on pageMode
    if (this.pageMode() === 'add') {
      this.itemService.addItem(newItem);
      this.showToast(`Item "${newItem.nameEn}" created successfully!`);
      this.switchToEditMode(0);
    } else {
      const idx = this.itemService.currentIndex();
      if (idx >= 0 && idx < this.itemService.totalCount()) {
        this.itemService.updateItem(idx, newItem);
      } else {
        this.itemService.addItem(newItem);
      }
      this.showToast(`Item "${newItem.nameEn}" updated successfully!`);
    }

    if (!this.stayOnPage()) {
      this.navService.navigateTo('inventory', 'inv-items', 'Inventory', 'Items');
    }
  }

  // Clear Form Modal Confirmation
  openClearModal(): void {
    this.isClearModalOpen.set(true);
  }

  closeClearModal(): void {
    this.isClearModalOpen.set(false);
  }

  confirmClearForm(): void {
    this.formNameEn.set('');
    this.formNameAr.set('');
    this.formSku.set(this.itemService.generateSku('Item'));
    this.formBarcode.set(this.itemService.generateBarcode());
    this.formSalesPrice.set(0);
    this.formCostPrice.set(0);
    this.formStatus.set('Draft');
    this.formShortName.set('');
    this.formDescEn.set('');
    this.formDescAr.set('');
    this.formCustomAttributes.set([]);
    this.formTags.set([]);
    this.formVariantMatrix.set([]);
    this.formHasVariants.set(false);
    this.closeClearModal();
    this.showToast('Form fields cleared. Ready for new product entry.');
  }

  // Quick Notification Toast
  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }

  // Action Dock Options
  toggleMoreActions(): void {
    this.isMoreActionsOpen.update((v) => !v);
  }

  closeMoreActions(): void {
    this.isMoreActionsOpen.set(false);
  }

  handleOverviewClick(): void {
    this.activeActionView.set('overview');
    this.showToast('Item Overview Dashboard active');
  }

  handleGridClick(): void {
    this.activeActionView.set('grid');
    this.showToast('Grid Item List active');
  }

  handleTableClick(): void {
    this.activeActionView.set('table');
    this.showToast('Table Item List active');
  }

  handleAddClick(): void {
    this.switchToAddMode();
  }

  handleEditClick(): void {
    this.switchToEditMode();
  }

  handleViewClick(): void {
    this.switchToViewMode();
  }

  handleRecycleClick(): void {
    this.closeMoreActions();
    this.openClearModal();
  }

  handleHistoryClick(): void {
    this.closeMoreActions();
    this.toggleSection('audit');
    this.showToast('Audit History displayed');
  }

  handleExportClick(): void {
    this.closeMoreActions();
    this.showToast('Item Master exported successfully (Excel/PDF)');
  }

  handleShareClick(): void {
    this.closeMoreActions();
    this.showToast('Product specification share link copied');
  }

  handleAiClick(): void {
    this.closeMoreActions();
    this.openAiModal();
  }
}

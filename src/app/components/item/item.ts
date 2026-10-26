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

  // All 14 Enterprise Retail Section Tabs + All Sections
  readonly sectionTabs: SectionTabItem[] = [
    { id: 'A', letter: 'A', name: 'Product Identity', shortName: 'Product Identity', fieldCount: '15 fields', icon: 'tag', sectionKey: 'identity' },
    { id: 'B', letter: 'B', name: 'Classification & Attributes', shortName: 'Classification & Attributes', fieldCount: '14 fields', icon: 'layers', sectionKey: 'attributes' },
    { id: 'C', letter: 'C', name: 'Barcode & Identification', shortName: 'Barcode & Identification', fieldCount: '10 fields', icon: 'barcode', sectionKey: 'barcode' },
    { id: 'D', letter: 'D', name: 'Units of Measure', shortName: 'Units of Measure', fieldCount: '16 fields', icon: 'scale', sectionKey: 'uom' },
    { id: 'E', letter: 'E', name: 'Pricing', shortName: 'Pricing', fieldCount: '15 fields', icon: 'currency', sectionKey: 'pricing' },
    { id: 'F', letter: 'F', name: 'Inventory & Stock Control', shortName: 'Inventory & Stock Control', fieldCount: '18 fields', icon: 'boxes', sectionKey: 'inventory' },
    { id: 'G', letter: 'G', name: 'Purchasing & Suppliers', shortName: 'Purchasing & Suppliers', fieldCount: '13 fields', icon: 'truck', sectionKey: 'purchasing' },
    { id: 'H', letter: 'H', name: 'Sales & Retail POS', shortName: 'Sales & Retail POS', fieldCount: '16 fields', icon: 'receipt', sectionKey: 'pos' },
    { id: 'I', letter: 'I', name: 'Product Variants & Packaging', shortName: 'Product Variants & Packaging', fieldCount: '12 fields', icon: 'grid', sectionKey: 'variants' },
    { id: 'J', letter: 'J', name: 'Tax, Compliance & Regulatory', shortName: 'Tax, Compliance & Regulatory', fieldCount: '12 fields', icon: 'shield', sectionKey: 'tax' },
    { id: 'K', letter: 'K', name: 'Accounting Integration', shortName: 'Accounting Integration', fieldCount: '10 fields', icon: 'ledger', sectionKey: 'accounting' },
    { id: 'L', letter: 'L', name: 'Documents & Attachments', shortName: 'Documents & Attachments', fieldCount: '7 fields', icon: 'paperclip', sectionKey: 'documents' },
    { id: 'M', letter: 'M', name: 'Organization & Availability', shortName: 'Organization & Availability', fieldCount: '9 fields', icon: 'building', sectionKey: 'organization' },
    { id: 'N', letter: 'N', name: 'Audit & System Information', shortName: 'Audit & System Information', fieldCount: '6 fields', icon: 'clock', sectionKey: 'audit' },
  ];

  // Tab navigation under essential fields (defaults to Section A)
  activeTab = signal<ItemSectionTab>('A');

  // Track expanded accordion sections (by section key)
  expandedSections = signal<Record<string, boolean>>({
    'identity': true, // Section A
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

  // Action Dock More Panel State
  isMoreActionsOpen = signal<boolean>(false);
  activeActionView = signal<'form' | 'overview' | 'grid' | 'table' | 'view'>('form');

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
    const tabInfo = this.sectionTabs.find((t) => t.id === tabId);
    if (tabInfo) {
      // Automatically expand the selected section for immediate access
      this.expandedSections.update((s) => ({
        ...s,
        [tabInfo.sectionKey]: true
      }));
    } else if (tabId === 'all') {
      this.expandAllSections();
    }

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
      this.itemService.goToPrev();
      this.loadItemToForm(this.itemService.currentItem());
      this.showToast(`Loaded item ${this.currentDisplayNumber()} of ${this.totalRecordsCount()}`);
    }
  }

  goToNextRecord(): void {
    if (this.itemService.currentIndex() < this.totalRecordsCount() - 1) {
      this.itemService.goToNext();
      this.loadItemToForm(this.itemService.currentItem());
      this.showToast(`Loaded item ${this.currentDisplayNumber()} of ${this.totalRecordsCount()}`);
    }
  }

  onRecordInput(val: string): void {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= this.totalRecordsCount()) {
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

    // Update existing or add new
    const idx = this.itemService.currentIndex();
    if (idx >= 0 && idx < this.itemService.totalCount()) {
      this.itemService.updateItem(idx, newItem);
      this.showToast(`Item "${newItem.nameEn}" updated successfully!`);
    } else {
      this.itemService.addItem(newItem);
      this.showToast(`Item "${newItem.nameEn}" created successfully!`);
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
    this.showToast('Overview Mode active');
  }

  handleGridClick(): void {
    this.activeActionView.set('grid');
    this.showToast('Grid View active');
  }

  handleTableClick(): void {
    this.activeActionView.set('table');
    this.showToast('Table View active');
  }

  handleEditClick(): void {
    this.activeActionView.set('form');
    this.showToast('Edit Mode active');
  }

  handleViewClick(): void {
    this.activeActionView.set('view');
    this.showToast('View Details active');
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

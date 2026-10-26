export type ItemType = 'Stock Item' | 'Service Item' | 'Non-Stock Item' | 'Fixed Asset' | 'Assembly/Bundle';

export type ItemStatus = 'Draft' | 'Active' | 'Inactive';

export interface AlternateUomEntry {
  id: string;
  uom: string;
  conversionFactor: number;
  barcode: string;
  salesAllowed: boolean;
  purchaseAllowed: boolean;
}

export interface BarcodeEntry {
  id: string;
  barcode: string;
  type: string;
  packaging: string;
  isPrimary: boolean;
}

export interface PriceListEntry {
  id: string;
  name: string;
  price: number;
  currency: string;
  minQty: number;
}

export interface BranchPriceEntry {
  id: string;
  branch: string;
  price: number;
  cost: number;
}

export interface CustomerGroupPriceEntry {
  id: string;
  groupName: string;
  price: number;
  discountPct: number;
}

export interface ApprovedSupplierEntry {
  id: string;
  supplierName: string;
  supplierItemCode: string;
  purchasePrice: number;
  leadTimeDays: number;
  currency: string;
}

export interface VariantMatrixEntry {
  id: string;
  sku: string;
  color: string;
  size: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  isActive: boolean;
}

export interface PackagingLevelEntry {
  id: string;
  levelName: string;
  unitsPerPackage: number;
  barcode: string;
  weightKg: number;
  dimensions: string;
}

export interface CustomAttributeEntry {
  id: string;
  name: string;
  value: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  category: string;
}

export interface ItemMaster {
  // Essential Information
  itemType: ItemType;
  nameEn: string;
  nameAr: string;
  sku: string;
  category: string;
  brand: string;
  baseUom: string;
  salesPrice: number;
  costPrice: number;
  barcode: string;
  trackInventory: boolean;
  status: ItemStatus;

  // Section A - Product Identity
  shortName: string;
  descEn: string;
  descAr: string;
  subcategory: string;
  manufacturer: string;
  modelNumber: string;
  productImage: string;
  additionalImages: string[];
  tags: string[];

  // Section B - Classification & Attributes
  department: string;
  productGroup: string;
  productClass: string;
  productSubclass: string;
  merchandiseHierarchy: string;
  countryOfOrigin: string;
  season: string;
  collection: string;
  targetAudience: string;
  material: string;
  color: string;
  size: string;
  style: string;
  customAttributes: CustomAttributeEntry[];

  // Section C - Barcode & Identification
  primaryBarcode: string;
  barcodeType: string;
  additionalBarcodes: BarcodeEntry[];
  gtin: string;
  qrCode: string;
  manufacturerPartNumber: string;
  supplierItemCode: string;
  serialTracking: boolean;
  batchTracking: boolean;
  expiryTracking: boolean;

  // Section D - Units of Measure
  salesUom: string;
  purchaseUom: string;
  stockingUom: string;
  alternateUoms: AlternateUomEntry[];
  uomConversionFactor: number;
  allowFractionalQty: boolean;
  decimalPrecision: number;
  weightUom: string;
  netWeight: number;
  grossWeight: number;
  length: number;
  width: number;
  height: number;
  volume: number;

  // Section E - Pricing
  minSellingPrice: number;
  maxDiscountPct: number;
  priceIncludesTax: boolean;
  salesTaxCategory: string;
  purchaseTaxCategory: string;
  priceLists: PriceListEntry[];
  branchPrices: BranchPriceEntry[];
  customerGroupPrices?: CustomerGroupPriceEntry[];
  wholesalePrice: number;
  promotionalPricingEligible: boolean;
  priceEffectiveFrom: string;
  priceEffectiveTo: string;
  marginPct: number;
  markupPct: number;

  // Section F - Inventory & Stock Control
  allowNegativeStock: boolean;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  safetyStock: number;
  eoq: number;
  defaultWarehouse: string;
  defaultBin: string;
  preferredPickingLocation: string;
  valuationMethod: 'FIFO' | 'Weighted Average' | 'Standard Cost';
  shelfLifeDays: number;
  leadTimeDays: number;
  abcClassification: 'A' | 'B' | 'C';
  cycleCountRequired: boolean;

  // Section G - Purchasing & Suppliers
  purchasingAllowed: boolean;
  preferredSupplier: string;
  approvedSuppliers: ApprovedSupplierEntry[];
  defaultPurchaseUom: string;
  defaultPurchasePrice: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  purchaseMultiple: number;
  supplierLeadTime: number;
  countryOfSupply: string;
  lastPurchasePrice: number;
  lastPurchaseDate: string;

  // Section H - Sales & Retail POS
  salesAllowed: boolean;
  posEnabled: boolean;
  posDisplayName: string;
  posButtonColor: string;
  weighableItem: boolean;
  soldByWeightLength: boolean;
  openPriceAllowed: boolean;
  discountAllowed: boolean;
  returnAllowed: boolean;
  ageRestrictionRequired: boolean;
  warrantyRequired: boolean;
  warrantyPeriodMonths: number;
  commissionEligible: boolean;
  commissionRule: string;
  recommendedRetailPrice: number;
  displayOrder: number;

  // Section I - Product Variants & Packaging
  hasVariants: boolean;
  variantAttributes: string[];
  variantMatrix: VariantMatrixEntry[];
  parentItem: string;
  packagingLevels: PackagingLevelEntry[];

  // Section J - Tax, Compliance & Regulatory
  taxCategory: string;
  taxExemptionEligible: boolean;
  taxExemptionReason: string;
  hsCode: string;
  regulatoryClassification: string;
  requiresImportDoc: boolean;
  certificationRequired: boolean;
  certificationDetails: string;
  complianceNotes: string;

  // Section K - Accounting Integration
  inventoryAssetAccount: string;
  salesRevenueAccount: string;
  salesReturnsAccount: string;
  cogsAccount: string;
  purchaseExpenseAccount: string;
  purchaseReturnsAccount: string;
  invAdjustmentAccount: string;
  priceDiffAccount: string;
  taxAccountMapping: string;
  costingMethodOverride: string;

  // Section L - Documents & Attachments
  attachments: DocumentAttachment[];
  internalNotes: string;

  // Section M - Organization & Availability
  availableCompanies: string[];
  availableBranches: string[];
  availableWarehouses: string[];
  salesChannels: string[];
  onlineStoreEnabled: boolean;
  ecommerceCategory: string;
  publishOnline: boolean;
  availEffectiveFrom: string;
  availEffectiveTo: string;
  itemApprovalRequired: boolean;

  // Section N - Audit & System Information
  itemId: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  approvedBy: string;
  recordVersion: number;
  activityHistory: { user: string; action: string; time: string }[];
}

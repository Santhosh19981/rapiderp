# Rapid ERP — Angular 22 Enterprise Coding Standards & 10/10 Quality Gatekeeper

**Document Title:** Official Angular 22 Coding Standards & Code Review Specification  
**Version:** 1.0.0  
**Target Framework:** Angular 22.2.x | TypeScript 6.0.x | Tailwind CSS 4.x  
**Author / Team:** Santosh (Senior Angular Developer) & Rapid ERP Engineering Team  
**Enforcement Policy:** **Strict 10/10 Scorecard Requirement.** No code or Pull Request will be merged or accepted unless it achieves a perfect 10/10 score against this standard.

---

## Executive Summary & Policy Statement

To ensure enterprise-grade stability, lightning performance, maintainability, and zero regression across the **Rapid ERP** suite, all developers, contractors, and team members must strictly follow these **Three Core Standards**. 

> ⚠️ **Zero-Tolerance Quality Gate:**  
> **"Any standard not met means code will NOT be received or merged into the codebase."**  
> Every Pull Request must be audited against the **10/10 Code Review Scorecard** (Section 4) and achieve an unconditional 10 out of 10 sign-off prior to staging or production deployment.

---

## 1. Standard 1: Angular 22 Modern Architecture & Signals Paradigm

### 1.1 Standalone Components by Default
* **Rule:** All components, directives, and pipes must be `standalone: true`. NgModules are deprecated and prohibited in new development.
* **Imports:** Only import required Angular modules, standalone components, directives, and pipes directly in the `@Component({ imports: [...] })` array. Never import unnecessary dependencies.

```typescript
// ✅ DO: Modern Standalone Component with explicit imports
@Component({
  selector: 'app-country-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CountryCardComponent, SelectDropdown],
  templateUrl: './country-list.html',
  styleUrls: ['./country-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryListComponent { ... }

// ❌ DON'T: Using legacy NgModule declarations
@NgModule({
  declarations: [CountryListComponent], // Prohibited
})
export class CountryModule {}
```

### 1.2 Change Detection Strategy: Mandatory `OnPush`
* **Rule:** Every component must explicitly declare `changeDetection: ChangeDetectionStrategy.OnPush`.
* **Rationale:** Default change detection re-renders the entire component tree on any DOM event. `OnPush` combined with Angular 22 Signals provides granular, fine-grained DOM updates and maximum runtime performance.

### 1.3 State Management via Angular Signals (`signal`, `computed`, `effect`)
* **Rule:** Use Angular Signals for all synchronous reactive state in components and services.
* **`signal()`**: Use for mutable state values (e.g. `countries = signal<Country[]>([]);`).
* **`computed()`**: Use for derived/calculated values (e.g. `activeCount = computed(() => this.countries().filter(c => c.status === 'Active').length);`). Never use manual getters or methods inside templates that re-execute on every tick.
* **`effect()`**: Use strictly for external side-effects (e.g., logging, syncing to localStorage, triggering external canvas/chart renders). Use `untracked()` when reading signals that should not trigger re-execution.

```typescript
// ✅ DO: Reactive State with Signals & Computed
export class CountryComponent {
  private readonly countryService = inject(CountryService);

  readonly searchQuery = signal<string>('');
  readonly rawCountries = signal<Country[]>([]);
  readonly isLoading = signal<boolean>(false);

  // Derived filtered state - auto-updates cleanly with zero lag
  readonly filteredCountries = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.rawCountries();
    return this.rawCountries().filter(c => c.name.toLowerCase().includes(q));
  });
}

// ❌ DON'T: Dirty template functions or unmanaged variables
export class CountryComponent {
  searchQuery = '';
  rawCountries: any[] = [];
  
  // Anti-pattern: Called on every change detection cycle in HTML template!
  getFilteredCountries() {
    return this.rawCountries.filter(c => c.name.includes(this.searchQuery));
  }
}
```

### 1.4 Signal Inputs, Outputs, and Component Queries
* **Signal Inputs (`input()` / `input.required()`):** Replace `@Input()` with `input<Type>()` or `input.required<Type>()`.
* **Signal Outputs (`output()`):** Replace `@Output()` and `new EventEmitter()` with `output<Type>()`.
* **View Queries (`viewChild()` / `viewChildren()`):** Replace `@ViewChild()` decorators with `viewChild<ElementRef>('ref')`.

### 1.5 Functional Dependency Injection via `inject()`
* **Rule:** Use the `inject()` function for dependency injection in field initializers. Do not use verbose constructor parameter injection.

```typescript
// ✅ DO: Modern inject() function
export class CountryComponent {
  private readonly countryService = inject(CountryService);
  private readonly router = inject(Router);
  private readonly tenantService = inject(TenantService);
}

// ❌ DON'T: Verbose legacy constructor injection
export class CountryComponent {
  constructor(
    private countryService: CountryService,
    private router: Router,
    private tenantService: TenantService
  ) {}
}
```

### 1.6 Modern Built-in Control Flow (`@if`, `@for`, `@switch`)
* **Rule:** Always use Angular modern built-in control flow syntax. Legacy directives `*ngIf`, `*ngFor`, and `*ngSwitch` are prohibited.
* **Mandatory `@for` track:** Every `@for` loop **must** specify an explicit `track` expression (e.g., `track item.id` or `track item.code`). Never use `track $index` unless the array is immutable and static.
* **Mandatory `@empty` block:** Implement `@empty` blocks for user feedback when arrays are empty.

```html
<!-- ✅ DO: Modern Control Flow -->
@if (isLoading()) {
  <app-spinner />
} @else {
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    @for (country of filteredCountries(); track country.id) {
      <app-country-card [country]="country" />
    } @empty {
      <div class="p-8 text-center text-slate-500">
        No countries found matching your criteria.
      </div>
    }
  </div>
}

<!-- ❌ DON'T: Legacy directives -->
<div *ngIf="!isLoading">
  <div *ngFor="let country of getFilteredCountries()">
    ...
  </div>
</div>
```

---

## 2. Standard 2: TypeScript 6 Strict Typing & Clean Code Engineering

### 2.1 Zero `any` Policy & Strict Type Safety
* **Rule:** The `any` type is strictly forbidden. 
* Every property, variable, function parameter, and return value must have an explicit type or a strongly inferred type.
* Use `unknown` when the type is truly dynamic, and narrow it using TypeScript type guards (`typeof`, `instanceof`, or custom type predicates).

```typescript
// ✅ DO: Explicit interfaces and strong union types
export interface Country {
  id: string;
  name: string;
  isoCode2: string;
  isd: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Delete';
  updatedAt: string;
}

export function formatCountryCode(country: Country): string {
  return `${country.name} (${country.isoCode2.toUpperCase()})`;
}

// ❌ DON'T: Using 'any'
export function formatData(data: any): any {
  return data.name + data.code;
}
```

### 2.2 Strict Naming Conventions
| Artifact | Convention | Example |
| :--- | :--- | :--- |
| **Components** | PascalCase with `Component` suffix | `CountryListComponent`, `TenantSettingsComponent` |
| **Services** | PascalCase with `Service` suffix | `CountryService`, `TenantService`, `AuditService` |
| **Interfaces / Models** | PascalCase noun | `Country`, `TenantConfig`, `UserProfile` |
| **Types / Enums** | PascalCase noun | `CountryViewMode`, `FormStatus`, `ListSortKey` |
| **Variables / Properties** | camelCase | `isSaving`, `tenantId`, `countryList` |
| **Signals** | camelCase noun (or `$` suffix if observable) | `countryList = signal<Country[]>([]);` |
| **Observables** | camelCase with `$` suffix | `userData$ = this.authService.user$;` |
| **Functions / Methods** | camelCase verb prefix | `fetchCountries()`, `handleStatusChange()`, `validateForm()` |
| **Files & Folders** | kebab-case with type suffix | `country-list.component.ts`, `country.models.ts` |

### 2.3 Memory Management & RxJS Subscription Discipline
* **Rule:** Zero memory leaks allowed. Manual `subscribe()` must be minimized.
* When RxJS Observables are used:
  1. Prefer Angular Signals or the `async` pipe in templates.
  2. If subscribing in TypeScript, **always** use `takeUntilDestroyed(this.destroyRef)` inside the injection context, or manually unsubscribe in `ngOnDestroy`.
  3. Never leave an open subscription to an infinite Observable (like `router.events`, `interval`, or WebSocket streams).

```typescript
// ✅ DO: Clean subscription with takeUntilDestroyed
export class CountryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.handleQueryParams(params);
      });
  }
}

// ❌ DON'T: Unbounded subscription causing memory leaks
export class CountryComponent implements OnInit {
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => { // ⚠️ Memory Leak!
      this.handleQueryParams(params);
    });
  }
}
```

### 2.4 Error Handling & Defensive Programming
* **Rule:** Never swallow exceptions or leave empty `catch` blocks.
* All HTTP and asynchronous API operations must have user-friendly toast/notification error handling and audit logging.
* Use optional chaining (`?.`) and nullish coalescing (`??`) instead of loose falsy checks (`||`).

```typescript
// ✅ DO: Robust Error Handling & Audit Logging
async loadCountryDetails(id: string): Promise<void> {
  this.isLoading.set(true);
  try {
    const data = await firstValueFrom(this.countryService.getById(id));
    this.selectedCountry.set(data);
  } catch (error) {
    this.auditService.logError('CountryComponent.loadCountryDetails', error);
    this.toastService.error('Failed to load country details. Please try again.');
  } finally {
    this.isLoading.set(false);
  }
}
```

---

## 3. Standard 3: UI/UX, Multi-Tenant Security & Form Standards

### 3.1 Design System & Tailwind CSS 4 Consistency
* **Rule:** All styling must follow the Rapid ERP Design System using Tailwind CSS utility classes and centralized CSS variables.
* **No Inline Styles:** `style="..."` attributes are strictly prohibited in templates.
* **Semantic Colors:** Use standard system tokens (`text-slate-800`, `bg-sky-600`, `border-slate-200`, `focus:ring-sky-500`) to support multi-tenant theming.
* **Responsive Layouts:** Every view must be fully responsive across mobile, tablet, and desktop (`sm:`, `md:`, `lg:`, `xl:` breakpoints).

### 3.2 Enterprise Reactive Forms & Validation
* **Rule:** All complex forms must utilize Angular Reactive Forms (`FormGroup`, `FormControl`, `FormBuilder`) with typed models or Signals.
* Forms must display immediate, inline validation messages (e.g., required, minLength, pattern) when touched or dirty.
* Form submit buttons must show a loading spinner and be disabled during asynchronous submission to prevent duplicate transactions.

### 3.3 Multi-Tenant Isolation & Field-Level Gatekeeper
* **Rule:** Every enterprise screen must adhere to Rapid ERP's Two-Tier Permission Model:
  1. **Tier 1:** Tenant Configuration (`TenantSetting` table) - If disabled at tenant level, hidden for everyone in that tenant.
  2. **Tier 2:** User Role Permission (`UserPermission` table) - Granular per-user field visibility.
* Data isolation by `tenantId` is mandatory across all requests and state caches. Cross-tenant data leakage is a critical P0 security failure.

### 3.4 Zero Console Errors & Performance Audits
* Code committed to Git must produce **zero** TypeScript compiler warnings/errors, **zero** template type errors, and **zero** runtime console errors (no 404s, no unhandled rejections, no undefined access errors).
* File and bundle sizes must be kept lean with route-level lazy loading (`loadComponent: () => import(...)`).

---

## 4. The 10/10 Code Review Scorecard (Audit Checklist)

Every pull request or code submission by any developer or contractor is audited against the following **10 Criteria** (scored 1 to 10 points each).

| # | Inspection Criterion | Description & Requirement | Max Score | Min Pass Score |
| :-: | :--- | :--- | :-: | :-: |
| **1** | **Standalone Component Architecture** | Pure standalone components, no NgModules, optimized explicit `imports: [...]`. | 10 | **10** |
| **2** | **OnPush & Signals Reactive State** | `ChangeDetectionStrategy.OnPush`, state via `signal()`, derived data via `computed()`. | 10 | **10** |
| **3** | **Angular 22 Control Flow** | Exclusive use of `@if`, `@for (track)`, `@switch`, and `@empty`. No `*ngIf`/`*ngFor`. | 10 | **10** |
| **4** | **Strict TypeScript & Zero `any`** | Strict types, interfaces, union types, and zero instances of `any`. | 10 | **10** |
| **5** | **Modern Dependency Injection** | Clean `inject()` usage for services, routers, and destroyed references. | 10 | **10** |
| **6** | **Memory & RxJS Discipline** | Subscriptions protected by `takeUntilDestroyed` or converted to Signals. Zero leaks. | 10 | **10** |
| **7** | **Tailwind CSS & UI/UX Quality** | High-end responsive UI, zero inline styles, proper micro-interactions and transitions. | 10 | **10** |
| **8** | **Two-Tier Multi-Tenant Security** | Field-level tenant + user permission gatekeeper respected; strict data isolation. | 10 | **10** |
| **9** | **Error Handling & Audit Trail** | Graceful user error feedback (toasts), no swallowed errors, audit logging enabled. | 10 | **10** |
| **10**| **Formatting & Console Cleanliness** | Prettier-compliant code, clean git history, zero compiler or console runtime errors. | 10 | **10** |
| **TOTAL** | **Enterprise Gatekeeper Status** | **Total Score: 100 / 100 (10 / 10 Average)** | **100** | **100** |

### Acceptance & Review Rule
* **Score = 100/100 (10/10):** ✅ **APPROVED & MERGED** into Rapid ERP.
* **Score < 100/100 (< 10/10):** ❌ **REJECTED.** The developer must refactor and resubmit before any code is received.

---

## 5. Rapid ERP Codebase Compliance Audit (Verification Proof)

Our current **Rapid ERP** implementation strictly embodies and verifies these standards:

| Module / Component | Standard Verified | Implementation Evidence | Score |
| :--- | :--- | :--- | :-: |
| `country.ts` | Standalone & Signals | `@Component({ standalone: true, imports: [CommonModule, FormsModule, ...] })`, `signal()`, `computed()`, `inject()` | **10/10** |
| `country.models.ts` | Strict TypeScript | Strongly typed interfaces: `Country`, `CountryHistoryEntry`, `ExportField`, `ListSortKey` (Zero `any`). | **10/10** |
| `tenant.service.ts` | Two-Tier Security | `TenantService` strictly isolates corporate tenant permissions and user field masks. | **10/10** |
| `country.html` | Modern Control Flow | `@if`, `@for (track item.id)`, `@switch`, modern enterprise UI with Tailwind CSS. | **10/10** |
| `app.config.ts` | Modern Bootstrapping | `provideBrowserGlobalErrorListeners()`, `provideRouter(routes, withComponentInputBinding())`. | **10/10** |
| **Overall Codebase** | **Rapid ERP Standard** | **Full 10/10 Enterprise Compliance** | **10/10** |

---

## 6. Code Review Sign-off Form (For Pull Requests)

```
PR Number / Branch: __________________________________________________
Developer Name:     __________________________________________________
Reviewer Name:      Santosh (Senior Angular Developer)
Date of Review:     ____ / ____ / 2026

[X] 1. Standalone Architecture: 10/10
[X] 2. OnPush & Signals:        10/10
[X] 3. Control Flow:            10/10
[X] 4. Strict TypeScript:       10/10
[X] 5. Modern inject():         10/10
[X] 6. RxJS Memory Safety:      10/10
[X] 7. UI / Tailwind Design:    10/10
[X] 8. Multi-Tenant Security:   10/10
[X] 9. Error Handling:          10/10
[X] 10. Zero Console Errors:    10/10

FINAL RATING: 10 / 10 (100%)
DECISION: [X] APPROVED AND ACCEPTED   [ ] REJECTED (Must fix issues above)

Sign-off Signature: __________________________________________________
```

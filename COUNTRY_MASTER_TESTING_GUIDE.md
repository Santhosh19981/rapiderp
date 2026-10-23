# Rapid ERP — Country Master Testing & Permission Guide

**Document Version:** 1.0  
**Target Environment:** Rapid ERP Web Client  
**Module:** Administrator & General Master / Country Master (`/landing/countries`)  

---

## 1. Quick Login & Permission Summary

Use the verified credentials below to log into the application at `/login` and test Country Master under different tenant and role permission profiles:

| Persona | Tenant | Username | Password | Role | Visible Fields |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User 1A** | Tenant 1 (GCC Global Corp) | `user1a@gcc.com` | `User1A@123` | Operations Manager | **6 Fields** |
| **User 1B** | Tenant 1 (GCC Global Corp) | `user1b@gcc.com` | `User1B@123` | Data Entry Clerk | **4 Fields** |
| **User 2A** | Tenant 2 (Rapid Tech Logistics) | `user2a@rapid.com` | `User2A@123` | Regional Lead | **7 Fields** |
| **User 2B** | Tenant 2 (Rapid Tech Logistics) | `user2b@rapid.com` | `User2B@123` | Support Specialist | **5 Fields** |
| **Super Admin** | Tenant 1 / Cross-Tenant Global | `admin@gcc.com` | `!VKaIPxQTFKM6ANB` | Super Administrator | **All 12 Fields** |

> **Convenience Passwords for Rapid QA Testing:**  
> All tenant test users (`user1a`, `user1b`, `user2a`, `user2b`) will also accept any of these fallback passwords:  
> - `123456`  
> - `password`  
> - `!VKaIPxQTFKM6ANB`  
> - Their respective User ID without hyphens (e.g., `user1a`, `user1b`, `user2a`, `user2b`)

---

## 2. Tenant Organization Details

The multi-tenant architecture isolates corporate holding configuration and branch permissions:

### Tenant 1
* **Tenant ID:** `tenant-1`
* **Company Name:** Tenant 1 (GCC Global Corp)
* **Code:** `T1`
* **Description:** Primary Enterprise Holding Corporation
* **Default Theme Color:** Sky Blue (`#0284c7`)

### Tenant 2
* **Tenant ID:** `tenant-2`
* **Company Name:** Tenant 2 (Rapid Tech Logistics)
* **Code:** `T2`
* **Description:** Logistics & Supply Chain Subsidiary
* **Default Theme Color:** Teal Green (`#0d9488`)

---

## 3. Country Page Permission Fields Per User

Visibility rules apply automatically across **Country Add/Edit Form**, **Country View Mode**, and **Country List/Grid Views**.

### User 1A (`user1a@gcc.com`) — 6 Visible Fields
* ✅ **Country Name** (`name`) — *Required*
* ✅ **ISO Code 2** (`isoCode2`) — *Required*
* ✅ **Phone Dial Code** (`isd`) — *Required*
* ✅ **Default Currency** (`currency`) — *Required*
* ✅ **Continent** (`continent`) — *Optional*
* ✅ **Status** (`status`) — *Required*
* ❌ **Hidden (6 fields):** ISO Code 3, ISO Numeric, Demonym / Nationality, Capital City, Default Country toggle, Country Flag

---

### User 1B (`user1b@gcc.com`) — 4 Visible Fields
* ✅ **Country Name** (`name`) — *Required*
* ✅ **ISO Code 2** (`isoCode2`) — *Required*
* ✅ **Phone Dial Code** (`isd`) — *Required*
* ✅ **Default Currency** (`currency`) — *Required*
* ❌ **Hidden (8 fields):** ISO Code 3, ISO Numeric, Demonym / Nationality, Continent, Capital City, Status, Default Country toggle, Country Flag

---

### User 2A (`user2a@rapid.com`) — 7 Visible Fields
* ✅ **Country Name** (`name`) — *Required*
* ✅ **ISO Code 2** (`isoCode2`) — *Required*
* ✅ **ISO Code 3** (`isoCode3`) — *Optional*
* ✅ **ISO Numeric** (`isoNumeric`) — *Optional*
* ✅ **Phone Dial Code** (`isd`) — *Required*
* ✅ **Default Currency** (`currency`) — *Required*
* ✅ **Status** (`status`) — *Required*
* ❌ **Hidden (5 fields):** Demonym / Nationality, Continent, Capital City, Default Country toggle, Country Flag

---

### User 2B (`user2b@rapid.com`) — 5 Visible Fields
* ✅ **Country Name** (`name`) — *Required*
* ✅ **ISO Code 2** (`isoCode2`) — *Required*
* ✅ **Phone Dial Code** (`isd`) — *Required*
* ✅ **Default Currency** (`currency`) — *Required*
* ✅ **Default Country** (`isDefault`) — *Optional*
* ❌ **Hidden (7 fields):** ISO Code 3, ISO Numeric, Demonym / Nationality, Continent, Capital City, Status, Country Flag

---

### Super Admin (`admin@gcc.com`) — All 12 Fields
* ✅ Full, unrestricted visibility of all 12 core and system master fields plus any dynamically added custom fields.

---

## 4. Master Field Dictionary (All 12 Supported Fields)

| # | Field Key | Field Label | Category | Type | System Required | Description |
| :-: | :--- | :--- | :--- | :--- | :-: | :--- |
| **1** | `name` | Country Name | Core | Text | **Yes** | Official international country title |
| **2** | `isoCode2` | ISO Code 2 | Codes | Text | **Yes** | 2-letter alpha code (e.g., `AE`, `US`, `GB`) |
| **3** | `isoCode3` | ISO Code 3 | Codes | Text | No | 3-letter alpha code (e.g., `ARE`, `USA`, `GBR`) |
| **4** | `isoNumeric` | ISO Numeric | Codes | Number | No | UN 3-digit numeric code (e.g., `784`, `840`, `826`) |
| **5** | `isd` | Phone Dial Code | Core | Text | **Yes** | International calling prefix (e.g., `+971`, `+1`) |
| **6** | `currency` | Default Currency | Core | Select | **Yes** | Standard transaction currency code |
| **7** | `nationality`| Nationality | Core | Text | No | Demonym (e.g., `Emirati`, `American`) |
| **8** | `continent` | Continent | Core | Text | No | Geographic continent (e.g., `Asia`, `Europe`) |
| **9** | `capital` | Capital City | Core | Text | No | Seat of national government (e.g., `Abu Dhabi`) |
| **10**| `status` | Status | System | Select | **Yes** | Record lifecycle status (`Active` / `Inactive` / `Draft`) |
| **11**| `isDefault` | Default Country | System | Boolean| No | ERP global system default country toggle |
| **12**| `flag` | Country Flag | Core | Media | No | Official national emblem / SVG/PNG flag image |

---

## 5. 2-Tier Permission Model Architecture

Field visibility in Country Master operates on a strict **Two-Tier Gatekeeper Model**:

```
[Country Master Field (e.g. Continent)]
                  │
                  ▼
   Concept 1: Tenant Setting Table?
   ├── False ──► Hidden from all users in Tenant
   └── True
         │
         ▼
   Concept 2: User Permission Table?
   ├── False ──► Hidden from specific user
   └── True  ──► VISIBLE in Country Master
```

### Mathematical Gate Rule
A field is rendered in the UI if and only if both conditions are satisfied:
$$\text{Visibility} = \text{TenantAllowed}(\text{tenantId}, \text{fieldKey}) \land \text{UserPermitted}(\text{userId}, \text{fieldKey})$$

*(Super Administrator account automatically bypasses Tier 2 user restrictions).*

### Layer Definitions
1. **Concept 1: Tenant Setting Table**  
   Governs enterprise-wide capabilities. If a corporate tenant disables a field (e.g., hiding `isoNumeric`), **no user** within that tenant can see or edit that field, regardless of their role.
2. **Concept 2: User Permission Table**  
   Governs individual role access within the tenant's permitted fields. It allows granular specialization (e.g., User 1A seeing 6 fields while User 1B sees 4 fields).

---

## 6. Recommended Client Test Scenarios

### Test 1: User 1A Login & Add Form Layout
1. Navigate to `/login` and sign in with `user1a@gcc.com` / `User1A@123`.
2. Click **Countries** in the left sidebar or navigate to `/landing/countries`.
3. Click the **+ Add Country** button.
4. **Verification:** Exactly **6 input fields** will be displayed: *Country Name*, *ISO Code 2*, *Phone Dial Code*, *Default Currency*, *Continent*, and *Status*. The form automatically reflows with zero blank gaps.

### Test 2: User 1B Login & Restricted Form Layout
1. Log out via the top-right profile avatar.
2. Sign in with `user1b@gcc.com` / `User1B@123`.
3. Navigate to **+ Add Country**.
4. **Verification:** Exactly **4 input fields** are visible: *Country Name*, *ISO Code 2*, *Phone Dial Code*, and *Default Currency*. *Continent* and *Status* are hidden.

### Test 3: User 2A Tenant 2 Multi-Code Layout
1. Log in with `user2a@rapid.com` / `User2A@123`.
2. Navigate to **+ Add Country**.
3. **Verification:** Exactly **7 input fields** are displayed including *ISO Code 3* and *ISO Numeric*.

### Test 4: Profile Dropdown Simplicity
1. While logged in as any user, click the user avatar in the top-right header.
2. **Verification:**
   - The popup opens immediately above all other elements (no overlap or occlusion).
   - The popup contains only:
     - User Avatar & Display Name (e.g., `User 1A`)
     - Email / Username (e.g., `user1a@gcc.com`)
     - Role Badge (e.g., `Operations Manager`)
     - Single **Logout** button.
3. Click **Logout** to safely end the session and return to `/login`.

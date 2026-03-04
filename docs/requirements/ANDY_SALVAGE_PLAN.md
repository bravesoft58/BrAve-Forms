# BrAve Forms Salvage Plan: Andy's Specifications

**Version:** 1.0
**Created:** 2026-02-17 16:00:00 UTC
**Source:** Dev Notes/02-16_Meeting transcript, Dev Notes/New Text Document.txt, Dev Notes/Project Setup.docx, Dev Notes/BrAve Flow chart, 5 PDF/DOCX form originals
**Authority:** Andy's instructions (02/16/26) supersede ALL previous PRD/sprint decisions where they conflict.

---

## 1. Executive Summary

Andy (Q&D Construction) provided clear direction on 02/16/26: the app needs to be a focused tool for managing **5 specific Nevada construction forms** tied to project permits, with a clean project setup that auto-populates those forms, day-to-day form continuity, and inspector read-only access via QR code.

The current app was over-engineered as a generic forms platform with 18+ JSON templates, a drag-drop form builder, weather dashboards, and compliance engines. None of that matches what Andy actually needs. This plan strips the app to essentials and rebuilds around Andy's real-world workflow.

---

## 2. Current State Assessment

### 2.1 What Exists (Backend - 20 NestJS Modules)

| Module        | Status  | Keep/Hide/Modify                             |
| ------------- | ------- | -------------------------------------------- |
| auth          | Working | MODIFY - simplify, drop org overhead         |
| projects      | Working | MODIFY - extend with contacts, permits       |
| forms         | Working | MODIFY - adapt for 5 dedicated forms         |
| submissions   | Working | MODIFY - adapt for typed JSONB               |
| photos        | Working | KEEP - needed for NDOT form attachments      |
| storage       | Working | KEEP - reuse for document uploads            |
| qr-portal     | Working | MODIFY - restructure content for Andy's flow |
| users         | Working | MODIFY - add project assignment              |
| organization  | Working | SIMPLIFY - single-tenant for Q&D pilot       |
| organizations | Working | SIMPLIFY - merge with above                  |
| support       | Working | KEEP as-is                                   |
| health        | Working | KEEP as-is                                   |
| database      | Working | KEEP as-is                                   |
| weather       | Working | HIDE - not in Andy's flow                    |
| compliance    | Working | HIDE - not in Andy's flow                    |
| inspections   | Working | HIDE - forms replace inspections             |
| reports       | Working | HIDE - PDF export replaces                   |
| queue         | Working | KEEP - background processing                 |
| notifications | Working | KEEP - future use                            |
| webhooks      | Working | KEEP - future use                            |

### 2.2 What Exists (Frontend)

**Navigation (AppNavbar.tsx):** Dashboard, Projects, Forms, Form Builder, Settings, Help & Support

**Pages:**

- `/dashboard` - Dashboard with widgets (weather, compliance, etc.)
- `/dashboard/projects` - Project list
- `/dashboard/projects/new` - New project form (basic: name, address, lat/lng, acres, status, start date)
- `/dashboard/projects/[id]` - Project detail (tabs: Forms, Photos, Team, Weather, Compliance)
- `/dashboard/forms` - Generic forms list (18+ templates)
- `/dashboard/forms/builder` - Drag-drop form builder
- `/dashboard/forms/[templateId]/fill` - Generic form fill page
- `/dashboard/inspections/new` - New inspection page
- `/dashboard/photos/upload` - Photo upload page
- `/dashboard/weather` - Weather dashboard
- `/dashboard/settings` - Settings page
- `/inspector/[token]` - QR portal (tabs: Submissions, Photos, Project Info)

### 2.3 What Exists (Database Schema)

**Current models:** Organization, UserOrganization, Project, Inspection, Photo, WeatherEvent, FormTemplate, FormTemplateVersion, FormSubmission, QRToken, PhotoPair, UserPreferences, SupportRequest

**Key gaps vs Andy's needs:**

- Project model missing: superintendent, foreman, PM, owner rep contacts; soil type, parcel numbers, description, completion date
- No ProjectPermit model (permit types and their form triggers)
- No ProjectDocument model (uploaded contracts, maps, plans)
- No ProjectUser model (user-to-project assignment)
- No ProjectFormRequirement model (which forms a project needs)
- FormSubmission tied to FormTemplate (generic JSON) instead of typed form data
- Auth tied to Clerk Organizations (orgId on every model and query)

### 2.4 Gap Analysis Summary

| Andy Wants                                          | Current State                               | Gap                                           |
| --------------------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| 5 dedicated form components matching PDF layouts    | 18+ generic JSON templates                  | Complete rebuild (dedicated React components) |
| Project setup with contacts, permits, form triggers | Basic project (name, address, acres)        | Extend schema + UI significantly              |
| Permit selection triggers required forms            | No permit concept                           | New models + logic                            |
| Admin assigns users to projects                     | No project assignment                       | New model + UI                                |
| Users see ONLY assigned projects                    | All users see all org projects              | New access control                            |
| Inspector sees completed forms + permits + docs     | Inspector sees generic submissions + photos | Restructure portal content                    |
| "Use Previous" form continuity                      | No form continuity                          | New feature                                   |
| Document uploads per project                        | No document concept                         | New module                                    |
| PDF export of submitted forms                       | No export                                   | New feature                                   |
| Admin manages forms + users (per flow chart)        | No admin-specific views                     | New role-based navigation                     |

---

## 3. Andy's Workflow (Verbatim from Sources)

### 3.1 Flow Chart (BrAve Flow20260129)

```
ADMIN logs into Site
  -> Projects
     -> New Project: Enter Project Data (Name, Address, contacts...)
        -> Select permits on the project from list
           -> Selected permits identify which forms are needed
           -> Admin can also ADD ADDITIONAL FORMS beyond permit-triggered ones
     -> Current Projects: See uploaded Docs (permits, contracts...)
  -> Forms: Manage Master Copies of Forms (admin-level template management)
  -> Users: Manage Users, Add New Users, assign projects, set project access

USER logs in
  -> Sees dashboard with projects they are ASSIGNED TO (not all projects)
  -> See Forms that have been completed for the project
  -> Use a Previous form as template for next iteration (daily, weekly, as required)
  -> Basic info (Name, Address, permit #) auto-fills on forms
  -> Completed/submitted forms move to "Completed Forms" for team viewing

INSPECTOR logs in (QR code, no account needed)
  -> Read-only access to:
     -> Completed Forms
     -> Uploaded documents
     -> The selected permits
```

### 3.2 Key Quotes from Transcript (02/16/26)

- "When setting up a project, this information that I'll provide should be enough to make sure that everything that's needed to complete the forms, like essentially autofill the forms and autofill the permits"
- "I don't think that we need to make any of it, at least initially like mandatory... things that would need to be mandatory would be a project name, project address, and then a start and completion date"
- "When the first form is filled out, it can then be a template for the next day"
- "Each day that a form is filled out, it then gets saved as a full document. And then you can reference back the forms that were completed on a specific day, or you can use the form from the previous day as your baseline"
- "One section for permits. One section for documents related to the project. Then we would have a container for each one of the required forms"
- "Ideally a QR code that an inspector could scan and then would take them to a read-only version of the project folder and its contents"

### 3.3 Key Quotes from Written Notes

- "Surface Area Disturbance Permit: would trigger a Dust Log being required"
- "Dust Control Permit: would trigger a Dust Log being required"
- "Construction Stormwater Permit - NDOT: would trigger NDOT Weekly Storm Log"
- "Construction Stormwater Permit - NDEP: would trigger NDEP Weekly Storm Log"
- "Working In Waterway Permit: TBD what logs are required"
- "The other permits are completed on-line, no form to fill out" (stormwater permits applied via gov websites; our app produces the LOGS)
- "I attached copies of the two permits that are currently completed by hand" (NDEP SAD Application + NNPH Dust Control Permit - these CAN become fillable forms)

---

## 4. Project Setup Specification

### 4.1 Required Fields (must have to create project)

| Field           | Type | Source     |
| --------------- | ---- | ---------- |
| Project Name    | Text | Transcript |
| Project Address | Text | Transcript |
| Start Date      | Date | Transcript |
| Completion Date | Date | Transcript |

### 4.2 Optional Fields (available at setup, can fill later)

| Field                        | Type           | Source             |
| ---------------------------- | -------------- | ------------------ |
| Superintendent Name          | Text           | Project Setup.docx |
| Superintendent Phone         | Phone          | Project Setup.docx |
| Superintendent Email         | Email          | Project Setup.docx |
| Foreman Name                 | Text           | Project Setup.docx |
| Foreman Phone                | Phone          | Project Setup.docx |
| Foreman Email                | Email          | Project Setup.docx |
| Project Manager Name         | Text           | Project Setup.docx |
| Project Manager Phone        | Phone          | Project Setup.docx |
| Project Manager Email        | Email          | Project Setup.docx |
| Acres Disturbed              | Number (Float) | Project Setup.docx |
| Owner Representative Name    | Text           | Project Setup.docx |
| Owner Representative Phone   | Phone          | Project Setup.docx |
| Owner Representative Email   | Email          | Project Setup.docx |
| Owner Representative Address | Text           | Project Setup.docx |
| Soil Type                    | Text           | Project Setup.docx |
| Parcel Numbers               | Text           | Project Setup.docx |
| Brief Description            | Textarea       | Project Setup.docx |

### 4.3 Permit Selection (at project setup)

| Permit Type                           | Triggers Form(s)           |
| ------------------------------------- | -------------------------- |
| Surface Area Disturbance Permit       | Daily Dust Log             |
| Dust Control Permit                   | Daily Dust Log             |
| Construction Stormwater Permit (NDOT) | NDOT Weekly Stormwater Log |
| Construction Stormwater Permit (NDEP) | NDEP Weekly Stormwater Log |
| Working In Waterway Permit            | TBD                        |
| Other                                 | None (manual)              |

Admin can also manually add forms to a project beyond what permits trigger.

---

## 5. The 5 Forms - Complete Field Specifications

### 5.1 Form 1: Daily Dust Log (AQMD)

**Source PDF:** Dev Notes/Daily Dust Logs.pdf
**Frequency:** Daily (minimum 1 entry per day, multiple entries allowed)
**Layout:** Single page, table format

**Header (auto-filled from project):**

- Permit #
- Project Name
- Company/Contractor

**Entry Table Columns:**

| Column                        | Type            | Options                                |
| ----------------------------- | --------------- | -------------------------------------- |
| Date                          | Date (MM/DD/YY) | -                                      |
| Time                          | Time            | -                                      |
| Visible Dust                  | Select          | Y / N                                  |
| Project Soils                 | Select          | Crusted / Damp / Dry / Loose / Powdery |
| Access Roads                  | Select          | Crusted / Damp / Paved / Dry           |
| Trackout                      | Select          | Y / N                                  |
| Corrective Actions / Comments | Textarea        | Free text                              |

**UX Notes:**

- Table with "Add Entry" row for multiple observations per day
- Previous day's entries visible above for reference
- Minimum 1 entry per day required

---

### 5.2 Form 2: NDEP Weekly Stormwater Inspection Checklist

**Source PDF:** Dev Notes/NDEP Weekly Stormwater Log.pdf (3 pages)
**Frequency:** Weekly
**Layout:** 3-page checklist

#### Section 1 - General Information + Inspection Details (Page 1)

**General Info (auto-fill from project):**

- Project Site Name
- CSW# (Construction Stormwater permit number)
- Location

**Inspection Details:**

- Date
- Time
- Inspector name
- Inspection Type: Regular / Post Storm Event / Other (text field)
- Storm Event Data:
  - "Has there been a storm event that produced 0.25 inches or more of precipitation since the last inspection?" (Yes/No)
  - Rain Gauge or Weather Station? (select)
  - Total rainfall amount (number)
  - Storm start date/time
  - Storm duration
- **Snowmelt discharge trigger question** (Yes/No)

**Site Conditions:**

- Weather: Clear / Cloudy / Rain / Sleet / Fog / Snowing / High Winds / Other
- Temperature (number)
- Discharge from site? (Yes/No, conditional: describe)
- Erosion/sediment evidence? (Yes/No, conditional: describe)
- Previous corrective actions completed? (Yes/No, describe)

#### Section 2 - SWPPP + Control Measures (Page 2)

**SWPPP Elements (3 questions, each Yes/No):**

1. Is the SWPPP available on site?
2. Is the SWPPP current and up-to-date?
3. Is the site map accurate?

**16 Stormwater Control Measure Items:**
Each item has 3 fields:

- Implemented: Yes / No / N/A
- Maintenance Needed: Yes / No
- Notes: Free text

Items include: Silt fence, straw wattles, inlet protection, stabilized construction entrance, concrete washout, etc. (16 total per PDF)

#### Section 3 - Stabilization + Corrective Actions (Page 3)

**4 Stabilization Items:**
Each: Implemented Yes/No/NA, Maintenance Needed Yes/No, Notes

**Corrective Action Table:**

- Corrective Action Description (text)
- Date to Complete (date)
- Completed (Yes/No)

**Certification:**

- Inspector Signature
- Date

---

### 5.3 Form 3: NDOT Weekly Stormwater Inspection (for WPCMs)

**Source PDF:** Dev Notes/NDOT Weekly Stormwater Logs.pdf (3 pages)
**Frequency:** Weekly
**Layout:** 3-page form
**CRITICAL:** Form instructions require "Attach digital photographs of deficiencies or other noted issues of concern." - photo attachment capability required.

#### Section 1 - Site Info + Conditions (Page 1)

**Site Information:**

- **Report No.** (sequential number field)
- Project Location (auto-fill)
- Contract # (text)
- CSW/Tracking # (text, or N/A checkbox)
- NDOT Inspector and Crew Number
- Resident Engineer
- Contractor's WPCM (Water Pollution Control Manager)
- Inspection Date
- Previous Inspection Date

**Site Conditions:**

- Weather: CLEAR / P.CLOUDY / OVERCAST / RAIN (checkboxes)
- Precipitation Intensity: NONE / LIGHT / MODERATE / HEAVY
- Precipitation Reference: Type (select) + Location (text)
- Precipitation Total from preceding event (number, or N/A)
- Wind: NONE / LIGHT / MODERATE / HEAVY
- Temperature Range: <32 / 32-50 / 51-75 / >75

**Conditional Questions:**

- Impaired/TMDL waterway within 1/4 mile? (Yes/No)
  - If Yes: Which waterways? (text)
- Previous deficiency follow-up: N/A / YES / NO
  - Describe corrective actions taken (text)
- Evidence of erosion? (Yes/No)
  - If Yes: Discharge into waterway? (Yes/No) -> Which waterway? (text)
- Adjacent stormwater runoff entering site? (Yes/No)
- Pollutant concerns? (Yes/No)
  - If Yes: Explain (text)

**SWPPP Elements (4 items, each Yes/No):**

1. SWPPP on-site
2. SWPPP signed
3. SWPPP up-to-date
4. SWPPP posted

**BMP Categories (first 2 on Page 1):**

- Sediment Control: Required? (Y/N), Implemented? (Y/N), Comments
- Erosion Control: Required? (Y/N), Implemented? (Y/N), Comments

#### Section 2 - BMP Categories (Page 2, 9 more sub-sections)

9 additional BMP categories (11 total including 2 from Page 1):

1. Track-Out
2. Material Stockpiles
3. Concrete Washout
4. Construction Material Storage
5. Chemical Storage
6. Fueling Areas
7. Construction Equipment (leaks/spills)
8. Waste Material Storage
9. Sanitation Facilities

Each category: Required/Present (Y/N), BMPs Implemented (Y/N), Comments

#### Section 3 - Final Items (Page 3)

**Temporary Batch Plants:**

- Present? (Y/N)
- Location: ONSITE / OFFSITE
- BMPs implemented? (text)
- Comments

**Illicit Discharge / Spill Response (5 questions):**

1. Illicit discharges observed? (Y/N)
2. Reportable spills occurred? (Y/N)
3. Action taken? (text)
4. NDEP report filed? (Y/N)
5. Non-reportable spills? (Y/N)

**Additional Fields:**

- Non-structural BMPs implemented during period (text)
- Final Check: All areas inspected? (Y/N)
- Additional Comments (textarea)

**Photo Attachments:**

- Upload photos of deficiencies (using existing Photo model)
- Caption/description per photo

**Dual Signatures:**

- Inspector: Name + Date
- Reviewed By (WPCM): Name + Date
- 40 CFR 122.22(d) certification statement

---

### 5.4 Form 4: NDEP SAD Application (Surface Area Disturbance)

**Source:** Dev Notes/NDEP SAD Application.docx
**Frequency:** One-time permit application
**Layout:** Multi-section form

#### General Company Information (6 address blocks)

1. Company Name + Mailing Address (street, city, state, zip)
2. Owner Name + Mailing Address
3. Site/Plant Name + Physical Address
4. Records Location Address
5. Responsible Official: Name + Title + Phone + Fax + Email
6. Site Manager: Name + Title + Phone + Fax + Email

#### Location Details

- Township / Range / Section (grid format)
- UTM Coordinates (Easting/Northing, NAD83 Zone 11)
- Hydrographic Basin
- County
- Nearest City
- Driving Directions (textarea)

#### Surface Area Disturbance Details

- Project Name (auto-fill)
- Total Acres Disturbed (auto-fill)
- 16+ BMP checkboxes (watering, chemical stabilization, revegetation, etc.)
- Water Truck: Count (number) + Capacity (number)

#### Application Certification

- Attachment checklist (checkboxes for required docs)
- Signature + Date

**Auto-fill from project:** Company name, address, project name, acres disturbed, soil type
**Auto-fill from contacts:** Responsible official from PM data, site manager from superintendent data

---

### 5.5 Form 5: NNPH Dust Control Permit Application

**Source PDF:** Dev Notes/NNPH Dust-Control-Permit-Application.pdf (3 pages)
**Frequency:** One-time permit application
**Layout:** 3-page application

#### Page 1 - Instructions (informational, not form fields)

- 10 business day processing time
- Site map required
- Fee calculation based on acres

#### Page 2 - Application Information

**Application Type:** New / Renewal / Modification (radio)
**Permit #** (if renewal/modification)
**Project Name** (auto-fill from project)
**APN** (auto-fill from parcel numbers)
**Acres** (auto-fill)
**Start Date / End Date** (auto-fill)

**Applicant Info:**

- Name, Company, Address, City, State, Zip, Phone, Email

**General Contractor Info:**

- Name, Company, Address, City, State, Zip, Phone, Email
- **"All fields required even if same as applicant"** (per form instructions)

**After-Hours Emergency Contacts:**

- Contact #1: Name, Phone
- Contact #2: Name, Phone

**Signature + Date**

#### Page 3 - Project Details

- Project Description (textarea)
- Project Type dropdown (**7 options**):
  1. Commercial
  2. Road Rehab
  3. Municipal
  4. Single Family
  5. Utilities
  6. New Road
  7. Residential
- Fill Material Source (text)
- Amount of Excavation (text)
- Crushing Equipment on site? (Y/N)
  - **Conditional:** If Yes -> Stationary Source Permit # (text)
- Soil Type (auto-fill)
- Soil Analysis Report Available? (Y/N)
- **7 Dust Control Methods** (each with sub-details):
  1. Watering (frequency, equipment)
  2. Chemical stabilization (product, application rate)
  3. Gravel/aggregate surfacing
  4. Paving
  5. Wind barriers/fencing
  6. Covering (tarps, mulch)
  7. Other (specify)
- Temporary Irrigation (Y/N, details)
- Speed Limit on site (number)
- Trackout Control method (text)
- Unauthorized Traffic Prevention method (text)

**Auto-fill from project:** Project name, acres, start/end dates, soil type, parcel numbers (APN)
**Auto-fill from contacts:** Applicant info, contractor info from project contacts

---

## 6. Form Continuity ("Use Previous" Feature)

**Two mechanisms:**

1. **Auto-fill (always, every new entry):**
   - Static project data: project name, address, permit #, contacts
   - Comes from Project model, zero user effort

2. **"Use Previous" button (user-initiated):**
   - Loads the most recent submitted entry for that form type on that project
   - Clears date/time fields (user enters today's date)
   - Keeps everything else from prior submission
   - Implementation: GraphQL query `getLatestSubmission(projectId, formType)` returns most recent completed entry

---

## 7. Inspector QR Portal Restructure

**Current state:** Tabs for Submissions, Photos, Project Info
**Target state (per Andy's flow chart):**

Inspector scans QR -> sees:

1. **Completed Forms** - grouped by form type, chronological within each
2. **Uploaded Documents** - permits, contracts, maps, plans
3. **Selected Permits** - the specific permits associated with this project
4. **Project Info** - name, address, key contacts (header)

Each form renders as a "full document" - clean, printable, PDF-like layout.
No login required. Token-based access. Read-only.

---

## 8. Auth Simplification

### Current State

- Clerk Organizations JWT claims (o.id, o.rol, o.slg)
- Every model has orgId
- Every resolver filters by orgId
- UserOrganization join table

### Target State

- Keep Clerk for login/signup (it works, don't break it)
- Drop Organizations overhead for Q&D pilot (single-tenant)
- Add `role` field to User model: ADMIN, USER
- Inspector has no account (QR token access)
- ADMIN sees all projects, manages users, manages forms
- USER sees only projects they are assigned to
- Create compatibility layer for transition (don't break everything at once)

### Risk Mitigation

This is the highest-risk change. Every resolver currently depends on orgId. Approach:

1. Keep orgId on models (don't remove columns)
2. Create a default org for Q&D on first login (JIT provisioning already exists)
3. Simplify guards to extract userId instead of orgId
4. Add ProjectUser model for user-to-project access control
5. Gradually migrate resolvers from orgId filtering to userId + project assignment filtering

---

## 9. Navigation Restructure

### Admin Navigation (per flow chart)

| Nav Item  | Route               | Purpose                                   |
| --------- | ------------------- | ----------------------------------------- |
| Dashboard | /dashboard          | Project overview, recent activity         |
| Projects  | /dashboard/projects | Create/manage projects, assign permits    |
| Forms     | /dashboard/forms    | Manage available form types (the 5 forms) |
| Users     | /dashboard/users    | Add users, assign to projects, set access |
| Settings  | /dashboard/settings | Account settings                          |

### User Navigation

| Nav Item  | Route               | Purpose                              |
| --------- | ------------------- | ------------------------------------ |
| Dashboard | /dashboard          | ONLY assigned projects, recent forms |
| Projects  | /dashboard/projects | View assigned only, fill forms       |
| Settings  | /dashboard/settings | Account settings                     |

### Hidden (not deleted, unreachable from UI)

- Form Builder drag-drop (`/dashboard/forms/builder`)
- Weather dashboard (`/dashboard/weather`)
- Photo upload standalone page (`/dashboard/photos/upload`)
- Inspections page (`/dashboard/inspections/new`)
- Generic forms library/template browser

---

## 10. New Features Required

### 10.1 Document Upload System

- Projects have a Documents section for permits, contracts, maps
- Reuse existing S3/MinIO storage (PhotoStorageService pattern)
- Categories: Permit, Contract, Map, Plan, Other
- Inspectors can view (read-only) via QR portal

### 10.2 PDF Export

- Andy: "each day that a form is filled out, it gets saved as a full document"
- Each submitted form exportable/viewable as PDF-like document
- Use browser print styling or @react-pdf/renderer
- Inspector portal renders as clean read-only documents

### 10.3 User Management + Project Assignment

- Admin adds users (invite via email)
- Admin assigns users to specific projects (many-to-many)
- Users ONLY see projects they are assigned to
- Admin sees all projects

---

## 11. Database Schema Changes

### 11.1 Extend Project Model

Add fields:

```
superintendentName    String?
superintendentPhone   String?
superintendentEmail   String?
foremanName           String?
foremanPhone          String?
foremanEmail          String?
projectManagerName    String?
projectManagerPhone   String?
projectManagerEmail   String?
ownerRepName          String?
ownerRepPhone         String?
ownerRepEmail         String?
ownerRepAddress       String?
acresDisturbed        Float?     (rename from disturbedAcres for clarity)
soilType              String?
parcelNumbers         String?
projectDescription    String?
completionDate        DateTime?
```

### 11.2 New Models

**ProjectPermit:**

```
id              String   @id @default(uuid())
projectId       String
permitType      PermitType (enum: SAD, DUST_CONTROL, STORMWATER_NDOT, STORMWATER_NDEP, WATERWAY, OTHER)
permitNumber    String?
uploadedDocUrl  String?
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
```

**ProjectDocument:**

```
id          String   @id @default(uuid())
projectId   String
name        String
category    DocumentCategory (enum: PERMIT, CONTRACT, MAP, PLAN, OTHER)
fileUrl     String
fileSize    Int
mimeType    String
uploadedBy  String
createdAt   DateTime @default(now())
```

**ProjectUser:**

```
id          String   @id @default(uuid())
projectId   String
userId      String
role        ProjectRole (enum: ADMIN, MEMBER)
assignedAt  DateTime @default(now())
@@unique([projectId, userId])
```

**ProjectFormRequirement:**

```
id          String   @id @default(uuid())
projectId   String
formType    FormType (enum: DUST_LOG, NDEP_STORMWATER, NDOT_STORMWATER, NDEP_SAD, NNPH_DUST_PERMIT)
isRequired  Boolean  @default(true)
addedBy     String   (AUTO_PERMIT or MANUAL)
createdAt   DateTime @default(now())
```

### 11.3 New Enums

```
PermitType: SAD, DUST_CONTROL, STORMWATER_NDOT, STORMWATER_NDEP, WATERWAY, OTHER
DocumentCategory: PERMIT, CONTRACT, MAP, PLAN, OTHER
ProjectRole: ADMIN, MEMBER
FormType: DUST_LOG, NDEP_STORMWATER, NDOT_STORMWATER, NDEP_SAD, NNPH_DUST_PERMIT
```

### 11.4 Keep Existing

FormSubmission (adapt: store typed JSONB per form), Photo, QRToken, UserPreferences, SupportRequest

### 11.5 Remove from Seed

All 18 generic templates in `packages/database/templates/`. The 5 real forms are dedicated React components, not JSON templates.

---

## 12. Technical Architecture for Forms

### 12.1 Component Structure

```
apps/web/components/forms/
  daily-dust-log/
    DailyDustLog.tsx          # Editable form (React Hook Form + Zod)
    DailyDustLogView.tsx      # Read-only view (inspector/completed)
    dust-log.types.ts         # TypeScript interfaces
    dust-log.validation.ts    # Zod schema
  ndep-stormwater/
    NdepStormwater.tsx
    NdepStormwaterView.tsx
    ndep-stormwater.types.ts
    ndep-stormwater.validation.ts
  ndot-stormwater/
    NdotStormwater.tsx
    NdotStormwaterView.tsx
    ndot-stormwater.types.ts
    ndot-stormwater.validation.ts
  ndot-stormwater/PhotoAttachment.tsx  # Photo upload for deficiencies
  ndep-sad-application/
    NdepSadApplication.tsx
    NdepSadApplicationView.tsx
    ndep-sad.types.ts
    ndep-sad.validation.ts
  nnph-dust-permit/
    NnphDustPermit.tsx
    NnphDustPermitView.tsx
    nnph-dust.types.ts
    nnph-dust.validation.ts
```

### 12.2 Data Storage

All form submissions stored as typed JSONB in `FormSubmission` table:

- `formType` enum identifies which form (DUST_LOG, NDEP_STORMWATER, etc.)
- `projectId` links to project
- `data` field holds typed JSON matching Zod schema
- `status`: DRAFT, SUBMITTED, REVIEWED
- Validation enforced client-side (Zod) and server-side

### 12.3 Auto-fill Implementation

```
Project data -> Form component props -> Default values in React Hook Form
```

Each form component receives `project` prop and maps fields:

- Dust Log: project.name -> Project Name, project.permitNumber -> Permit #
- NDEP Stormwater: project.name -> Project Site Name, etc.
- NDOT Stormwater: project.address -> Project Location, etc.
- NDEP SAD: project contacts -> Responsible Official / Site Manager
- NNPH Dust: project.name, acres, dates, soil, parcel numbers

---

## 13. Project Detail Page Restructure

### Target Layout

```
Project: [Name] - [Address]
[Status Badge] [QR Code Button] [Edit Project]

Tabs:
  [Permits] [Documents] [Dust Log] [NDEP Stormwater] [NDOT Stormwater] [Team]
```

**Permits Tab:** List of permits (from ProjectPermit), upload permit docs, permit # displayed
**Documents Tab:** Upload project docs (contracts, maps, plans), categorize, view/download
**Form Tabs (one per required form type):** Log history by date, "New Entry" button, "Use Previous" button, click to view completed (read-only)
**Team Tab:** Simplified existing team view

Only show form tabs for forms that are required on this project (via ProjectFormRequirement).

---

## 14. Verification Criteria

### End-to-End Workflow Test (matches Andy's flow chart)

1. Admin creates project with all fields + selects permits (SAD + Dust Control)
2. Permits auto-trigger Dust Log as required form
3. Admin manually adds NDEP Stormwater as additional required form
4. Admin uploads permit PDF document to project
5. Admin assigns User to project
6. User logs in -> sees ONLY assigned project on dashboard
7. User opens project -> sees Permits tab, Documents tab, Dust Log tab, NDEP Stormwater tab
8. User opens Dust Log -> "New Entry" -> project data auto-fills header
9. User fills entry, submits -> form appears in log history as "completed"
10. Next day, user starts new Dust Log -> "Use Previous" pre-fills from yesterday
11. User views completed forms (read-only, "full document" layout)
12. Admin generates QR code for project
13. Inspector scans QR (no login) -> sees completed forms + permits + documents (read-only)
14. Submitted form is printable/exportable as PDF-like document

### Form-Specific Verification

- **Daily Dust Log:** Multiple entries per day, table layout matches AQMD PDF
- **NDEP Stormwater:** 3 sections render correctly, snowmelt trigger present, 0.25" threshold, 16 control measures
- **NDOT Stormwater:** Report No. field, all 11 BMP sub-sections, dual signature (Inspector + WPCM), photo attachments
- **NDEP SAD:** Township/Range/Section grid, UTM coordinates, County/Nearest City/Driving Directions, 16 BMP checkboxes
- **NNPH Dust Permit:** 7 project type options (Commercial/Road Rehab/Municipal/Single Family/Utilities/New Road/Residential), 7 dust control methods, after-hours contacts (#1 + #2), conditional fields (crushing equipment -> Stationary Source Permit #, soil analysis Y/N), "all fields required even if same as applicant"

---

## 15. Key Files Reference

### Source of Truth (Dev Notes)

| File                                               | Content                                   |
| -------------------------------------------------- | ----------------------------------------- |
| Dev Notes/Daily Dust Logs.pdf                      | Dust log layout                           |
| Dev Notes/NDEP Weekly Stormwater Log.pdf           | NDEP stormwater layout (3 pages)          |
| Dev Notes/NDOT Weekly Stormwater Logs.pdf          | NDOT stormwater layout (3 pages)          |
| Dev Notes/NDEP SAD Application.docx                | SAD permit layout                         |
| Dev Notes/NNPH Dust-Control-Permit-Application.pdf | Dust permit layout (3 pages)              |
| Dev Notes/Project Setup.docx                       | Project setup fields                      |
| Dev Notes/New Text Document.txt                    | Andy's notes on permits + form priorities |
| Dev Notes/02-16_Meeting...transcript.txt           | Andy's workflow walkthrough               |
| Dev Notes/BrAve Flow20260129.pdf                   | Flow chart                                |

### Codebase (to modify)

| File                                          | Change                         |
| --------------------------------------------- | ------------------------------ |
| packages/database/schema.prisma               | Extend Project, add new models |
| apps/backend/src/modules/auth/                | Simplify guards                |
| apps/backend/src/modules/projects/            | Extend for contacts, permits   |
| apps/backend/src/modules/forms/               | Adapt for 5 dedicated forms    |
| apps/web/app/dashboard/projects/new/page.tsx  | Full project setup UI          |
| apps/web/app/dashboard/projects/[id]/page.tsx | Restructure tabs               |
| apps/web/components/layout/AppNavbar.tsx      | Role-based nav                 |
| apps/web/app/inspector/[token]/page.tsx       | Restructure portal             |

---

_End of Planning Document_

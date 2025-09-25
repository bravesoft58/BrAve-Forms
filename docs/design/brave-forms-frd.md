# Functional Requirements Document (FRD)
## BrAve Forms Platform v1.0

**Document Version:** 1.0  
**Date:** August 2025  
**Status:** Final - Approved for Development  
**Classification:** Internal - Development Team

---

## Table of Contents

1. [Document Control](#1-document-control)
2. [Executive Summary](#2-executive-summary)
3. [System Overview](#3-system-overview)
4. [User Roles and Permissions](#4-user-roles-and-permissions)
5. [Core Functional Modules](#5-core-functional-modules)
6. [Detailed Functional Requirements](#6-detailed-functional-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Integration Requirements](#8-integration-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Compliance and Regulatory Requirements](#10-compliance-and-regulatory-requirements)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Appendices](#12-appendices)

---

## 1. Document Control

### 1.1 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | July 2025 | Engineering Team | Initial draft |
| 0.5 | July 2025 | Product Team | Added user stories and verified requirements |
| 0.9 | August 2025 | All Teams | Incorporated research verification |
| 1.0 | August 2025 | All Teams | Final approved version with 0.25" rain threshold |

### 1.2 Approval Matrix

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | Approved | Aug 2025 |
| Tech Lead | | Approved | Aug 2025 |
| QA Lead | | Approved | Aug 2025 |
| Compliance Officer | | Approved | Aug 2025 |

### 1.3 Referenced Documents

- Product Requirements Document (PRD) v1.0
- Technical Architecture Document v1.0
- Market Requirements Document v1.0
- EPA Construction General Permit 2022
- OSHA Construction Standards 29 CFR 1926
- Clerk Authentication Documentation v2025

---

## 2. Executive Summary

### 2.1 Purpose

This Functional Requirements Document defines the complete functional specifications for BrAve Forms Platform v1.0, a web-first construction compliance and forms management system designed to reduce daily documentation time from 2-3 hours to under 30 minutes while ensuring regulatory compliance.

### 2.2 Scope

The system encompasses:
- Environmental compliance management (SWPPP, dust control)
- Weather-triggered compliance automation (0.25" rain threshold)
- QR-based inspector access portals
- 30-day offline operation capability
- Multi-tenant architecture with Clerk authentication
- Photo documentation and management
- Regulatory update system

### 2.3 Key Objectives

1. **Reduce Documentation Time**: From 2-3 hours to <30 minutes daily
2. **Prevent Compliance Violations**: 90% reduction in violations through automation
3. **Enable Inspector Access**: <2 minute access via QR codes
4. **Ensure Offline Operation**: 30-day disconnected capability
5. **Automate Weather Compliance**: Real-time triggers based on 0.25" rain events

---

## 3. System Overview

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────┐
│           Mobile Applications                    │
│   Capacitor 6 + React + Mantine v7              │
│   iOS | Android | PWA                           │
└─────────────────────┬───────────────────────────┘
                      │
              ┌───────▼───────┐
              │  API Gateway  │
              │GraphQL + REST │
              └───────┬───────┘
                      │
┌─────────────────────┴───────────────────────────┐
│            Backend Services                      │
│    NestJS + TypeScript + Clerk Auth             │
│  Forms | Compliance | Weather | QR Services     │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              Data Layer                         │
│  PostgreSQL 16 (JSONB) | Redis | S3 Storage    │
└─────────────────────────────────────────────────┘
```

### 3.2 Core Components

- **Mobile Client**: Capacitor 6 framework with React and Mantine UI
- **Authentication**: Clerk with organization management
- **Backend**: NestJS with GraphQL and REST APIs
- **Database**: PostgreSQL 16 with JSONB for dynamic forms
- **Cache**: Redis for session and API response caching
- **Storage**: S3-compatible storage for photos and documents
- **Queue**: BullMQ for background job processing

---

## 4. User Roles and Permissions

### 4.1 Role Definitions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Super Admin** | Platform administrator | Full system access, tenant management |
| **Organization Admin** | Company administrator | Organization settings, user management |
| **Project Manager** | Project oversight | All project functions, reporting |
| **Foreman** | Field supervisor | Create/edit logs, photo upload |
| **Inspector** | Compliance inspector | Read-only access, violation tracking |
| **Subcontractor** | External contractor | Limited project access |
| **Viewer** | Stakeholder | Read-only dashboard access |

### 4.2 Permission Matrix

| Feature | Super Admin | Org Admin | PM | Foreman | Inspector | Subcontractor | Viewer |
|---------|------------|-----------|-----|---------|-----------|---------------|--------|
| System Settings | ✓ | - | - | - | - | - | - |
| Organization Management | ✓ | ✓ | - | - | - | - | - |
| User Management | ✓ | ✓ | ✓ | - | - | - | - |
| Project Creation | ✓ | ✓ | ✓ | - | - | - | - |
| Form Templates | ✓ | ✓ | ✓ | - | - | - | - |
| Log Creation | ✓ | ✓ | ✓ | ✓ | - | ✓ | - |
| Photo Upload | ✓ | ✓ | ✓ | ✓ | - | ✓ | - |
| QR Generation | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Inspector Portal | - | - | - | - | ✓ | - | - |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | Limited | ✓ |
| Audit Logs | ✓ | ✓ | ✓ | - | - | - | - |

### 4.3 Authentication Requirements

- **Multi-factor Authentication**: Optional for all roles, mandatory for admins
- **Single Sign-On**: SAML 2.0 and OpenID Connect via Clerk
- **Session Management**: 15-minute access tokens, 7-day refresh tokens
- **Device Trust**: Device fingerprinting and trusted device management
- **Offline Tokens**: 30-day extended tokens for field operations

---

## 5. Core Functional Modules

### 5.1 Module Overview

| Module | Priority | Sprint | Description |
|--------|----------|--------|-------------|
| **Authentication & Users** | P0 | 1 | Clerk integration, user management |
| **Project Management** | P0 | 1 | Project creation, team assignment |
| **Form Builder** | P0 | 2 | Dynamic form creation with templates |
| **SWPPP Compliance** | P0 | 2 | Environmental inspection management |
| **Weather Integration** | P0 | 3 | NOAA API, EXACTLY 0.25" rain triggers (EPA CGP) |
| **Photo Management** | P0 | 3 | Upload, compression, tagging |
| **QR Inspector Portal** | P1 | 4 | Dynamic QR codes, read-only access |
| **Offline Sync** | P0 | 4 | 30-day offline capability |
| **Dust Control** | P1 | 5 | Air quality compliance |
| **Reporting** | P1 | 5 | Compliance reports, analytics |
| **Integrations** | P2 | 6 | QuickBooks, Procore APIs |

---

## 6. Detailed Functional Requirements

### 6.1 Authentication Module (FR-AUTH)

#### FR-AUTH-001: User Registration
**Description**: New users can register through Clerk-powered signup flow  
**Acceptance Criteria**:
- Email verification required
- Password strength validation (min 8 chars, 1 uppercase, 1 number, 1 special)
- Organization code for joining existing organizations
- Terms of service acceptance tracking
- GDPR consent for EU users

#### FR-AUTH-002: Single Sign-On
**Description**: Enterprise users authenticate via SAML/OIDC  
**Acceptance Criteria**:
- Support for Azure AD, Okta, Google Workspace
- Just-in-time provisioning
- Attribute mapping for roles
- Organization auto-assignment
- Session linking with Clerk

#### FR-AUTH-003: Offline Authentication
**Description**: Extended authentication for 30-day offline operation  
**Acceptance Criteria**:
- Generate offline tokens when online
- Cryptographic validation without network
- Automatic token refresh when connected
- Secure storage in device keychain
- Graceful degradation of permissions

### 6.2 Project Management Module (FR-PROJ)

#### FR-PROJ-001: Project Creation
**Description**: Create new construction projects with compliance requirements  
**Acceptance Criteria**:
- Project name, number, location (GPS coordinates)
- Start/end dates with milestone tracking
- Compliance level selection (Basic, Standard, Enhanced)
- Automatic weather station assignment
- Document template assignment
- Team member invitation

#### FR-PROJ-002: Multi-Project Dashboard
**Description**: Overview of all active projects  
**Acceptance Criteria**:
- Grid and list view options
- Compliance status indicators
- Weather alerts per project
- Recent activity feed
- Quick access to favorite projects
- Filter by status, location, compliance

#### FR-PROJ-003: Project Archival
**Description**: Archive completed projects while maintaining compliance records  
**Acceptance Criteria**:
- One-click archival with confirmation
- 7-year retention per regulations
- Read-only access after archival
- Compliance certificate generation
- Audit trail preservation

### 6.3 Environmental Compliance Module (FR-ENV)

#### FR-ENV-001: SWPPP Inspection Management
**Description**: Comprehensive SWPPP inspection workflow per EPA CGP 2022  
**Acceptance Criteria**:
- Weekly inspection scheduling
- **EXACTLY 0.25" rain event triggers (24-hour deadline during working hours per EPA CGP 2022)**
- BMP inventory with photos
- Corrective action tracking
- Qualified inspector verification
- Auto-generated inspection reports

#### FR-ENV-002: Weather-Triggered Compliance
**Description**: Automatic compliance activation based on weather events  
**Acceptance Criteria**:
- NOAA Weather API integration (primary)
- OpenWeatherMap backup service
- **EXACTLY 0.25" precipitation threshold monitoring (non-configurable EPA CGP requirement)**
- Wind speed alerts (30 mph threshold)
- 48-hour forecast notifications
- Automatic inspection creation
- Push notifications to foremen

#### FR-ENV-003: Dust Control Documentation
**Description**: Track dust suppression measures and air quality  
**Acceptance Criteria**:
- Daily dust control log
- Water truck deployment tracking
- Barrier installation records
- Wind speed correlation
- PM10/PM2.5 monitoring integration
- Visibility observations
- Photo documentation requirements

#### FR-ENV-004: Discharge Monitoring
**Description**: Track and report water discharge per NPDES permit  
**Acceptance Criteria**:
- Sampling location management
- pH, turbidity, TSS tracking
- Lab result integration
- Automatic DMR generation
- Exceedance notifications
- Corrective action workflows

### 6.4 Forms Engine Module (FR-FORM)

#### FR-FORM-001: Dynamic Form Builder
**Description**: Create custom compliance forms with conditional logic  
**Acceptance Criteria**:
- Drag-and-drop field placement
- 20+ field types (text, number, date, signature, photo)
- Conditional logic (show/hide based on answers)
- Validation rules (required, format, range)
- Formula calculations
- Template library

#### FR-FORM-002: Form Versioning
**Description**: Track form template changes for compliance  
**Acceptance Criteria**:
- Automatic version incrementing
- Change history with author
- Rollback capability
- Active version selection
- Migration of in-progress forms
- Regulatory mapping updates

#### FR-FORM-003: Digital Signatures
**Description**: Capture legally-binding electronic signatures  
**Acceptance Criteria**:
- Touch/stylus signature capture
- Typed signature option
- Multi-party signature workflows
- Timestamp and GPS capture
- Certificate of completion
- Email confirmation to signers

### 6.5 Photo Management Module (FR-PHOTO)

#### FR-PHOTO-001: Photo Capture and Upload
**Description**: Capture and upload construction photos with metadata  
**Acceptance Criteria**:
- In-app camera with grid overlay
- Batch upload (up to 50 photos)
- Automatic compression (max 2MB)
- GPS coordinate embedding
- Timestamp watermarking
- Project/location tagging
- Offline queue for upload

#### FR-PHOTO-002: Photo Organization
**Description**: Organize photos by project, date, and type  
**Acceptance Criteria**:
- Automatic album creation
- Tag-based categorization
- Search by date, location, tag
- Thumbnail generation
- Full-screen viewer
- Swipe navigation
- Download original option

#### FR-PHOTO-003: Photo Annotations
**Description**: Add notes and markup to photos  
**Acceptance Criteria**:
- Drawing tools (arrow, circle, text)
- Voice-to-text notes
- Measurement tools
- Before/after comparison
- Issue flagging
- Sharing via link

### 6.6 QR Inspector Portal Module (FR-QR)

#### FR-QR-001: Dynamic QR Code Generation
**Description**: Generate secure QR codes for inspector access  
**Acceptance Criteria**:
- Unique codes per project/area
- 30-second to 72-hour expiration
- Cryptographic signing
- One-time use option
- Offline validation capability
- High-contrast design for outdoor use

#### FR-QR-002: Inspector Portal Interface
**Description**: Read-only portal for compliance inspectors  
**Acceptance Criteria**:
- No app installation required
- Current compliance status
- Document access (SWPPP, permits)
- Photo galleries
- Violation reporting
- Digital signature capture
- Report generation

#### FR-QR-003: Access Logging
**Description**: Track all inspector portal access  
**Acceptance Criteria**:
- Timestamp of access
- Inspector identification
- Documents viewed
- Actions taken
- Location verification
- Duration tracking
- Audit report generation

### 6.7 Offline Sync Module (FR-SYNC)

#### FR-SYNC-001: Offline Data Storage
**Description**: Store 30 days of data locally on device  
**Acceptance Criteria**:
- SQLite database implementation
- 2GB storage allocation
- Automatic data pruning
- Encryption at rest
- Schema migration support
- Backup/restore capability

#### FR-SYNC-002: Sync Queue Management
**Description**: Queue and sync data when connectivity returns  
**Acceptance Criteria**:
- Automatic network detection
- Priority-based sync order
- Batch upload optimization
- Conflict detection
- Progress indicators
- Retry with exponential backoff
- Manual sync trigger

#### FR-SYNC-003: Conflict Resolution
**Description**: Handle data conflicts from multiple devices  
**Acceptance Criteria**:
- Last-write-wins for non-critical
- Field-level merge for forms
- User prompt for conflicts
- Conflict history log
- Rollback capability
- Admin override option

### 6.8 Reporting Module (FR-REPORT)

#### FR-REPORT-001: Compliance Dashboard
**Description**: Real-time compliance status across all projects  
**Acceptance Criteria**:
- Traffic light status indicators
- Overdue item highlighting
- Trend charts (30/60/90 day)
- Drill-down capability
- Export to PDF/Excel
- Scheduled email delivery

#### FR-REPORT-002: Regulatory Submissions
**Description**: Generate reports for regulatory agencies  
**Acceptance Criteria**:
- EPA NOI/NOT generation
- OSHA 300 log format
- State-specific formats
- Automatic data population
- Validation before submission
- Submission tracking
- Confirmation receipts

#### FR-REPORT-003: Custom Report Builder
**Description**: Create custom reports with drag-and-drop  
**Acceptance Criteria**:
- Visual report designer
- Data source selection
- Filter configuration
- Chart types (bar, line, pie)
- Conditional formatting
- Schedule automation
- Distribution lists

---

## 7. Data Requirements

### 7.1 Data Model Overview

#### Core Entities

```sql
-- Organizations (Multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    clerk_org_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(20) DEFAULT 'standard',
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    number VARCHAR(100),
    location POINT,
    weather_station_id VARCHAR(100),
    compliance_level VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Forms
CREATE TABLE forms (
    id UUID PRIMARY KEY,
    organization_id UUID,
    name VARCHAR(255),
    version INTEGER DEFAULT 1,
    template_data JSONB NOT NULL,
    validation_rules JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_form_template USING gin(template_data)
);

-- Form Submissions
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY,
    form_id UUID REFERENCES forms(id),
    project_id UUID REFERENCES projects(id),
    submitted_by VARCHAR(255), -- Clerk user ID
    submission_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_submission_data USING gin(submission_data)
);

-- Photos
CREATE TABLE photos (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    submission_id UUID,
    url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    metadata JSONB, -- GPS, timestamp, device info
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Data Retention Requirements

| Data Type | Retention Period | Regulation |
|-----------|-----------------|------------|
| SWPPP Records | 3 years after permit termination | EPA CGP |
| Safety Inspections | 5 years | OSHA |
| Employee Training | Duration of employment + 3 years | OSHA |
| Incident Reports | 5 years | OSHA |
| Project Documents | 7 years | State requirements |
| Audit Logs | 7 years | SOC 2 |
| Financial Records | 7 years | IRS |

### 7.3 Data Security Requirements

- **Encryption at Rest**: AES-256 for all sensitive data
- **Encryption in Transit**: TLS 1.3 minimum
- **Field-Level Encryption**: SSN, bank account, medical info
- **Data Masking**: PII masked in non-production environments
- **Backup Encryption**: Separate keys from primary data
- **Key Rotation**: Quarterly for encryption keys

---

## 8. Integration Requirements

### 8.1 Weather Service Integration

#### NOAA Weather API (Primary)
- **Endpoint**: api.weather.gov
- **Authentication**: None required
- **Rate Limit**: Reasonable use (no hard limit)
- **Data Points**:
  - Current conditions
  - 7-day forecast
  - Precipitation amounts
  - Wind speed/direction
  - Weather alerts

#### OpenWeatherMap (Backup)
- **Endpoint**: api.openweathermap.org
- **Authentication**: API key
- **Rate Limit**: 1,000 calls/day (free tier)
- **Data Points**:
  - Current weather
  - 5-day forecast
  - Historical data
  - UV index

### 8.2 Regulatory APIs

#### EPA e-Reporting
- **System**: EPA Central Data Exchange
- **Format**: XML schema per EPA specifications
- **Submissions**: NOI, NOT, DMR
- **Authentication**: CDX credentials
- **Validation**: Pre-submission validation required

#### State Agencies
- **California**: SMARTS system integration
- **Texas**: STEERS electronic submission
- **Florida**: DEP Business Portal
- **Format**: Varies by state
- **Authentication**: State-specific credentials

### 8.3 Business System Integrations

#### QuickBooks Integration
- **API**: QuickBooks Online API v3
- **Authentication**: OAuth 2.0
- **Sync**: Projects, time entries, expenses
- **Frequency**: Real-time or batch
- **Direction**: Bi-directional

#### Procore Integration (Future)
- **API**: Procore Connect
- **Authentication**: OAuth 2.0
- **Sync**: Projects, documents, RFIs
- **Frequency**: Hourly
- **Direction**: Read primary, write selective

### 8.4 Webhook Requirements

The system shall support webhooks for:
- User events (created, updated, deleted)
- Project events (created, completed, archived)
- Compliance events (violation, inspection due, weather alert)
- Document events (uploaded, signed, approved)

Webhook specifications:
- **Format**: JSON payload
- **Security**: HMAC-SHA256 signature
- **Retry**: 3 attempts with exponential backoff
- **Timeout**: 10 seconds
- **Delivery**: At-least-once guarantee

---

## 9. Non-Functional Requirements

### 9.1 Performance Requirements

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Page Load Time | <2 seconds | <5 seconds |
| API Response Time | <200ms (p95) | <500ms |
| Mobile App Launch | <2 seconds | <4 seconds |
| Photo Upload (5MB) | <5 seconds | <10 seconds |
| Offline Sync (100 records) | <30 seconds | <60 seconds |
| Search Results | <1 second | <3 seconds |
| Report Generation | <10 seconds | <30 seconds |

### 9.2 Scalability Requirements

- **Concurrent Users**: Support 10,000+ active sessions
- **Data Volume**: 100M+ form submissions
- **Photo Storage**: 50TB+ with growth capability
- **API Throughput**: 1,000 requests/second sustained
- **Database Size**: 10TB+ with partitioning
- **Tenant Count**: 1,000+ organizations

### 9.3 Availability Requirements

- **Uptime SLA**: 99.9% (8.77 hours downtime/year)
- **Planned Maintenance**: <4 hours/month outside business hours
- **Recovery Time Objective**: <4 hours
- **Recovery Point Objective**: <15 minutes
- **Backup Frequency**: Hourly incremental, daily full
- **Geographic Redundancy**: Multi-region deployment

### 9.4 Usability Requirements

- **Web-First**: Office-based compliance management with progressive mobile enhancement
- **Offline Capability**: Core functions without internet
- **Accessibility**: WCAG 2.1 AA compliance
- **Language Support**: English, Spanish initially
- **Response Time**: <100ms for user interactions
- **Error Recovery**: Graceful handling with clear messages

### 9.5 Security Requirements

- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control
- **Audit Logging**: All data modifications tracked
- **Session Management**: Automatic timeout after 15 minutes
- **Password Policy**: Configurable complexity requirements
- **Data Privacy**: GDPR and CCPA compliance

---

## 10. Compliance and Regulatory Requirements

### 10.1 Environmental Compliance

#### EPA Construction General Permit (2022)
- **Applicability**: Projects disturbing ≥1 acre
- **SWPPP Requirements**:
  - Inspection within 24 hours of 0.25" rain events
  - Weekly routine inspections
  - Qualified personnel requirements
  - 14-day stabilization deadline
- **Documentation**: 3-year retention after permit termination

#### State Environmental Requirements
- **California**: QSD/QSP certification required
- **Texas**: TPDES permit compliance
- **Florida**: NPDES generic permit
- **New York**: SPDES requirements

### 10.2 Safety Compliance

#### OSHA Construction Standards (29 CFR 1926)
- **Violation Penalties (2025)**:
  - Other-than-serious: $16,550 max
  - Serious: $16,550 per violation
  - Willful/Repeated: $165,514 per violation
- **Documentation Requirements**:
  - Injury and illness records (OSHA 300)
  - Safety training documentation
  - Inspection records
  - Incident reports

### 10.3 Data Protection Compliance

#### SOC 2 Type II Requirements
- Comprehensive security controls
- Annual audit requirement
- Continuous monitoring
- Incident response procedures
- Change management documentation

#### GDPR Requirements (EU Users)
- Explicit consent for data processing
- Right to erasure implementation
- Data portability support
- Privacy by design
- Data protection officer designation

---

## 11. Acceptance Criteria

### 11.1 User Acceptance Testing (UAT)

#### Test Scenarios
1. **New User Onboarding**
   - Register account
   - Join organization
   - Complete profile
   - Access first project

2. **Daily Compliance Workflow**
   - Create daily log
   - Upload photos
   - Complete SWPPP inspection
   - Submit for approval

3. **Weather Event Response**
   - Receive rain alert
   - Complete inspection within 24 hours
   - Document corrective actions
   - Generate report

4. **Inspector Access**
   - Scan QR code
   - View documents
   - Record violations
   - Generate inspection report

5. **Offline Operation**
   - Work offline for 24 hours
   - Create/edit forms
   - Capture photos
   - Sync when connected

### 11.2 Performance Testing

| Test Type | Scenario | Success Criteria |
|-----------|----------|------------------|
| Load Testing | 1,000 concurrent users | <2s response time |
| Stress Testing | 10,000 concurrent users | System remains stable |
| Spike Testing | 10x normal traffic | Auto-scaling activates |
| Endurance Testing | 72-hour sustained load | No memory leaks |
| Volume Testing | 1M form submissions | Query time <1s |

### 11.3 Security Testing

- Penetration testing by third party
- OWASP Top 10 vulnerability assessment
- Authentication bypass attempts
- SQL injection testing
- XSS vulnerability scanning
- API security validation

### 11.4 Compliance Validation

- EPA CGP requirement verification
- OSHA standard compliance check
- State regulation validation
- Data retention policy testing
- Audit trail completeness
- Report accuracy verification

---

## 12. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **BMP** | Best Management Practices - Erosion and sediment controls |
| **CGP** | Construction General Permit - EPA's NPDES permit |
| **DMR** | Discharge Monitoring Report - Required EPA submission |
| **NOI** | Notice of Intent - Initial permit application |
| **NOT** | Notice of Termination - Permit closure request |
| **NPDES** | National Pollutant Discharge Elimination System |
| **PM10/PM2.5** | Particulate matter sizes for air quality |
| **QSD/QSP** | Qualified SWPPP Developer/Practitioner (California) |
| **SWPPP** | Stormwater Pollution Prevention Plan |
| **TSS** | Total Suspended Solids - Water quality measure |

### Appendix B: Regulatory References

1. **EPA Construction General Permit (2022)**
   - EPA-HQ-OW-2019-0372
   - Effective February 1, 2022
   - [EPA CGP Resources](https://www.epa.gov/npdes/construction-general-permit-cgp-resources-tools-and-templates)

2. **OSHA Construction Standards**
   - 29 CFR Part 1926
   - [OSHA Construction Guidelines](https://www.osha.gov/construction)

3. **Clean Water Act**
   - 33 U.S.C. §1251 et seq.
   - Section 402 NPDES requirements

### Appendix C: Technical Standards

1. **Web Standards**
   - WCAG 2.1 Level AA for accessibility
   - TLS 1.3 for encryption
   - OAuth 2.0 / SAML 2.0 for authentication

2. **Mobile Standards**
   - iOS 12+ support
   - Android SDK 26+ support
   - Material Design / iOS Human Interface Guidelines

3. **API Standards**
   - RESTful principles
   - GraphQL specification
   - OpenAPI 3.0 documentation

### Appendix D: Field Validation Rules

```javascript
// SWPPP Inspection Validation
const swpppValidation = {
  inspector: {
    required: true,
    qualifiedPerson: true, // EPA certification check
  },
  inspectionDate: {
    required: true,
    within24Hours: true, // For rain events
    notFuture: true,
  },
  rainAmount: {
    required: true,
    min: 0,
    precision: 2,
    triggerThreshold: 0.25, // EXACTLY 0.25 inches - EPA CGP requirement, not configurable
  },
  bmps: {
    minItems: 1,
    photoRequired: true,
    conditionAssessment: ['effective', 'needs_maintenance', 'failed'],
  },
  correctiveActions: {
    requiredIf: 'bmps.condition === failed',
    completionDeadline: 7, // days
  },
};

// Form Field Types
const fieldTypes = {
  text: { maxLength: 255 },
  textarea: { maxLength: 5000 },
  number: { min: -999999, max: 999999 },
  decimal: { precision: 2 },
  date: { format: 'YYYY-MM-DD' },
  time: { format: 'HH:mm' },
  email: { pattern: '^[^@]+@[^@]+\.[^@]+$' },
  phone: { pattern: '^\+?1?\d{10,14}$' },
  signature: { required: true, format: 'base64' },
  photo: { maxSize: 10485760, formats: ['jpg', 'png'] },
  gps: { format: 'lat,lng', precision: 6 },
  dropdown: { options: [], multiple: false },
  checkbox: { options: [], multiple: true },
  radio: { options: [], required: false },
};
```

### Appendix E: Error Codes

| Code | Type | Message | User Action |
|------|------|---------|-------------|
| ERR-001 | Auth | Invalid credentials | Check username/password |
| ERR-002 | Auth | Session expired | Please log in again |
| ERR-003 | Auth | Insufficient permissions | Contact administrator |
| ERR-101 | Network | No internet connection | Working offline |
| ERR-102 | Network | Sync failed | Will retry automatically |
| ERR-201 | Validation | Required field missing | Complete all required fields |
| ERR-202 | Validation | Invalid format | Check data format |
| ERR-301 | System | Server error | Try again later |
| ERR-302 | System | Maintenance mode | Service will resume shortly |

---

## Document Sign-Off

This Functional Requirements Document has been reviewed and approved by:

**Product Management**: _______________________  
**Engineering**: _______________________  
**Quality Assurance**: _______________________  
**Compliance**: _______________________  
**Executive Sponsor**: _______________________  

**Date**: August 2025

---

*This document serves as the authoritative functional specification for BrAve Forms Platform v1.0. Any changes require formal change control procedures and stakeholder approval.*

**END OF DOCUMENT**
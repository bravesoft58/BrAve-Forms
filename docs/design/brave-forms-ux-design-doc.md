# UI/UX Design Document
## BrAve Forms Platform v1.0

**Document Version:** 1.0  
**Date:** August 2025  
**Status:** Final - Approved for Development  
**Classification:** Design System - Primary Reference

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Principles](#2-design-principles)
3. [User Personas and Journey Maps](#3-user-personas-and-journey-maps)
4. [Information Architecture](#4-information-architecture)
5. [Visual Design System](#5-visual-design-system)
6. [Component Library Specifications](#6-component-library-specifications)
7. [Web-First Design Patterns](#7-web-first-design-patterns)
8. [Offline Experience Design](#8-offline-experience-design)
9. [Accessibility Requirements](#9-accessibility-requirements)
10. [Interaction Patterns](#10-interaction-patterns)
11. [Responsive Design Guidelines](#11-responsive-design-guidelines)
12. [Navigation Architecture](#12-navigation-architecture)
13. [Form Design Patterns](#13-form-design-patterns)
14. [Error Handling and Validation](#14-error-handling-and-validation)
15. [Performance Optimization](#15-performance-optimization)
16. [Implementation Specifications](#16-implementation-specifications)

---

## 1. Executive Summary

### 1.1 Purpose

This UI/UX Design Document defines the comprehensive design system and user experience architecture for the BrAve Forms Platform v1.0, a web-first construction compliance application designed to reduce daily documentation time from 2-3 hours to under 30 minutes while maintaining regulatory compliance.

### 1.2 Design Philosophy

The design system prioritizes field usability over aesthetic complexity, focusing on:
- **One-thumb operation** for workers holding equipment
- **Glove-friendly touch targets** (minimum 48x48dp)
- **High contrast for outdoor visibility** (minimum 7:1 ratio)
- **Offline-first architecture** with clear sync status
- **Progressive disclosure** to reduce cognitive load
- **WCAG 2.1 AA compliance** for accessibility

### 1.3 Technology Stack

- **Framework**: Capacitor 6 + React 18.2
- **Component Library**: Mantine v7
- **State Management**: TanStack Query v5 + Valtio
- **Form Handling**: React Hook Form + Zod
- **Styling**: CSS Modules + Tailwind utilities
- **Icons**: Lucide React (consistent 24px grid)

---

## 2. Design Principles

### 2.1 Field-First Design

**Principle**: Every interface element must be usable by a worker wearing gloves in bright sunlight while holding equipment with one hand.

**Application**:
- Touch targets minimum 48x48dp (Android) / 44x44pt (iOS)
- Spacing between interactive elements: minimum 8dp
- Critical actions accessible within thumb reach zone
- High contrast ratios exceeding WCAG AAA (7:1)

### 2.2 Clarity Over Cleverness

**Principle**: Interface clarity takes precedence over visual sophistication.

**Application**:
- Explicit labels for all functions
- Standard UI patterns over custom innovations
- Clear visual hierarchy with obvious primary actions
- Consistent iconography with text labels

### 2.3 Forgiveness by Design

**Principle**: Users should be able to recover from mistakes without data loss.

**Application**:
- Undo functionality for destructive actions
- Auto-save every 30 seconds
- Confirmation dialogs for critical operations
- Clear error messages with recovery instructions

### 2.4 Progressive Disclosure

**Principle**: Show only necessary information at each step to reduce cognitive load.

**Application**:
- Collapsible sections for advanced options
- Step-by-step workflows for complex tasks
- Context-sensitive help text
- Conditional form fields based on previous answers

### 2.5 Offline Resilience

**Principle**: Full functionality must be available without network connectivity.

**Application**:
- Local-first data storage
- Clear offline/online status indicators
- Queued actions with visual feedback
- Automatic sync when connectivity returns

---

## 3. User Personas and Journey Maps

### 3.1 Primary Persona: Construction Foreman

**Journey Map: Daily SWPPP Inspection**

```
Morning Preparation (6:00 AM)
├── Open app on phone
├── Review weather alerts (automatic)
├── Check required inspections
└── Download updates if on WiFi

Field Inspection (7:00 AM - 9:00 AM)
├── Select project from favorites
├── Start SWPPP inspection
├── Walk site following GPS markers
├── Document each BMP:
│   ├── Take photo
│   ├── Mark condition
│   └── Note issues
├── Complete weather section
└── Add digital signature

Sync & Submit (9:00 AM)
├── Return to trailer/office
├── Auto-sync when WiFi detected
├── Review submission confirmation
└── Check next tasks
```

**Key UI Requirements**:
- Large, glove-friendly buttons
- Minimal text entry (voice-to-text preferred)
- Visual progress indicators
- Offline capability for entire workflow

### 3.2 Secondary Persona: Environmental Inspector

**Journey Map: Site Inspection Visit**

```
Arrival at Site (2:00 PM)
├── Scan QR code at entrance
├── Access inspector portal (no app needed)
└── View compliance dashboard

Inspection Process (2:15 PM - 3:30 PM)
├── Review recent submissions
├── Check weather history
├── Verify BMP locations on map
├── Document violations:
│   ├── Take photos
│   ├── Mark GPS location
│   └── Set correction deadline
└── Generate report

Report Distribution (3:30 PM)
├── Add digital signature
├── Email to contractor
├── Submit to agency system
└── Schedule follow-up
```

**Key UI Requirements**:
- Read-only access with clear permissions
- Professional report formatting
- Photo annotation tools
- Quick navigation between documents

---

## 4. Information Architecture

### 4.1 Primary Navigation Structure

```
Root
├── Dashboard (Home)
│   ├── Weather Alerts
│   ├── Pending Tasks
│   ├── Recent Activity
│   └── Quick Actions
├── Projects
│   ├── Active Projects
│   ├── Favorites
│   ├── Archived
│   └── Project Details
│       ├── Forms
│       ├── Photos
│       ├── Team
│       ├── Weather
│       └── Compliance
├── Forms
│   ├── Create New
│   ├── Templates
│   ├── Drafts
│   ├── Submitted
│   └── Form Builder
├── Inspections
│   ├── Required Today
│   ├── Overdue
│   ├── Scheduled
│   ├── History
│   └── QR Access
└── More
    ├── Settings
    ├── Profile
    ├── Sync Status
    ├── Help
    └── Logout
```

### 4.2 Content Hierarchy

**Level 1**: Critical daily tasks (inspections, weather alerts)  
**Level 2**: Project navigation and form creation  
**Level 3**: Historical data and reports  
**Level 4**: Settings and configuration  

### 4.3 Task Flow Optimization

Maximum 3 taps to any critical function:
- Dashboard → Project → Start Inspection
- Dashboard → Quick Action → Photo Upload
- Dashboard → Weather Alert → View Details

---

## 5. Visual Design System

### 5.1 Color Palette

#### Primary Colors
```css
--primary-blue: #0066CC;      /* Primary actions */
--primary-dark: #004499;      /* Active states */
--primary-light: #3399FF;     /* Hover states */
```

#### Status Colors
```css
--success-green: #28A745;     /* Completed, valid */
--warning-yellow: #FFC107;    /* Attention needed */
--danger-red: #DC3545;        /* Errors, violations */
--info-blue: #17A2B8;         /* Information */
```

#### Neutral Colors
```css
--neutral-900: #212529;       /* Primary text */
--neutral-700: #495057;       /* Secondary text */
--neutral-500: #6C757D;       /* Disabled text */
--neutral-300: #DEE2E6;       /* Borders */
--neutral-100: #F8F9FA;       /* Backgrounds */
--white: #FFFFFF;             /* Cards, inputs */
```

#### High Contrast Mode
```css
--hc-foreground: #000000;     /* WCAG AAA compliance */
--hc-background: #FFFFFF;     /* 21:1 contrast ratio */
--hc-accent: #0000FF;         /* Links and actions */
```

### 5.2 Typography

#### Font Stack
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                'Roboto', 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
```

#### Type Scale
```css
--text-xs: 0.75rem;     /* 12px - Captions */
--text-sm: 0.875rem;    /* 14px - Secondary text */
--text-base: 1rem;      /* 16px - Body text (minimum) */
--text-lg: 1.125rem;    /* 18px - Emphasized text */
--text-xl: 1.25rem;     /* 20px - Section headers */
--text-2xl: 1.5rem;     /* 24px - Page titles */
--text-3xl: 1.875rem;   /* 30px - Dashboard numbers */
```

#### Line Heights
```css
--leading-tight: 1.25;  /* Headers */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.75; /* Readable paragraphs */
```

### 5.3 Spacing System

8-point grid system for consistency:
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### 5.4 Elevation System

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

---

## 6. Component Library Specifications

### 6.1 Button Components

#### Primary Button
```css
.btn-primary {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 24px;
  background: var(--primary-blue);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  touch-action: manipulation;
}
```

#### Button Variants
- **Primary**: Main actions (Submit, Save)
- **Secondary**: Alternative actions (Cancel, Back)
- **Danger**: Destructive actions (Delete, Remove)
- **Success**: Positive actions (Approve, Complete)
- **Ghost**: Tertiary actions (More options)

#### Button States
- **Default**: Base appearance
- **Hover**: 10% darker background
- **Active**: 20% darker background
- **Disabled**: 50% opacity, no pointer events
- **Loading**: Spinner icon, disabled interaction

### 6.2 Form Controls

#### Text Input
```css
.input-field {
  min-height: 48px;
  padding: 12px 16px;
  border: 2px solid var(--neutral-300);
  border-radius: 8px;
  font-size: 16px; /* Prevents zoom on iOS */
}
```

#### Checkbox and Radio
```css
.checkbox-control,
.radio-control {
  min-width: 24px;
  min-height: 24px;
  margin: 12px; /* Touch target padding */
}
```

#### Select Dropdown
```css
.select-field {
  min-height: 48px;
  padding-right: 40px; /* Space for arrow */
  appearance: none;
  background-image: url('chevron-down.svg');
  background-position: right 12px center;
}
```

### 6.3 Card Components

```css
.card {
  background: white;
  border-radius: 12px;
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-4);
}

.card-header {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--space-3);
}

.card-body {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}
```

### 6.4 Navigation Components

#### Bottom Navigation (Mobile)
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 64px;
  background: white;
  border-top: 1px solid var(--neutral-300);
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.nav-item {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
```

---

## 7. Web-First Design Patterns

### 7.1 Touch Gesture Support

#### Supported Gestures
- **Tap**: Primary interaction
- **Long Press**: Context menu
- **Swipe Left/Right**: Delete, archive
- **Pull to Refresh**: Update data
- **Pinch to Zoom**: Photos only

#### Gesture Accessibility
All gestures must have alternative methods:
- Swipe to delete → Delete button
- Pinch to zoom → Zoom controls
- Long press → Three-dot menu

### 7.2 Thumb Zone Optimization

```
Safe Zone (Easy Reach):
┌─────────────────┐
│                 │
│    Neutral      │
│                 │
├─────────────────┤
│                 │
│    Natural     │
│   (Primary      │
│    Actions)     │
│                 │
├─────────────────┤
│    Easy         │
│   (Bottom       │
│    Nav)         │
└─────────────────┘
```

### 7.3 Orientation Handling

- Support both portrait and landscape
- Maintain scroll position on rotation
- Adjust layout breakpoints:
  - Portrait: Single column
  - Landscape: Two columns where appropriate
- Lock orientation during critical tasks (photo capture)

### 7.4 Screen Size Adaptations

```css
/* Small phones (320px - 375px) */
@media (max-width: 375px) {
  .container { padding: 12px; }
  .text-base { font-size: 14px; }
}

/* Standard phones (376px - 428px) */
@media (min-width: 376px) {
  .container { padding: 16px; }
  .text-base { font-size: 16px; }
}

/* Large phones (429px - 768px) */
@media (min-width: 429px) {
  .container { padding: 20px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Tablets (769px+) */
@media (min-width: 769px) {
  .container { max-width: 1024px; margin: 0 auto; }
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

## 8. Offline Experience Design

### 8.1 Offline Status Indicators

#### Visual Indicators
```css
.offline-banner {
  position: fixed;
  top: 0;
  width: 100%;
  background: var(--warning-yellow);
  color: var(--neutral-900);
  padding: 8px;
  text-align: center;
  z-index: 9999;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-icon {
  animation: rotate 2s linear infinite;
}
```

#### Status States
- **Online**: Green dot, no banner
- **Offline**: Yellow banner, cached icon
- **Syncing**: Blue spinner, progress percentage
- **Sync Error**: Red banner, retry button

### 8.2 Cached Content Design

```css
.cached-indicator {
  position: relative;
}

.cached-indicator::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: var(--info-blue);
  border-radius: 50%;
  title: 'Available offline';
}
```

### 8.3 Queue Management UI

```javascript
// Visual queue representation
const QueuedAction = ({ action, status }) => (
  <div className="queued-action">
    <Icon name={getIconForAction(action)} />
    <span>{action.description}</span>
    <StatusBadge status={status} />
    {status === 'failed' && (
      <Button size="sm" onClick={retry}>Retry</Button>
    )}
  </div>
);
```

### 8.4 Sync Conflict Resolution

```javascript
// Conflict resolution UI
const ConflictResolver = ({ local, remote }) => (
  <Modal title="Sync Conflict">
    <div className="conflict-comparison">
      <div className="local-version">
        <h3>Your Version</h3>
        <Timestamp>{local.modifiedAt}</Timestamp>
        <Preview data={local.data} />
        <Button onClick={() => resolve('local')}>Keep Mine</Button>
      </div>
      <div className="remote-version">
        <h3>Server Version</h3>
        <Timestamp>{remote.modifiedAt}</Timestamp>
        <Preview data={remote.data} />
        <Button onClick={() => resolve('remote')}>Keep Theirs</Button>
      </div>
    </div>
    <Button variant="primary" onClick={merge}>Merge Both</Button>
  </Modal>
);
```

---

## 9. Accessibility Requirements

### 9.1 WCAG 2.1 AA Compliance

#### Perceivable
- **Text Alternatives**: All images have alt text
- **Time-based Media**: Captions for videos
- **Adaptable**: Content works without CSS
- **Distinguishable**: 4.5:1 contrast minimum

#### Operable
- **Keyboard Accessible**: All functions via keyboard
- **Time Limits**: Adjustable or extendable
- **Seizures**: No flashing > 3Hz
- **Navigable**: Clear page titles and headings

#### Understandable
- **Readable**: Plain language, 8th grade level
- **Predictable**: Consistent navigation
- **Input Assistance**: Clear error messages

#### Robust
- **Compatible**: Works with screen readers
- **Valid HTML**: No parsing errors
- **ARIA Labels**: Proper semantic markup

### 9.2 Mobile-Specific Accessibility

#### Touch Targets
```css
.touch-target {
  min-width: 44px;  /* iOS minimum */
  min-height: 48px; /* Android minimum */
  padding: 8px;     /* Additional touch area */
}
```

#### Screen Reader Support
```html
<!-- Proper ARIA labels -->
<button aria-label="Take photo of BMP installation">
  <Icon name="camera" aria-hidden="true" />
  <span>Photo</span>
</button>

<!-- Live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true">
  <span>3 items synced successfully</span>
</div>
```

#### Voice Control Support
```html
<!-- Clear, unique labels for voice commands -->
<button id="submit-inspection">Submit Inspection</button>
<button id="save-draft">Save as Draft</button>
```

### 9.3 Field Accessibility

#### Glove-Friendly Design
- Minimum touch target: 48x48dp
- Spacing between targets: 8dp minimum
- Avoid multi-touch gestures
- Large, clear buttons

#### Outdoor Visibility
- High contrast mode: 7:1 minimum
- Dark mode option for night work
- Adjustable text size (up to 200%)
- Minimal transparency effects

#### One-Handed Operation
- Critical actions in thumb zone
- Swipe alternatives to reach
- Bottom sheet for actions
- Floating action button (FAB) positioning

---

## 10. Interaction Patterns

### 10.1 Loading States

#### Skeleton Screens
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-100) 25%,
    var(--neutral-300) 50%,
    var(--neutral-100) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Progress Indicators
- **Determinate**: For known duration (upload progress)
- **Indeterminate**: For unknown duration (API calls)
- **Stepped**: For multi-stage processes

### 10.2 Feedback Patterns

#### Success Feedback
```javascript
const SuccessToast = ({ message }) => (
  <Toast variant="success" duration={3000}>
    <Icon name="check-circle" />
    <span>{message}</span>
  </Toast>
);
```

#### Error Feedback
```javascript
const ErrorAlert = ({ error, onRetry }) => (
  <Alert variant="danger" dismissible={false}>
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
    {error.recoverable && (
      <Button size="sm" onClick={onRetry}>Try Again</Button>
    )}
  </Alert>
);
```

### 10.3 Micro-Interactions

#### Button Press
```css
.button:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}
```

#### Toggle Switch
```css
.toggle-switch {
  transition: background-color 0.3s ease;
}

.toggle-switch.checked {
  background-color: var(--success-green);
}

.toggle-thumb {
  transition: transform 0.3s ease;
}
```

### 10.4 Navigation Transitions

```css
/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateX(100%);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s ease;
}

.page-exit {
  opacity: 1;
  transform: translateX(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-100%);
  transition: all 0.3s ease;
}
```

---

## 11. Responsive Design Guidelines

### 11.1 Breakpoint System

```css
/* Mobile First Breakpoints */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### 11.2 Fluid Typography

```css
/* Clamp for responsive text */
.heading-1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.body-text {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
```

### 11.3 Flexible Grid System

```css
.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

/* Responsive columns */
@media (min-width: 768px) {
  .grid-md-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-md-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .grid-lg-4 { grid-template-columns: repeat(4, 1fr); }
}
```

### 11.4 Container Queries

```css
/* Component-level responsiveness */
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    grid-template-columns: auto 1fr;
  }
}
```

---

## 12. Navigation Architecture

### 12.1 Mobile Navigation

#### Bottom Navigation Bar
```javascript
const BottomNav = () => (
  <nav className="bottom-nav" role="navigation">
    <NavItem icon="home" label="Home" to="/dashboard" />
    <NavItem icon="folder" label="Projects" to="/projects" />
    <NavItem icon="plus-circle" label="New" to="/create" primary />
    <NavItem icon="clipboard" label="Forms" to="/forms" />
    <NavItem icon="menu" label="More" to="/menu" />
  </nav>
);
```

#### Hamburger Menu (Secondary)
```javascript
const HamburgerMenu = () => (
  <Sheet>
    <SheetTrigger>
      <Icon name="menu" />
    </SheetTrigger>
    <SheetContent side="left">
      <nav>
        <MenuItem icon="settings" label="Settings" />
        <MenuItem icon="user" label="Profile" />
        <MenuItem icon="sync" label="Sync Status" />
        <MenuItem icon="help" label="Help" />
        <MenuItem icon="logout" label="Sign Out" />
      </nav>
    </SheetContent>
  </Sheet>
);
```

### 12.2 Desktop Navigation

#### Sidebar Navigation
```css
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  background: var(--neutral-100);
  border-right: 1px solid var(--neutral-300);
  overflow-y: auto;
}

.sidebar.collapsed {
  width: 64px;
}
```

### 12.3 Breadcrumb Navigation

```javascript
const Breadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb">
    <ol className="breadcrumb">
      {items.map((item, index) => (
        <li key={item.id}>
          {index < items.length - 1 ? (
            <Link to={item.path}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
```

---

## 13. Form Design Patterns

### 13.1 Form Layout Patterns

#### Single Column Forms (Mobile)
```css
.form-mobile {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

#### Multi-Column Forms (Desktop)
```css
@media (min-width: 768px) {
  .form-desktop {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
}
```

### 13.2 Progressive Disclosure

```javascript
const ConditionalFields = ({ trigger, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <>
      <FormField
        name={trigger.name}
        onChange={(value) => setIsVisible(trigger.condition(value))}
      />
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {children}
        </motion.div>
      )}
    </>
  );
};
```

### 13.3 Multi-Step Forms

```javascript
const MultiStepForm = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  return (
    <div className="multi-step-form">
      <ProgressBar 
        current={currentStep + 1} 
        total={steps.length} 
      />
      <StepIndicator 
        steps={steps} 
        current={currentStep} 
      />
      <FormStep>
        {steps[currentStep].component}
      </FormStep>
      <FormActions>
        {currentStep > 0 && (
          <Button 
            variant="secondary" 
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Previous
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
          <Button 
            variant="primary" 
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next
          </Button>
        ) : (
          <Button variant="success" type="submit">
            Submit
          </Button>
        )}
      </FormActions>
    </div>
  );
};
```

### 13.4 Input Field Patterns

#### Text Input with Floating Label
```css
.floating-label-group {
  position: relative;
  margin-top: 1rem;
}

.floating-input {
  padding: 1rem 0.75rem 0.25rem;
}

.floating-label {
  position: absolute;
  top: 0.25rem;
  left: 0.75rem;
  font-size: 0.75rem;
  color: var(--neutral-700);
}
```

#### Voice Input Support
```javascript
const VoiceInput = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  
  return (
    <div className="voice-input">
      <Input 
        type="text" 
        value={transcript}
        onChange={handleChange}
      />
      <Button
        icon={isListening ? 'mic-off' : 'mic'}
        onClick={toggleListening}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      />
    </div>
  );
};
```

---

## 14. Error Handling and Validation

### 14.1 Inline Validation

```javascript
const FormField = ({ name, validation, ...props }) => {
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  
  const validate = (value) => {
    const result = validation.safeParse(value);
    if (!result.success && touched) {
      setError(result.error.issues[0].message);
    } else {
      setError(null);
    }
  };
  
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={name}>{props.label}</label>
      <input
        id={name}
        onBlur={() => setTouched(true)}
        onChange={(e) => validate(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${name}-error`} className="error-message">
          <Icon name="alert-circle" />
          {error}
        </span>
      )}
    </div>
  );
};
```

### 14.2 Error Summary

```javascript
const ErrorSummary = ({ errors }) => {
  if (errors.length === 0) return null;
  
  return (
    <Alert variant="danger" role="alert">
      <AlertTitle>
        Please correct the following errors:
      </AlertTitle>
      <ul>
        {errors.map(error => (
          <li key={error.field}>
            <a href={`#${error.field}`}>{error.message}</a>
          </li>
        ))}
      </ul>
    </Alert>
  );
};
```

### 14.3 Success Feedback

```javascript
const SuccessFeedback = ({ message, onDismiss }) => (
  <Alert variant="success" dismissible onDismiss={onDismiss}>
    <Icon name="check-circle" />
    <span>{message}</span>
  </Alert>
);
```

### 14.4 Network Error Handling

```javascript
const NetworkErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const isOnline = useNetworkStatus();
  
  if (!isOnline) {
    return (
      <OfflineMessage>
        You're offline. Changes will sync when connection returns.
      </OfflineMessage>
    );
  }
  
  if (hasError) {
    return (
      <ErrorMessage>
        <Icon name="wifi-off" />
        <h2>Connection Error</h2>
        <p>Unable to reach server. Please try again.</p>
        <Button onClick={() => setHasError(false)}>
          Retry
        </Button>
      </ErrorMessage>
    );
  }
  
  return children;
};
```

---

## 15. Performance Optimization

### 15.1 Image Optimization

```javascript
const OptimizedImage = ({ src, alt, sizes }) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <picture>
      <source 
        type="image/webp" 
        srcSet={`${src}?format=webp&w=400 400w,
                 ${src}?format=webp&w=800 800w,
                 ${src}?format=webp&w=1200 1200w`}
      />
      <img
        src={`${src}?w=400`}
        srcSet={`${src}?w=400 400w,
                 ${src}?w=800 800w,
                 ${src}?w=1200 1200w`}
        sizes={sizes || '100vw'}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        className={loading ? 'loading' : ''}
      />
    </picture>
  );
};
```

### 15.2 Lazy Loading

```javascript
const LazyList = ({ items, renderItem }) => {
  const [visibleItems, setVisibleItems] = useState(20);
  const observerRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleItems(prev => Math.min(prev + 20, items.length));
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    
    return () => observer.disconnect();
  }, [items.length]);
  
  return (
    <>
      {items.slice(0, visibleItems).map(renderItem)}
      <div ref={observerRef} />
    </>
  );
};
```

### 15.3 Debouncing and Throttling

```javascript
// Debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Throttled scroll handler
const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};
```

### 15.4 Code Splitting

```javascript
// Route-based code splitting
const Projects = lazy(() => import('./pages/Projects'));
const Forms = lazy(() => import('./pages/Forms'));
const Settings = lazy(() => import('./pages/Settings'));

const App = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/projects" element={<Projects />} />
      <Route path="/forms" element={<Forms />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  </Suspense>
);
```

---

## 16. Implementation Specifications

### 16.1 Technology Implementation

#### Component Structure
```typescript
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  'data-testid'?: string;
}
```

#### Mantine v7 Configuration
```javascript
const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', 
           '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', 
           '#1565C0', '#0D47A1'],
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
  defaultRadius: 'md',
  loader: 'bars',
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        root: {
          minHeight: 48,
        },
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        input: {
          minHeight: 48,
          fontSize: 16,
        },
      },
    },
  },
});
```

### 16.2 Responsive Utilities

```css
/* Utility classes */
.mobile-only { display: block; }
.tablet-up { display: none; }
.desktop-only { display: none; }

@media (min-width: 768px) {
  .mobile-only { display: none; }
  .tablet-up { display: block; }
}

@media (min-width: 1024px) {
  .desktop-only { display: block; }
}

/* Spacing utilities */
.p-mobile { padding: var(--space-3); }
.p-tablet { padding: var(--space-4); }
.p-desktop { padding: var(--space-6); }

/* Grid utilities */
.grid-1 { grid-template-columns: 1fr; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
```

### 16.3 Animation Specifications

```css
/* Animation durations */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* Easing functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Common animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 16.4 Testing Specifications

#### Component Testing
```javascript
describe('Button Component', () => {
  it('should have minimum touch target size', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const button = getByRole('button');
    expect(button).toHaveStyle('min-height: 48px');
    expect(button).toHaveStyle('min-width: 48px');
  });
  
  it('should be keyboard accessible', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Button onClick={handleClick}>Submit</Button>
    );
    const button = getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### Accessibility Testing
```javascript
describe('Accessibility', () => {
  it('should have no WCAG violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should announce form errors to screen readers', () => {
    const { getByRole } = render(
      <FormField 
        name="email" 
        error="Invalid email address"
      />
    );
    const input = getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });
});
```

---

## Appendices

### Appendix A: Icon Library

Using Lucide React icons (24x24 grid):

| Icon Name | Usage | Size |
|-----------|-------|------|
| home | Dashboard | 24px |
| folder | Projects | 24px |
| file-text | Forms | 24px |
| camera | Photo capture | 24px |
| check-circle | Success | 24px |
| alert-circle | Warning | 24px |
| x-circle | Error | 24px |
| wifi-off | Offline | 24px |
| sync | Syncing | 24px |
| menu | Navigation | 24px |

### Appendix B: Device Support Matrix

| Platform | Minimum Version | Target Devices |
|----------|----------------|----------------|
| iOS | 12.0 | iPhone 8 and newer |
| Android | SDK 26 (8.0) | Devices with 3GB+ RAM |
| Web | Chrome 90+, Safari 14+, Firefox 88+ | All modern browsers |

### Appendix C: Performance Metrics

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint | <1.8s | 2.5s |
| Time to Interactive | <3.5s | 5.0s |
| Largest Contentful Paint | <2.5s | 4.0s |
| Cumulative Layout Shift | <0.1 | 0.25 |
| First Input Delay | <100ms | 300ms |

### Appendix D: Accessibility Checklist

- [ ] All interactive elements have focus indicators
- [ ] Color is not the only means of conveying information
- [ ] Contrast ratios meet WCAG AA standards (4.5:1)
- [ ] All images have appropriate alt text
- [ ] Forms have proper labels and error messages
- [ ] Content is keyboard navigable
- [ ] ARIA attributes are properly implemented
- [ ] Touch targets meet minimum size requirements
- [ ] Content works with screen readers
- [ ] Animations respect prefers-reduced-motion

---

## Document Control

**Version:** 1.0  
**Status:** FINAL - Approved for Development  
**Created:** August 2025  
**Last Updated:** August 2025  
**Next Review:** Post-Beta Launch  
**Owner:** Design Team

### Approval Matrix

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Head of Design | | Aug 2025 | Approved |
| Product Manager | | Aug 2025 | Approved |
| Engineering Lead | | Aug 2025 | Approved |
| QA Lead | | Aug 2025 | Approved |

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | July 2025 | Design Team | Initial draft |
| 0.5 | August 2025 | All Teams | Incorporated feedback |
| 0.9 | August 2025 | Design Lead | Final review |
| 1.0 | August 2025 | All Stakeholders | Approved for development |

---

*This UI/UX Design Document serves as the authoritative reference for all design decisions in the BrAve Forms Platform v1.0. It establishes patterns optimized for construction field conditions while maintaining accessibility and usability standards. Any design changes require formal review through the Design Review Board.*

**END OF DOCUMENT**
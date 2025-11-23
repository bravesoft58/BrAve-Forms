# ISSUE-150: Form Builder Architecture Setup (6h)

**Sprint:** Sprint 5 | **Phase:** 5 - Form Builder | **Priority:** P0
**Time:** 6 hours | **Complexity:** Large
**Created:** 2025-10-23
**Dependencies:** ISSUE-160 complete (Phase 4 done)
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Set up form builder architecture with @dnd-kit/core drag-drop library, Valtio state management, and 3-column layout (palette, canvas, properties).

## Prerequisites

- [ ] Phase 4 complete (Polish & Testing done)
- [ ] @dnd-kit/core installed
- [ ] Valtio working (already in use)
- [ ] Code editor open to apps/web directory

## Libraries/Dependencies

**@dnd-kit/core:**

- **Version:** ^6.3.1
- **License:** MIT (open source)
- **Why:** Best-in-class drag-drop for 2025 (10KB, zero dependencies, accessible, performant)
- **Better Than:** react-beautiful-dnd (deprecated), react-dnd (complex API)
- **Install:**
  ```bash
  pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  ```

## Step-by-Step Instructions

### Step 1: Install @dnd-kit Libraries (15 min)

```bash
cd apps/web
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Verify installation:

```bash
grep "@dnd-kit" package.json
```

### Step 2: Create Form Builder State (Valtio) (120 min)

Create `apps/web/stores/form-builder-store.ts`:

```typescript
import { proxy, subscribe } from 'valtio';
import { Field, FormTemplate } from '@braveforms/types';

interface FormBuilderState {
  currentForm: Partial<FormTemplate> | null;
  selectedFieldId: string | null;
  isDragging: boolean;
  history: Array<Partial<FormTemplate>>;
  historyIndex: number;
}

export const formBuilderStore = proxy<FormBuilderState>({
  currentForm: null,
  selectedFieldId: null,
  isDragging: false,
  history: [],
  historyIndex: -1,
});

export const formBuilderActions = {
  createForm(name: string, category: string) {
    const newForm: Partial<FormTemplate> = {
      name,
      category,
      version: '1.0.0',
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'General Information',
            description: '',
            fields: [],
          },
        ],
      },
      createdAt: new Date(),
    };

    formBuilderStore.currentForm = newForm;
    formBuilderStore.history = [newForm];
    formBuilderStore.historyIndex = 0;
  },

  addField(sectionId: string, field: Field) {
    if (!formBuilderStore.currentForm?.schema) return;

    const section = formBuilderStore.currentForm.schema.sections.find((s) => s.id === sectionId);

    if (section) {
      section.fields.push(field);
      this.saveToHistory();
    }
  },

  updateField(fieldId: string, updates: Partial<Field>) {
    if (!formBuilderStore.currentForm?.schema) return;

    for (const section of formBuilderStore.currentForm.schema.sections) {
      const field = section.fields.find((f) => f.id === fieldId);
      if (field) {
        Object.assign(field, updates);
        this.saveToHistory();
        break;
      }
    }
  },

  deleteField(fieldId: string) {
    if (!formBuilderStore.currentForm?.schema) return;

    for (const section of formBuilderStore.currentForm.schema.sections) {
      const index = section.fields.findIndex((f) => f.id === fieldId);
      if (index !== -1) {
        section.fields.splice(index, 1);
        this.saveToHistory();
        break;
      }
    }
  },

  reorderFields(sectionId: string, fromIndex: number, toIndex: number) {
    if (!formBuilderStore.currentForm?.schema) return;

    const section = formBuilderStore.currentForm.schema.sections.find((s) => s.id === sectionId);

    if (section) {
      const [field] = section.fields.splice(fromIndex, 1);
      section.fields.splice(toIndex, 0, field);
      this.saveToHistory();
    }
  },

  selectField(fieldId: string | null) {
    formBuilderStore.selectedFieldId = fieldId;
  },

  saveToHistory() {
    if (!formBuilderStore.currentForm) return;

    // Remove any future history if we're not at the end
    formBuilderStore.history.splice(formBuilderStore.historyIndex + 1);

    // Add current state to history
    formBuilderStore.history.push(JSON.parse(JSON.stringify(formBuilderStore.currentForm)));

    // Limit history to 50 snapshots
    if (formBuilderStore.history.length > 50) {
      formBuilderStore.history.shift();
    } else {
      formBuilderStore.historyIndex++;
    }
  },

  undo() {
    if (formBuilderStore.historyIndex > 0) {
      formBuilderStore.historyIndex--;
      formBuilderStore.currentForm = formBuilderStore.history[formBuilderStore.historyIndex];
    }
  },

  redo() {
    if (formBuilderStore.historyIndex < formBuilderStore.history.length - 1) {
      formBuilderStore.historyIndex++;
      formBuilderStore.currentForm = formBuilderStore.history[formBuilderStore.historyIndex];
    }
  },
};

// Auto-save to localStorage every 30 seconds
subscribe(formBuilderStore, () => {
  if (formBuilderStore.currentForm) {
    localStorage.setItem('formBuilderDraft', JSON.stringify(formBuilderStore.currentForm));
  }
});
```

### Step 3: Create Form Builder Routes (30 min)

Create `apps/web/app/admin/forms/new/page.tsx`:

```typescript
'use client';

import { PageContainer } from '@/components/layout/page-container';
import { FormBuilderLayout } from '@/components/form-builder/form-builder-layout';

export default function NewFormPage() {
  return (
    <PageContainer title="Create New Form">
      <FormBuilderLayout />
    </PageContainer>
  );
}
```

Create `apps/web/app/admin/forms/[id]/edit/page.tsx`:

```typescript
'use client';

import { PageContainer } from '@/components/layout/page-container';
import { FormBuilderLayout } from '@/components/form-builder/form-builder-layout';
import { useParams } from 'next/navigation';

export default function EditFormPage() {
  const { id } = useParams();

  return (
    <PageContainer title="Edit Form">
      <FormBuilderLayout formId={id as string} />
    </PageContainer>
  );
}
```

### Step 4: Create FormBuilderLayout Component (90 min)

Create `apps/web/components/form-builder/form-builder-layout.tsx`:

```typescript
'use client';

import { Grid, Stack } from '@mantine/core';
import { FieldPalette } from './field-palette';
import { FormCanvas } from './form-canvas';
import { PropertiesPanel } from './properties-panel';
import { FormBuilderToolbar } from './form-builder-toolbar';

interface FormBuilderLayoutProps {
  formId?: string;
}

export function FormBuilderLayout({ formId }: FormBuilderLayoutProps) {
  return (
    <Stack gap="md" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Toolbar */}
      <FormBuilderToolbar />

      {/* 3-Column Layout */}
      <Grid grow gutter="md" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Left: Field Palette */}
        <Grid.Col span={3}>
          <FieldPalette />
        </Grid.Col>

        {/* Center: Form Canvas */}
        <Grid.Col span={6}>
          <FormCanvas />
        </Grid.Col>

        {/* Right: Properties Panel */}
        <Grid.Col span={3}>
          <PropertiesPanel />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
```

### Step 5: Create FormBuilderToolbar Component (45 min)

Create `apps/web/components/form-builder/form-builder-toolbar.tsx`:

```typescript
'use client';

import { Group, Button, ActionIcon, Text } from '@mantine/core';
import {
  IconDeviceFloppy,
  IconEye,
  IconArrowBack,
  IconArrowForward,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, formBuilderActions } from '@/stores/form-builder-store';

export function FormBuilderToolbar() {
  const { currentForm, historyIndex, history } = useSnapshot(formBuilderStore);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #e0e0e0' }}>
      <Group>
        <ActionIcon
          variant="subtle"
          disabled={!canUndo}
          onClick={() => formBuilderActions.undo()}
        >
          <IconArrowBack size={20} />
        </ActionIcon>

        <ActionIcon
          variant="subtle"
          disabled={!canRedo}
          onClick={() => formBuilderActions.redo()}
        >
          <IconArrowForward size={20} />
        </ActionIcon>

        <Text size="sm" c="dimmed">
          {currentForm?.name || 'Untitled Form'}
        </Text>
      </Group>

      <Group>
        <Button variant="subtle" leftSection={<IconEye size={16} />}>
          Preview
        </Button>

        <Button leftSection={<IconDeviceFloppy size={16} />}>
          Save Draft
        </Button>

        <Button variant="filled">
          Publish
        </Button>
      </Group>
    </Group>
  );
}
```

### Step 6: Test Form Builder Architecture (60 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Access form builder
# Navigate to http://localhost:30102/admin/forms/new
```

**Verify:**

- [ ] 3-column layout displays
- [ ] Valtio store initialized
- [ ] Toolbar displays with undo/redo buttons
- [ ] State persists to localStorage
- [ ] No errors in console

## TDD Workflow

**Phase 1: Write Tests**

Create `apps/web/stores/__tests__/form-builder-store.test.ts`:

```typescript
import { formBuilderStore, formBuilderActions } from '../form-builder-store';

describe('formBuilderActions', () => {
  beforeEach(() => {
    formBuilderActions.createForm('Test Form', 'inspection');
  });

  it('should create new form', () => {
    expect(formBuilderStore.currentForm?.name).toBe('Test Form');
  });

  it('should add field to section', () => {
    formBuilderActions.addField('section-1', {
      id: 'field-1',
      type: 'text',
      label: 'Test Field',
    });

    expect(formBuilderStore.currentForm?.schema?.sections[0].fields).toHaveLength(1);
  });

  it('should support undo/redo', () => {
    formBuilderActions.addField('section-1', { id: 'field-1', type: 'text', label: 'Test' });
    formBuilderActions.undo();

    expect(formBuilderStore.currentForm?.schema?.sections[0].fields).toHaveLength(0);

    formBuilderActions.redo();
    expect(formBuilderStore.currentForm?.schema?.sections[0].fields).toHaveLength(1);
  });
});
```

**Screenshot:** `evidence/ISSUE-161/test-results/red-phase.png`
**Screenshot:** `evidence/ISSUE-161/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/stores/form-builder-store.ts
- apps/web/app/admin/forms/new/page.tsx
- apps/web/app/admin/forms/[id]/edit/page.tsx
- apps/web/components/form-builder/form-builder-layout.tsx
- apps/web/components/form-builder/form-builder-toolbar.tsx
- apps/web/stores/**tests**/form-builder-store.test.ts

**Modify:**

- apps/web/package.json (add @dnd-kit dependencies)

## Verification Checklist

- [ ] @dnd-kit installed
- [ ] Valtio store created
- [ ] Form builder routes created
- [ ] 3-column layout functional
- [ ] Toolbar with undo/redo works
- [ ] Auto-save to localStorage works
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-161/

**Required:**

- test-results/red-phase.png
- test-results/green-phase.png
- screenshots/form-builder-layout.png
- screenshots/toolbar.png

## Success Criteria

- [ ] Form builder architecture initialized
- [ ] Valtio state management works
- [ ] Undo/redo functional (50 snapshots max)
- [ ] Auto-save every 30 seconds
- [ ] Tests pass with >80% coverage

## Time Estimate

**6 hours total:**

- Install libraries: 15 min
- Valtio store: 120 min
- Routes: 30 min
- Layout component: 90 min
- Toolbar: 45 min
- Testing: 60 min

## Next Issue

**ISSUE-151:** [Next issue title]

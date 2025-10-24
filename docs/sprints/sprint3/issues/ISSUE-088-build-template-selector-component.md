# ISSUE-088: Build Template Selector Component

**Phase:** Phase 2 - Core Pages
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** ISSUE-087 (Project Detail created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create Template Selector component for choosing form templates - displays grid of available templates with filters by category, search by name, click to fill form.

## Acceptance Criteria

- [ ] Grid of available form templates
- [ ] Filter by category (Daily Logs, Inspections, Safety)
- [ ] Search templates by name
- [ ] Template card shows icon, name, description
- [ ] Click template to navigate to form fill page
- [ ] Responsive grid layout

## Implementation

```typescript
// apps/web/components/forms/TemplateSelector.tsx
export function TemplateSelector({ projectId }: { projectId: string }) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { data: templates } = useFormTemplates({ category, search });
  const router = useRouter();

  return (
    <Stack spacing="md">
      <Group>
        <SegmentedControl
          value={category}
          onChange={setCategory}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Daily Logs', value: 'daily-logs' },
            { label: 'Inspections', value: 'inspections' },
            { label: 'Safety', value: 'safety' },
          ]}
        />
        <TextInput
          placeholder="Search templates..."
          icon={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {templates?.map((template) => (
          <Paper
            key={template.id}
            p="md"
            withBorder
            onClick={() => router.push(`/forms/${template.id}/fill?projectId=${projectId}`)}
            sx={{ cursor: 'pointer', minHeight: 120 }}
          >
            <Stack spacing="xs">
              <Group>
                <IconForms size={24} />
                <Text weight={600}>{template.title}</Text>
              </Group>
              <Text size="sm" color="dimmed" lineClamp={2}>
                {template.description}
              </Text>
              <Badge size="sm" variant="light">
                {template.category}
              </Badge>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      {templates?.length === 0 && (
        <Text color="dimmed" align="center" py="xl">
          No templates found
        </Text>
      )}
    </Stack>
  );
}
```

## Tests

```typescript
describe('TemplateSelector', () => {
  it('should filter templates by category', () => {
    render(<TemplateSelector projectId="1" />);
    fireEvent.click(screen.getByText('Inspections'));
    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.queryByText('Daily Log')).not.toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/template-selector-all.png
- ui-screenshots/template-selector-filtered.png
- ui-screenshots/template-selector-search.png

## Definition of Done

- [ ] Template selector functional
- [ ] Filters working
- [ ] Tests passing
- [ ] Ready for ISSUE-089

---

**Issue Status:** Not Started
**Created:** 2025-10-23

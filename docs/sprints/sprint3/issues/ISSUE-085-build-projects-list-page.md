# ISSUE-085: Build Projects List Page

**Phase:** Phase 2 - Core Pages
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** ISSUE-084 (Dashboard created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create Projects List page with grid view of all projects, filters (Active, Favorites, Archived), search, and New Project button.

## Acceptance Criteria

- [ ] Grid view of all projects (cards)
- [ ] Filter: Active, Favorites, Archived
- [ ] Search by project name/address
- [ ] New Project button
- [ ] Empty state (No projects yet)
- [ ] Responsive grid (1 col mobile, 2-3 cols desktop)

## Implementation

```typescript
// apps/web/app/dashboard/projects/page.tsx
export default function ProjectsPage() {
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  return (
    <PageContainer
      title="Projects"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Projects' },
      ]}
      actions={
        <Button leftIcon={<IconPlus size={16} />}>
          New Project
        </Button>
      }
    >
      <Stack spacing="md">
        <Group>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            data={[
              { label: 'Active', value: 'active' },
              { label: 'Favorites', value: 'favorites' },
              { label: 'Archived', value: 'archived' },
            ]}
          />
          <TextInput
            placeholder="Search projects..."
            icon={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </SimpleGrid>
      </Stack>
    </PageContainer>
  );
}
```

## Tests

```typescript
describe('Projects List Page', () => {
  it('should filter projects by status', () => {
    render(<ProjectsPage />);
    fireEvent.click(screen.getByText('Archived'));
    expect(screen.queryByText('Active Project')).not.toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/projects-list-desktop.png
- ui-screenshots/projects-list-mobile.png
- ui-screenshots/projects-empty-state.png

## Definition of Done

- [ ] Projects list functional
- [ ] Filters working
- [ ] Search working
- [ ] Tests passing
- [ ] Ready for ISSUE-086

---

**Issue Status:** Not Started
**Created:** 2025-10-23

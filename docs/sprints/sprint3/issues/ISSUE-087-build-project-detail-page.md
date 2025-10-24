# ISSUE-087: Build Project Detail Page

**Phase:** Phase 2 - Core Pages
**Priority:** P0 (Must Have)
**Estimated Time:** 3 hours
**Dependencies:** ISSUE-086 (ProjectCard created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create Project Detail page with tabs for Forms, Photos, Team, Weather, Compliance. Mobile uses swipeable tabs for field optimization.

## Acceptance Criteria

- [ ] Project header (name, address, edit button)
- [ ] Tabs: Forms, Photos, Team, Weather, Compliance
- [ ] Forms tab shows template selector and submitted forms
- [ ] Mobile: Swipeable tabs
- [ ] Desktop: Click tabs
- [ ] Tab content loads on demand

## Implementation

```typescript
// apps/web/app/dashboard/projects/[id]/page.tsx
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = useProject(params.id);

  return (
    <PageContainer
      title={project.name}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Projects', href: '/dashboard/projects' },
        { label: project.name },
      ]}
      actions={
        <Button variant="light" leftIcon={<IconEdit size={16} />}>
          Edit Project
        </Button>
      }
    >
      <Tabs defaultValue="forms">
        <Tabs.List>
          <Tabs.Tab value="forms" icon={<IconForms size={14} />}>
            Forms
          </Tabs.Tab>
          <Tabs.Tab value="photos" icon={<IconPhoto size={14} />}>
            Photos
          </Tabs.Tab>
          <Tabs.Tab value="team" icon={<IconUsers size={14} />}>
            Team
          </Tabs.Tab>
          <Tabs.Tab value="weather" icon={<IconCloudRain size={14} />}>
            Weather
          </Tabs.Tab>
          <Tabs.Tab value="compliance" icon={<IconCheck size={14} />}>
            Compliance
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="forms" pt="md">
          <ProjectFormsTab projectId={project.id} />
        </Tabs.Panel>

        {/* Other tabs... */}
      </Tabs>
    </PageContainer>
  );
}
```

## Tests

```typescript
describe('Project Detail Page', () => {
  it('should switch tabs on click', () => {
    render(<ProjectDetailPage params={{ id: '1' }} />);
    fireEvent.click(screen.getByText('Photos'));
    expect(screen.getByTestId('photos-tab-content')).toBeVisible();
  });
});
```

## Evidence Requirements

- ui-screenshots/project-detail-desktop.png
- ui-screenshots/project-detail-tabs.png

## Definition of Done

- [ ] Project detail page functional
- [ ] All tabs working
- [ ] Tests passing
- [ ] Ready for ISSUE-088

---

**Issue Status:** Not Started
**Created:** 2025-10-23

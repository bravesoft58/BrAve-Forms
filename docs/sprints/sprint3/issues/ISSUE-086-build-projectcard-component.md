# ISSUE-086: Build ProjectCard Component

**Phase:** Phase 2 - Core Pages
**Priority:** P0 (Must Have)
**Estimated Time:** 1 hour
**Dependencies:** ISSUE-085 (Projects List created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create ProjectCard component to display project information in grid - includes project name, address, status, weather icon (if alert), pending tasks counter, and click to navigate.

## Acceptance Criteria

- [ ] Display project name, address, status
- [ ] Weather icon if rain alert
- [ ] Pending tasks counter badge
- [ ] Click card to navigate to project detail
- [ ] Glove-friendly card size

## Implementation

```typescript
// apps/web/components/projects/ProjectCard.tsx
export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const hasWeatherAlert = project.recentRainfall >= 0.25;

  return (
    <Paper
      p="md"
      withBorder
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
      sx={{ cursor: 'pointer', minHeight: 160 }}
    >
      <Stack spacing="xs">
        <Group position="apart">
          <Text weight={600} size="lg">
            {project.name}
          </Text>
          {hasWeatherAlert && (
            <IconCloudRain size={20} color="orange" />
          )}
        </Group>

        <Text size="sm" color="dimmed" lineClamp={2}>
          {project.address}
        </Text>

        <Group position="apart" mt="auto">
          <Badge variant="light">{project.status}</Badge>
          {project.pendingTasks > 0 && (
            <Badge color="orange">{project.pendingTasks} tasks</Badge>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
```

## Tests

```typescript
describe('ProjectCard', () => {
  it('should show weather icon when rain >= 0.25"', () => {
    render(<ProjectCard project={{ ...mockProject, recentRainfall: 0.3 }} />);
    expect(screen.getByTestId('weather-icon')).toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/project-card.png
- ui-screenshots/project-card-with-alert.png

## Definition of Done

- [ ] ProjectCard renders correctly
- [ ] Tests passing
- [ ] Ready for ISSUE-087

---

**Issue Status:** Not Started
**Created:** 2025-10-23

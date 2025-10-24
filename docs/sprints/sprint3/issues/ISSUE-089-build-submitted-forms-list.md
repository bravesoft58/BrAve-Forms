# ISSUE-089: Build Submitted Forms List

**Phase:** Phase 2 - Core Pages
**Priority:** P0 (Must Have)
**Estimated Time:** 2 hours
**Dependencies:** ISSUE-088 (Template Selector created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create Submitted Forms List component showing all submitted forms for a project - filter by date range, template, status, sort by date, click to view details, empty state.

## Acceptance Criteria

- [ ] List all submitted forms for project
- [ ] Filter by date range, template, status
- [ ] Sort by date (newest first)
- [ ] Click row to view submission details
- [ ] Empty state (No forms submitted yet)
- [ ] Mobile-optimized table/cards

## Implementation

```typescript
// apps/web/components/forms/SubmittedFormsList.tsx
export function SubmittedFormsList({ projectId }: { projectId: string }) {
  const [filters, setFilters] = useState({
    dateRange: null,
    template: 'all',
    status: 'all',
  });
  const { data: submissions } = useFormSubmissions(projectId, filters);
  const router = useRouter();

  if (submissions?.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" spacing="md">
          <IconForms size={48} color="gray" />
          <Text color="dimmed">No forms submitted yet</Text>
          <Button
            variant="light"
            leftIcon={<IconPlus size={16} />}
            onClick={() => router.push(`/dashboard/projects/${projectId}?tab=forms`)}
          >
            Fill Your First Form
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing="md">
      <Group>
        <DateRangePicker
          placeholder="Filter by date"
          value={filters.dateRange}
          onChange={(range) => setFilters({ ...filters, dateRange: range })}
        />
        <Select
          placeholder="Template"
          value={filters.template}
          onChange={(value) => setFilters({ ...filters, template: value })}
          data={[
            { label: 'All Templates', value: 'all' },
            { label: 'Daily Log', value: 'daily-log' },
            { label: 'SWPPP Inspection', value: 'swppp' },
          ]}
        />
      </Group>

      <Table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Form</th>
            <th>Submitted By</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions?.map((submission) => (
            <tr
              key={submission.id}
              onClick={() => router.push(`/forms/submissions/${submission.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <td>{new Date(submission.createdAt).toLocaleDateString()}</td>
              <td>{submission.formTitle}</td>
              <td>{submission.submittedBy}</td>
              <td>
                <Badge color={getStatusColor(submission.status)}>
                  {submission.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
```

## Tests

```typescript
describe('SubmittedFormsList', () => {
  it('should show empty state when no submissions', () => {
    (useFormSubmissions as jest.Mock).mockReturnValue({ data: [] });
    render(<SubmittedFormsList projectId="1" />);
    expect(screen.getByText('No forms submitted yet')).toBeInTheDocument();
  });

  it('should navigate to submission detail on row click', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    render(<SubmittedFormsList projectId="1" />);
    fireEvent.click(screen.getByText('Daily Log'));
    expect(pushMock).toHaveBeenCalledWith('/forms/submissions/123');
  });
});
```

## Evidence Requirements

- ui-screenshots/forms-list-with-data.png
- ui-screenshots/forms-list-empty.png
- ui-screenshots/forms-list-filtered.png

## Definition of Done

- [ ] Submitted forms list functional
- [ ] Filters working
- [ ] Empty state shown correctly
- [ ] Tests passing
- [ ] Phase 2 COMPLETE
- [ ] Ready for Phase 3 (ISSUE-090 - Single-tenant simplification)

---

**Issue Status:** Not Started
**Created:** 2025-10-23

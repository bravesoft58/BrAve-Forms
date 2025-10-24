# ISSUE-080: Build UserNav Dropdown

**Phase:** Phase 1 - Navigation Layer
**Priority:** P0 (Must Have)
**Estimated Time:** 1 hour
**Dependencies:** ISSUE-077 (AppHeader created)
**Assigned To:** Frontend Developer 1

## Issue Description

Create UserNav dropdown menu component within AppHeader - provides user profile access, settings link, sync status, and sign out functionality.

## Acceptance Criteria

- [ ] User profile menu (Settings, Sign Out)
- [ ] Display current user name and email
- [ ] Sync status indicator
- [ ] Click to open/close dropdown
- [ ] Navigate to settings page
- [ ] Sign out redirects to auth page

## Implementation (Already in ISSUE-077)

This component is implemented within AppHeader (ISSUE-077) using Mantine Menu. This issue tracks testing and evidence collection separately.

## Tests

```typescript
describe('UserNav', () => {
  it('should show user email in dropdown', () => {
    render(<AppHeader {...props} />);
    fireEvent.click(screen.getByText('John'));
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## Evidence Requirements

- ui-screenshots/user-dropdown-closed.png
- ui-screenshots/user-dropdown-open.png
- test-results/user-nav-tests.png

## Definition of Done

- [ ] User menu functional
- [ ] Tests passing
- [ ] Ready for ISSUE-081

---

**Issue Status:** Not Started
**Created:** 2025-10-23

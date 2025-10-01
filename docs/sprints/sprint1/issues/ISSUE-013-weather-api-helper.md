# ISSUE-013: Create Weather API Helper

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 12:00:00 EDT

## What You'll Do

Create fetch helper function for weather data GraphQL queries.

## Single Objective

Create one file with one function that fetches weather data from backend GraphQL API.

## Files to Create

- `apps/web/lib/api/weather.ts` (NEW)

## Step-by-Step Instructions

1. Create `apps/web/lib/api/` directory if missing:
```bash
mkdir -p apps/web/lib/api
```

2. Create `apps/web/lib/api/weather.ts` file

3. Add this code EXACTLY:
```typescript
/**
 * Weather API helpers for fetching data from backend GraphQL
 */

export async function fetchWeatherData() {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { weather { temperature humidity precipitation } }`
    })
  });

  if (!response.ok) {
    throw new Error(`Weather API returned ${response.status}`);
  }

  const json = await response.json();
  return json.data.weather;
}
```

4. Save file

5. Verify file compiles:
```bash
cd apps/web
pnpm type-check
```

## Verification Checklist

- [ ] Directory `apps/web/lib/api/` exists
- [ ] File `weather.ts` created at correct path
- [ ] Function `fetchWeatherData` exported
- [ ] No TypeScript compilation errors
- [ ] HTTP error handling included

## Evidence Required

Create folder: `docs/sprints/sprint1/evidence/ISSUE-013/code/`

Screenshot showing:
1. File created in VS Code
2. Function code visible
3. No TypeScript errors in terminal

Save as: `evidence/ISSUE-013/code/weather-api-helper.png`

## Success Criteria

- [ ] Function compiles without errors
- [ ] Export statement present
- [ ] Error handling implemented
- [ ] Evidence collected

## Time Estimate

**15 minutes total:**
- Create directory: 1 min
- Write function: 8 min
- Verify compilation: 3 min
- Collect evidence: 3 min

## Next Issue

ISSUE-014: Add TanStack Query to WeatherDashboard (20 min)

## Notes for Junior Developers

- This is just a helper function, not a full component
- Copy the code EXACTLY as shown
- Don't worry about the GraphQL query format yet
- If you get TypeScript errors, ask for help
- Make sure you're in the correct directory before creating files

## Common Mistakes to Avoid

- Creating file in wrong location (must be `apps/web/lib/api/`)
- Forgetting to export the function
- Not checking TypeScript compilation
- Skipping error handling

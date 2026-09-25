/** Group Zod issues by dotted field path, the shape every form action returns. */
export function collectFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

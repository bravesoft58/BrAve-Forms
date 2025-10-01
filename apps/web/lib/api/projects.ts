/**
 * Projects API helpers for fetching data from backend GraphQL
 */

export async function fetchProjects(orgId: string) {
  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetProjects($orgId: String!) {
        projects(orgId: $orgId) { id name location }
      }`,
      variables: { orgId }
    })
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.projects;
}

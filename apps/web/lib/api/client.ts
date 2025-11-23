/**
 * Authenticated GraphQL API client for BrAve Forms
 *
 * Provides centralized authentication handling with Clerk JWT tokens.
 * All GraphQL requests MUST use this client to ensure proper authentication
 * and multi-tenant isolation.
 *
 * @security Requires Clerk JWT with orgId claim for multi-tenant data isolation
 * @offline Requests fail when offline (queued by TanStack Query for sync)
 */

interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

/**
 * Make authenticated GraphQL request
 *
 * @param request - GraphQL query and variables
 * @param token - Clerk JWT token (obtained from useAuth().getToken())
 * @returns Promise resolving to GraphQL response data
 * @throws {Error} If authentication fails (401)
 * @throws {Error} If authorization fails (403)
 * @throws {Error} If GraphQL errors occur
 *
 * @example
 * const { getToken } = useAuth();
 * const token = await getToken();
 * const data = await makeAuthenticatedRequest(
 *   { query: '...', variables: { ... } },
 *   token
 * );
 */
export async function makeAuthenticatedRequest<T = unknown>(
  request: GraphQLRequest,
  token: string | null
): Promise<T> {
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  // Handle HTTP errors
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    }
    throw new Error(`API request failed with status ${response.status}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  // Handle GraphQL errors
  if (json.errors && json.errors.length > 0) {
    const error = json.errors[0];
    throw new Error(error.message || 'GraphQL request failed');
  }

  if (!json.data) {
    throw new Error('No data returned from GraphQL request');
  }

  return json.data;
}

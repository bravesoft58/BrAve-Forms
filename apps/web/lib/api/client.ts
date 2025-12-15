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
  // Log request start for debugging
  const operationName = request.query.match(/(?:query|mutation)\s+(\w+)/)?.[1] || 'unknown';
  console.log(`[API] Starting ${operationName} request`);
  console.log(`[API] Variables:`, JSON.stringify(request.variables, null, 2));

  if (!token) {
    console.error('[API] No token provided - authentication required');
    throw new Error('Authentication required. Please sign in.');
  }
  console.log(`[API] Token present: ${token.substring(0, 20)}...`);

  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';
  console.log(`[API] Endpoint: ${endpoint}`);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    console.log(`[API] Response status: ${response.status} ${response.statusText}`);
  } catch (fetchError) {
    console.error('[API] Network error:', fetchError);
    throw new Error(
      `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
    );
  }

  // Handle HTTP errors
  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
      console.error(`[API] Error response body:`, errorBody);
    } catch {
      console.error('[API] Could not read error response body');
    }

    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    }
    throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
  }

  let json: GraphQLResponse<T>;
  try {
    const responseText = await response.text();
    console.log(`[API] Response body:`, responseText.substring(0, 500));
    json = JSON.parse(responseText);
  } catch (parseError) {
    console.error('[API] Failed to parse response:', parseError);
    throw new Error('Failed to parse API response');
  }

  // Handle GraphQL errors
  if (json.errors && json.errors.length > 0) {
    console.error('[API] GraphQL errors:', JSON.stringify(json.errors, null, 2));
    const error = json.errors[0];
    throw new Error(error.message || 'GraphQL request failed');
  }

  if (!json.data) {
    console.error('[API] No data in response:', json);
    throw new Error('No data returned from GraphQL request');
  }

  console.log(`[API] ${operationName} completed successfully`);
  return json.data;
}

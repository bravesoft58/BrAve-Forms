/**
 * Submissions API helpers for form submission
 */

export interface CreateSubmissionInput {
  templateId: string;
  data: Record<string, any>;
  status: 'draft' | 'submitted';
}

export interface SubmissionResponse {
  id: string;
  templateId: string;
  status: string;
  submittedAt?: string;
}

/**
 * Create a form submission
 */
export async function createSubmission(input: CreateSubmissionInput): Promise<SubmissionResponse> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation CreateFormSubmission($input: CreateFormSubmissionInput!) {
          createFormSubmission(input: $input) {
            id
            templateId
            status
            submittedAt
          }
        }
      `,
      variables: {
        input: {
          templateId: input.templateId,
          data: input.data,
          status: input.status,
        },
      },
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'Failed to create submission');
  }

  return json.data.createFormSubmission;
}

/**
 * Find submission by ID
 */
export async function findSubmissionById(id: string): Promise<any> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query GetSubmission($id: ID!) {
          submission(id: $id) {
            id
            templateId
            template {
              id
              name
              schema
            }
            data
            status
            submittedAt
            createdBy {
              id
              name
            }
          }
        }
      `,
      variables: { id },
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'Failed to fetch submission');
  }

  return json.data.submission;
}

/**
 * Find all submissions with filters
 */
export async function findAllSubmissions(params?: {
  filter?: {
    startDate?: string;
    endDate?: string;
    templateId?: string;
    status?: string;
  };
  search?: string;
  orderBy?: { [key: string]: 'asc' | 'desc' };
}): Promise<any[]> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query GetSubmissions($filter: SubmissionFilter, $search: String, $orderBy: SubmissionOrderBy) {
          submissions(filter: $filter, search: $search, orderBy: $orderBy) {
            id
            templateId
            template {
              id
              name
            }
            status
            submittedAt
            createdBy {
              id
              name
            }
          }
        }
      `,
      variables: {
        filter: params?.filter,
        search: params?.search,
        orderBy: params?.orderBy,
      },
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'Failed to fetch submissions');
  }

  return json.data.submissions || [];
}

/**
 * Copy yesterday's submission log
 */
export async function copyYesterdaysLog(templateId: string): Promise<SubmissionResponse> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation CopyYesterdaysLog($templateId: ID!) {
          copyYesterdaysLog(templateId: $templateId) {
            id
            templateId
            data
            status
            submittedAt
          }
        }
      `,
      variables: { templateId },
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Failed to copy yesterday's log");
  }

  return json.data.copyYesterdaysLog;
}

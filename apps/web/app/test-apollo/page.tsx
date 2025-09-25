'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { Button, Card, Text, Title, Stack, Alert, Code, Loader } from '@mantine/core';
import { useCurrentUser, useOrganizationData, useProjects } from '@/lib/apollo/hooks';

// Test introspection query
const INTROSPECTION_QUERY = gql`
  query IntrospectionQuery {
    __schema {
      types {
        name
        kind
      }
    }
  }
`;

// Simple health check query
const HEALTH_CHECK = gql`
  query HealthCheck {
    __type(name: "Query") {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
`;

export default function TestApolloPage() {
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});

  // Test basic connectivity
  const { data: healthData, loading: healthLoading, error: healthError } = useQuery(HEALTH_CHECK, {
    onCompleted: (data) => {
      setTestResults(prev => ({
        ...prev,
        healthCheck: { success: true, data: data.__type }
      }));
    },
    onError: (error) => {
      setTestResults(prev => ({
        ...prev,
        healthCheck: { success: false, error: error.message }
      }));
    },
  });

  // Test introspection
  const [runIntrospection, { data: introspectionData, loading: introspectionLoading }] = useLazyQuery(
    INTROSPECTION_QUERY,
    {
      onCompleted: (data) => {
        setTestResults(prev => ({
          ...prev,
          introspection: { 
            success: true, 
            typeCount: data.__schema.types.length,
            types: data.__schema.types.slice(0, 10) // First 10 types
          }
        }));
      },
      onError: (error) => {
        setTestResults(prev => ({
          ...prev,
          introspection: { success: false, error: error.message }
        }));
      },
    }
  );

  // Test custom hooks
  const { data: userData, loading: userLoading, error: userError } = useCurrentUser();
  const { organization, projects, loading: orgLoading } = useOrganizationData();
  const { data: projectsData, loading: projectsLoading, error: projectsError } = useProjects();

  return (
    <div className="container mx-auto px-4 py-8">
      <Title order={1} mb="xl">Apollo Client Integration Test</Title>
      
      <Stack gap="md">
        {/* Connection Status */}
        <Card withBorder>
          <Title order={3} mb="md">Connection Status</Title>
          <Stack gap="sm">
            <Alert 
              color={healthError ? 'red' : healthData ? 'green' : 'yellow'}
              title={healthError ? 'Connection Failed' : healthData ? 'Connected' : 'Connecting...'}
            >
              {healthLoading ? (
                <div className="flex items-center gap-2">
                  <Loader size="sm" />
                  <Text>Testing GraphQL connection...</Text>
                </div>
              ) : healthError ? (
                <Text>
                  Failed to connect to GraphQL endpoint: {healthError.message}
                  <br />
                  <Text size="sm" c="dimmed" mt="xs">
                    Make sure the backend is running on http://localhost:3002
                  </Text>
                </Text>
              ) : (
                <Text>Successfully connected to GraphQL endpoint!</Text>
              )}
            </Alert>
          </Stack>
        </Card>

        {/* Test Controls */}
        <Card withBorder>
          <Title order={3} mb="md">Test Controls</Title>
          <Stack gap="sm">
            <Button 
              onClick={() => runIntrospection()}
              loading={introspectionLoading}
              disabled={!!healthError}
            >
              Run Schema Introspection
            </Button>
          </Stack>
        </Card>

        {/* Test Results */}
        <Card withBorder>
          <Title order={3} mb="md">Test Results</Title>
          <Stack gap="md">
            
            {/* Health Check Results */}
            {testResults.healthCheck && (
              <div>
                <Text fw={500} mb="xs">Health Check:</Text>
                <Alert 
                  color={testResults.healthCheck.success ? 'green' : 'red'}
                  title={testResults.healthCheck.success ? 'Success' : 'Failed'}
                >
                  {testResults.healthCheck.success ? (
                    <Text>Query type has {testResults.healthCheck.data?.fields?.length || 0} available fields</Text>
                  ) : (
                    <Code>{testResults.healthCheck.error}</Code>
                  )}
                </Alert>
              </div>
            )}

            {/* Introspection Results */}
            {testResults.introspection && (
              <div>
                <Text fw={500} mb="xs">Schema Introspection:</Text>
                <Alert 
                  color={testResults.introspection.success ? 'green' : 'red'}
                  title={testResults.introspection.success ? 'Success' : 'Failed'}
                >
                  {testResults.introspection.success ? (
                    <div>
                      <Text>Found {testResults.introspection.typeCount} GraphQL types</Text>
                      <Text size="sm" c="dimmed" mt="xs">
                        Sample types: {testResults.introspection.types?.map((t: any) => t.name).join(', ')}...
                      </Text>
                    </div>
                  ) : (
                    <Code>{testResults.introspection.error}</Code>
                  )}
                </Alert>
              </div>
            )}

            {/* Custom Hooks Test */}
            <div>
              <Text fw={500} mb="xs">Custom Hooks Test:</Text>
              <Stack gap="xs">
                <Alert 
                  color={userError ? 'red' : userData ? 'green' : 'yellow'}
                  title="useCurrentUser"
                >
                  {userLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader size="sm" />
                      <Text>Loading user...</Text>
                    </div>
                  ) : userError ? (
                    <Text>Error: {userError.message}</Text>
                  ) : userData ? (
                    <Text>Success: User data loaded</Text>
                  ) : (
                    <Text>No user data (development mode)</Text>
                  )}
                </Alert>

                <Alert 
                  color={orgLoading ? 'yellow' : organization ? 'green' : 'gray'}
                  title="useOrganizationData"
                >
                  {orgLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader size="sm" />
                      <Text>Loading organization...</Text>
                    </div>
                  ) : organization ? (
                    <Text>Success: {organization.name} ({organization.type})</Text>
                  ) : (
                    <Text>No organization context (development mode)</Text>
                  )}
                </Alert>

                <Alert 
                  color={projectsError ? 'red' : projectsData ? 'green' : projectsLoading ? 'yellow' : 'gray'}
                  title="useProjects"
                >
                  {projectsLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader size="sm" />
                      <Text>Loading projects...</Text>
                    </div>
                  ) : projectsError ? (
                    <Text>Error: {projectsError.message}</Text>
                  ) : projectsData ? (
                    <Text>Success: Found {projectsData.projects.items.length} projects</Text>
                  ) : (
                    <Text>No projects data</Text>
                  )}
                </Alert>
              </Stack>
            </div>
          </Stack>
        </Card>

        {/* Apollo Client Info */}
        <Card withBorder>
          <Title order={3} mb="md">Apollo Client Configuration</Title>
          <Stack gap="sm">
            <Text><strong>GraphQL Endpoint:</strong> {process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3002/graphql'}</Text>
            <Text><strong>Cache Policy:</strong> cache-first (offline-first)</Text>
            <Text><strong>Retry Policy:</strong> 3 attempts with exponential backoff</Text>
            <Text><strong>Persistence:</strong> localStorage with 30-day retention</Text>
            <Text><strong>Development Mode:</strong> {process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}</Text>
          </Stack>
        </Card>

        {/* Backend Status */}
        <Card withBorder>
          <Title order={3} mb="md">Backend Status</Title>
          <Alert color="blue" title="Expected Services">
            <Stack gap="xs">
              <Text>• PostgreSQL (port 5434) - Database with TimescaleDB</Text>
              <Text>• Redis (port 6381) - Queue and caching</Text>
              <Text>• MinIO (port 9000) - File storage</Text>
              <Text>• NestJS API (port 3002) - GraphQL endpoint</Text>
            </Stack>
          </Alert>
        </Card>

        {/* Usage Instructions */}
        <Card withBorder>
          <Title order={3} mb="md">Next Steps</Title>
          <Stack gap="sm">
            <Text>1. Ensure backend is running: <Code>cd apps/backend && pnpm dev</Code></Text>
            <Text>2. Check Docker services: <Code>docker ps</Code></Text>
            <Text>3. Test GraphQL endpoint: <Code>curl http://localhost:3002/graphql</Code></Text>
            <Text>4. Use Apollo Client hooks in your components</Text>
            <Text>5. Monitor offline caching behavior</Text>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
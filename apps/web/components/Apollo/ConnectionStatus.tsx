'use client';

import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Alert, Badge, Text, Stack, Loader } from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';

// Simple connectivity test query
const CONNECTIVITY_TEST = gql`
  query ConnectivityTest {
    __type(name: "Query") {
      name
    }
  }
`;

interface ConnectionStatusProps {
  showDetails?: boolean;
}

export function ConnectionStatus({ showDetails = false }: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { data, loading, error, refetch } = useQuery(CONNECTIVITY_TEST, {
    fetchPolicy: 'network-only', // Always test actual connection
    errorPolicy: 'all',
    onCompleted: () => {
      setConnectionState('connected');
      setErrorMessage('');
    },
    onError: (err) => {
      setConnectionState('error');
      setErrorMessage(err.message);
    },
  });

  // Auto-retry connection every 30 seconds if failed
  useEffect(() => {
    if (connectionState === 'error') {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [connectionState, refetch]);

  // Simple badge version
  if (!showDetails) {
    return (
      <Badge
        color={connectionState === 'connected' ? 'green' : connectionState === 'error' ? 'red' : 'yellow'}
        variant="filled"
        leftSection={
          connectionState === 'connecting' ? (
            <Loader size={10} color="white" />
          ) : connectionState === 'connected' ? (
            <IconCheck size={12} />
          ) : (
            <IconX size={12} />
          )
        }
      >
        GraphQL {connectionState === 'connected' ? 'Online' : connectionState === 'error' ? 'Offline' : 'Connecting'}
      </Badge>
    );
  }

  // Detailed version
  return (
    <Alert
      color={connectionState === 'connected' ? 'green' : connectionState === 'error' ? 'red' : 'yellow'}
      title={
        <div className="flex items-center gap-2">
          {connectionState === 'connecting' ? (
            <IconClock size={16} />
          ) : connectionState === 'connected' ? (
            <IconCheck size={16} />
          ) : (
            <IconX size={16} />
          )}
          GraphQL Connection {connectionState === 'connected' ? 'Active' : connectionState === 'error' ? 'Failed' : 'Testing'}
        </div>
      }
    >
      <Stack gap="xs">
        {connectionState === 'connecting' && (
          <Text>Testing connection to GraphQL endpoint...</Text>
        )}
        
        {connectionState === 'connected' && (
          <Text>Successfully connected to the containerized GraphQL API</Text>
        )}
        
        {connectionState === 'error' && (
          <div>
            <Text>Failed to connect to GraphQL endpoint:</Text>
            <Text size="sm" c="dimmed" mt="xs">{errorMessage}</Text>
            <Text size="sm" c="dimmed" mt="xs">
              Auto-retrying every 30 seconds...
            </Text>
          </div>
        )}
        
        <Text size="sm" c="dimmed">
          Endpoint: {process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3002/graphql'}
        </Text>
      </Stack>
    </Alert>
  );
}
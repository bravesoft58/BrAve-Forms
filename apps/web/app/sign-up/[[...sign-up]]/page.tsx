import { SignUp } from '@clerk/nextjs';
import { Box, Container, Title, Text, Paper, Stack } from '@mantine/core';

export default function SignUpPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0c1929 100%)',
      }}
    >
      <Container size="xs">
        <Stack gap="lg" align="center">
          <div style={{ textAlign: 'center' }}>
            <Title order={1} c="white" mb="xs">
              BrAve Forms
            </Title>
            <Text c="gray.4" size="sm">
              Construction Compliance Management
            </Text>
          </div>

          <Paper
            shadow="xl"
            radius="md"
            p="xl"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <SignUp
              appearance={{
                elements: {
                  rootBox: {
                    width: '100%',
                  },
                  card: {
                    boxShadow: 'none',
                    border: 'none',
                  },
                },
              }}
            />
          </Paper>

          <Text c="gray.5" size="xs" ta="center">
            EPA and OSHA compliance made simple
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

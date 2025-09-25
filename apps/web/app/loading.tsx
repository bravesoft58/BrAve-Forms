import { Container, Loader, Stack, Text } from '@mantine/core';

export default function Loading() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg">
        <Loader size="lg" color="blue" />
        <Text c="dimmed" ta="center">
          Loading BrAve Forms...
        </Text>
      </Stack>
    </Container>
  );
}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create 2 organizations
  const acmeConstruction = await prisma.organization.upsert({
    where: { clerkOrgId: 'org_acme_construction_seed' },
    update: {},
    create: {
      clerkOrgId: 'org_acme_construction_seed',
      name: 'ACME Construction',
      plan: 'PROFESSIONAL',
    },
  });

  const buildCoLLC = await prisma.organization.upsert({
    where: { clerkOrgId: 'org_buildco_llc_seed' },
    update: {},
    create: {
      clerkOrgId: 'org_buildco_llc_seed',
      name: 'BuildCo LLC',
      plan: 'STARTER',
    },
  });

  console.log('Created organizations:', {
    acme: acmeConstruction.name,
    buildco: buildCoLLC.name,
  });

  // Create 4 projects (2 per organization)
  const acmeProject1 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      orgId: acmeConstruction.id,
      name: 'Downtown Office Complex',
      address: '123 Main St, San Francisco, CA 94102',
      latitude: 37.7749,
      longitude: -122.4194,
      disturbedAcres: 5.2,
      status: 'ACTIVE',
      bmps: [],
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-12-31'),
    },
  });

  const acmeProject2 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      orgId: acmeConstruction.id,
      name: 'Highway 101 Extension',
      address: 'Highway 101, Mile Marker 45, Palo Alto, CA 94301',
      latitude: 37.4419,
      longitude: -122.143,
      disturbedAcres: 12.8,
      status: 'ACTIVE',
      bmps: [],
      startDate: new Date('2025-02-01'),
      endDate: new Date('2026-06-30'),
    },
  });

  const buildcoProject1 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      orgId: buildCoLLC.id,
      name: 'Sunset Hills Residential',
      address: '456 Oak Ave, Los Angeles, CA 90001',
      latitude: 34.0522,
      longitude: -118.2437,
      disturbedAcres: 3.5,
      status: 'ACTIVE',
      bmps: [],
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-11-30'),
    },
  });

  const buildcoProject2 = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      orgId: buildCoLLC.id,
      name: 'Marina Bay Shopping Center',
      address: '789 Bay St, San Diego, CA 92101',
      latitude: 32.7157,
      longitude: -117.1611,
      disturbedAcres: 8.3,
      status: 'PLANNING',
      bmps: [],
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-03-31'),
    },
  });

  console.log('Created projects:', {
    acme: [acmeProject1.name, acmeProject2.name],
    buildco: [buildcoProject1.name, buildcoProject2.name],
  });

  // Create sample weather events for 0.25" threshold testing
  const weatherEvent1 = await prisma.weatherEvent.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      projectId: acmeProject1.id,
      eventDate: new Date('2025-09-28T14:30:00Z'),
      precipitationInches: 0.28, // Exceeds 0.25" threshold
      source: 'NOAA',
      inspectionDeadline: new Date('2025-09-29T14:30:00Z'), // 24 hours later
    },
  });

  const weatherEvent2 = await prisma.weatherEvent.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      projectId: buildcoProject1.id,
      eventDate: new Date('2025-09-29T08:15:00Z'),
      precipitationInches: 0.15, // Below 0.25" threshold
      source: 'NOAA',
      inspectionDeadline: new Date('2025-09-30T08:15:00Z'), // 24 hours later (but not triggered)
    },
  });

  console.log('Created weather events:', {
    event1: `${weatherEvent1.precipitationInches}" on ${weatherEvent1.eventDate}`,
    event2: `${weatherEvent2.precipitationInches}" on ${weatherEvent2.eventDate}`,
  });

  // Create sample inspection for EPA compliance testing
  const inspection1 = await prisma.inspection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      projectId: acmeProject1.id,
      orgId: acmeConstruction.id,
      inspectorId: 'inspector_john_smith',
      type: 'RAIN_EVENT',
      status: 'SUBMITTED',
      weatherTriggered: true, // Triggered by 0.28" precipitation
      precipitationInches: 0.28,
      inspectionDate: new Date('2025-09-29T10:00:00Z'),
      submittedAt: new Date('2025-09-29T11:30:00Z'),
      formData: {
        conditions: 'Cloudy, recent rain',
        bmpsInspected: ['silt fence', 'inlet protection'],
        notes: 'All BMPs in good condition after rain event',
      },
      violations: [],
      correctiveActions: [],
    },
  });

  console.log('Created inspection:', {
    id: inspection1.id,
    project: acmeProject1.name,
    rainTriggered: inspection1.weatherTriggered,
  });

  console.log('\nSeed completed successfully!');
  console.log('\nSummary:');
  console.log('- Organizations: 2 (ACME Construction, BuildCo LLC)');
  console.log('- Projects: 4 (2 per org)');
  console.log('- Weather Events: 2 (1 above threshold, 1 below)');
  console.log('- Inspections: 1 (rain-triggered compliance check)');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

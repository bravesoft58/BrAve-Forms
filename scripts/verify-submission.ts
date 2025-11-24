import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: '1d6ea652-147c-4770-92d2-d239e3048339' },
    include: {
      organization: true,
      template: true,
    },
  });

  console.log('Submission:', JSON.stringify(submission, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);

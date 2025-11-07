const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listRoutes() {
  const routes = await prisma.route.findMany({
    include: {
      trips: {
        select: {
          id: true,
          price: true,
          departureAt: true,
          arrivalAt: true
        }
      }
    }
  });
  console.log(JSON.stringify(routes, null, 2));
  await prisma.$disconnect();
}

listRoutes();

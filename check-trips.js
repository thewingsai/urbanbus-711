const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrips() {
  const trips = await prisma.trip.findMany({
    include: { route: true }
  });
  
  console.log(`Total trips: ${trips.length}\n`);
  
  trips.forEach(trip => {
    const depart = new Date(trip.departureAt);
    const arrive = new Date(trip.arrivalAt);
    const duration = (arrive - depart) / (1000 * 60 * 60); // hours
    
    console.log(`${trip.route.origin} → ${trip.route.destination}`);
    console.log(`  Depart: ${depart.toLocaleString()}`);
    console.log(`  Arrive: ${arrive.toLocaleString()}`);
    console.log(`  Duration: ${duration}h`);
    console.log(`  Price: ₹${trip.price / 100}`);
    console.log();
  });
  
  await prisma.$disconnect();
}

checkTrips();

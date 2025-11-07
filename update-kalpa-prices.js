const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Price mapping: old price -> new price (in rupees, will convert to paise)
const priceUpdates = {
  689: 1610,
  1219: 1830,
  1637: 2200,
  2390: 2050,
  3027: 2350,
  2027: 2560,
  1742: 1930
};

// Duration mapping: old duration -> new duration (in hours)
const durationUpdates = {
  '8h 15m': 16,
  '10h 0m': 16,
  '8h 45m': 16,
  '10h 45m': 16,
  '10h 30m': 16
};

async function updateKalpaDelhiPrices() {
  try {
    // Find all routes from Kalpa to Delhi
    const routes = await prisma.route.findMany({
      where: {
        OR: [
          { origin: { contains: 'Kalpa' } },
          { origin: { contains: 'Kinnaur' } },
          { origin: { contains: 'kalpa' } },
          { origin: { contains: 'kinnaur' } }
        ],
        destination: { contains: 'Delhi' }
      },
      include: {
        trips: true
      }
    });

    console.log(`Found ${routes.length} Kalpa/Kinnaur to Delhi routes`);

    for (const route of routes) {
      console.log(`\nProcessing route: ${route.origin} → ${route.destination}`);
      console.log(`Route has ${route.trips.length} trips`);

      for (const trip of route.trips) {
        const oldPriceRupees = Math.round(trip.price / 100);
        const newPriceRupees = priceUpdates[oldPriceRupees];

        if (newPriceRupees) {
          const newPricePaise = newPriceRupees * 100;
          
          console.log(`  Updating trip ${trip.id}: ₹${oldPriceRupees} → ₹${newPriceRupees}`);
          
          // Calculate new arrival time (16 hours from departure)
          const newArrivalAt = new Date(trip.departureAt);
          newArrivalAt.setHours(newArrivalAt.getHours() + 16);

          await prisma.trip.update({
            where: { id: trip.id },
            data: {
              price: newPricePaise,
              arrivalAt: newArrivalAt
            }
          });
          
          console.log(`  ✓ Updated successfully`);
        } else {
          console.log(`  Skipping trip ${trip.id} (₹${oldPriceRupees} - no mapping)`);
        }
      }
    }

    console.log('\n✅ All price updates completed!');
  } catch (error) {
    console.error('❌ Error updating prices:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateKalpaDelhiPrices();

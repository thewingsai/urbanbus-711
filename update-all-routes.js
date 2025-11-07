const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Route data with realistic durations (in hours) and prices (in rupees)
// Based on typical distances and travel times from Himachal to Delhi/Chandigarh
const routeUpdates = {
  'Kalpa': {
    'Delhi': { duration: 16, prices: [1610, 1830, 2200, 2050, 2350, 2560, 1930] },
    'Chandigarh': { duration: 11.5, prices: [1220, 1350, 1580, 1420, 1650, 1800, 1500] }
  },
  'Kinnaur': {
    'Delhi': { duration: 16, prices: [1610, 1830, 2200, 2050, 2350, 2560, 1930] },
    'Chandigarh': { duration: 11.5, prices: [1220, 1350, 1580, 1420, 1650, 1800, 1500] }
  },
  'Spiti Valley': {
    'Delhi': { duration: 18, prices: [2100, 2300, 2550, 2400, 2700, 2900, 2500] },
    'Chandigarh': { duration: 14, prices: [1650, 1800, 2050, 1900, 2200, 2400, 2000] }
  },
  'McLeod Ganj': {
    'Delhi': { duration: 10, prices: [1200, 1350, 1550, 1420, 1650, 1780, 1500] },
    'Chandigarh': { duration: 6, prices: [1200, 1320, 1480, 1380, 1560, 1650, 1420] }
  },
  'Manali': {
    'Delhi': { duration: 14, prices: [1450, 1620, 1850, 1720, 1980, 2150, 1800] },
    'Chandigarh': { duration: 9, prices: [1250, 1380, 1580, 1450, 1680, 1820, 1520] }
  },
  'Dharamshala': {
    'Delhi': { duration: 10, prices: [1200, 1350, 1550, 1420, 1650, 1780, 1500] },
    'Chandigarh': { duration: 6, prices: [1200, 1320, 1480, 1380, 1560, 1650, 1420] }
  }
};

async function updateAllRoutes() {
  try {
    console.log('🔄 Updating all routes with realistic durations and prices...\n');

    // Get all routes
    const routes = await prisma.route.findMany({
      include: {
        trips: {
          orderBy: { departureAt: 'asc' }
        }
      }
    });

    console.log(`Found ${routes.length} routes in database\n`);

    for (const route of routes) {
      console.log(`\n📍 Processing: ${route.origin} → ${route.destination}`);
      
      // Find matching route data
      let routeData = null;
      for (const [origin, destinations] of Object.entries(routeUpdates)) {
        if (route.origin.includes(origin)) {
          for (const [dest, data] of Object.entries(destinations)) {
            if (route.destination.includes(dest)) {
              routeData = data;
              break;
            }
          }
        }
      }

      if (!routeData) {
        console.log(`  ⚠️  No update data found, skipping...`);
        continue;
      }

      console.log(`  Duration: ${routeData.duration}h`);
      console.log(`  Prices: ₹${routeData.prices.join(', ₹')}`);

      // Update trips
      for (let i = 0; i < route.trips.length && i < routeData.prices.length; i++) {
        const trip = route.trips[i];
        const newPrice = routeData.prices[i];
        
        // Calculate new arrival time
        const departureAt = new Date(trip.departureAt);
        const arrivalAt = new Date(departureAt);
        arrivalAt.setHours(arrivalAt.getHours() + Math.floor(routeData.duration));
        arrivalAt.setMinutes(arrivalAt.getMinutes() + ((routeData.duration % 1) * 60));

        await prisma.trip.update({
          where: { id: trip.id },
          data: {
            price: newPrice * 100, // Convert to paise
            arrivalAt: arrivalAt
          }
        });

        console.log(`    ✓ Trip ${i + 1}: ₹${newPrice}, ${routeData.duration}h`);
      }

      // Update operator name for all trips
      const trips = await prisma.trip.findMany({
        where: { routeId: route.id },
        include: { bus: true }
      });

      for (const trip of trips) {
        await prisma.bus.update({
          where: { id: trip.busId },
          data: {
            regNumber: 'HP-UrbanBus-Express'
          }
        });
      }
    }

    // Update operator name
    const operators = await prisma.operator.findMany();
    for (const operator of operators) {
      await prisma.operator.update({
        where: { id: operator.id },
        data: { name: 'UrbanBus Express' }
      });
    }

    console.log('\n\n✅ All routes updated successfully!');
    console.log('\nSummary:');
    console.log('- All prices are now ≥ ₹1200');
    console.log('- Durations updated to realistic travel times');
    console.log('- Operator: UrbanBus Express');

  } catch (error) {
    console.error('❌ Error updating routes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAllRoutes();

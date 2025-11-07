const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const routesToAdd = [
  {
    origin: 'Kalpa (Kinnaur)',
    destination: 'Chandigarh',
    duration: 11.5,
    prices: [1220, 1350, 1580, 1420, 1650, 1800, 1500]
  },
  {
    origin: 'Spiti Valley',
    destination: 'Delhi',
    duration: 18,
    prices: [2100, 2300, 2550, 2400, 2700, 2900, 2500]
  },
  {
    origin: 'Spiti Valley',
    destination: 'Chandigarh',
    duration: 14,
    prices: [1650, 1800, 2050, 1900, 2200, 2400, 2000]
  },
  {
    origin: 'McLeod Ganj',
    destination: 'Delhi',
    duration: 10,
    prices: [1200, 1350, 1550, 1420, 1650, 1780, 1500]
  },
  {
    origin: 'McLeod Ganj',
    destination: 'Chandigarh',
    duration: 6,
    prices: [1200, 1320, 1480, 1380, 1560, 1650, 1420]
  },
  {
    origin: 'Manali',
    destination: 'Delhi',
    duration: 14,
    prices: [1450, 1620, 1850, 1720, 1980, 2150, 1800]
  },
  {
    origin: 'Manali',
    destination: 'Chandigarh',
    duration: 9,
    prices: [1250, 1380, 1580, 1450, 1680, 1820, 1520]
  },
  {
    origin: 'Kinnaur',
    destination: 'Delhi',
    duration: 16,
    prices: [1610, 1830, 2200, 2050, 2350, 2560, 1930]
  },
  {
    origin: 'Kinnaur',
    destination: 'Chandigarh',
    duration: 11.5,
    prices: [1220, 1350, 1580, 1420, 1650, 1800, 1500]
  }
];

async function addAllRoutes() {
  try {
    console.log('🚌 Adding all routes to database...\n');

    // Get or create operator
    let operator = await prisma.operator.findFirst();
    if (!operator) {
      operator = await prisma.operator.create({
        data: {
          name: 'UrbanBus Express',
          phone: '+91-9876543210',
          email: 'contact@urbanbus.co.in'
        }
      });
      console.log('✓ Created operator: UrbanBus Express\n');
    }

    // Get or create bus
    let bus = await prisma.bus.findFirst();
    if (!bus) {
      bus = await prisma.bus.create({
        data: {
          operatorId: operator.id,
          regNumber: 'HP-UrbanBus-Express',
          capacity: 40,
          amenities: 'AC,WiFi,Charging Points,Water Bottle'
        }
      });
      console.log('✓ Created bus: HP-UrbanBus-Express\n');
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    for (const routeData of routesToAdd) {
      // Check if route already exists
      const existingRoute = await prisma.route.findFirst({
        where: {
          origin: routeData.origin,
          destination: routeData.destination
        }
      });

      if (existingRoute) {
        console.log(`⏭️  Route already exists: ${routeData.origin} → ${routeData.destination}`);
        continue;
      }

      console.log(`\n📍 Adding: ${routeData.origin} → ${routeData.destination}`);
      console.log(`   Duration: ${routeData.duration}h`);
      console.log(`   Prices: ₹${routeData.prices.join(', ₹')}`);

      // Create route
      const route = await prisma.route.create({
        data: {
          origin: routeData.origin,
          destination: routeData.destination,
          active: true
        }
      });

      // Create trips
      const times = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      
      for (let i = 0; i < routeData.prices.length; i++) {
        const [hours, minutes] = times[i].split(':').map(Number);
        
        const departureAt = new Date(tomorrow);
        departureAt.setHours(hours, minutes, 0, 0);
        
        const arrivalAt = new Date(departureAt);
        arrivalAt.setHours(arrivalAt.getHours() + Math.floor(routeData.duration));
        arrivalAt.setMinutes(arrivalAt.getMinutes() + ((routeData.duration % 1) * 60));

        await prisma.trip.create({
          data: {
            routeId: route.id,
            busId: bus.id,
            departureAt: departureAt,
            arrivalAt: arrivalAt,
            price: routeData.prices[i] * 100,
            seatsTotal: 40,
            seatsAvailable: 40
          }
        });
      }

      console.log(`   ✓ Added ${routeData.prices.length} trips`);
    }

    console.log('\n\n✅ All routes added successfully!');
    
    // Show summary
    const allRoutes = await prisma.route.findMany({
      include: {
        _count: {
          select: { trips: true }
        }
      }
    });

    console.log('\n📊 Database Summary:');
    console.log(`Total Routes: ${allRoutes.length}`);
    allRoutes.forEach(r => {
      console.log(`  • ${r.origin} → ${r.destination} (${r._count.trips} trips)`);
    });

  } catch (error) {
    console.error('❌ Error adding routes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addAllRoutes();

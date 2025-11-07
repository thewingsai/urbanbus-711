const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedKalpaRoutes() {
  try {
    console.log('🌱 Seeding Kalpa to Delhi routes...\n');

    // 1. Create Operator
    const operator = await prisma.operator.create({
      data: {
        name: 'UrbanBus Himachal',
        phone: '+91-9876543210',
        email: 'himachal@urbanbus.co.in'
      }
    });
    console.log('✓ Created operator:', operator.name);

    // 2. Create Bus
    const bus = await prisma.bus.create({
      data: {
        operatorId: operator.id,
        regNumber: 'HP-01-AB-1234',
        capacity: 40,
        amenities: 'AC,WiFi,Charging Points,Water Bottle'
      }
    });
    console.log('✓ Created bus:', bus.regNumber);

    // 3. Create Route
    const route = await prisma.route.create({
      data: {
        origin: 'Kalpa (Kinnaur)',
        destination: 'Delhi',
        active: true
      }
    });
    console.log('✓ Created route:', route.origin, '→', route.destination);

    // 4. Create Trips with updated prices (all 16 hours duration)
    const trips = [
      { price: 1610, time: '06:00' },
      { price: 1830, time: '08:00' },
      { price: 2200, time: '10:00' },
      { price: 2050, time: '12:00' },
      { price: 2350, time: '14:00' },
      { price: 2560, time: '16:00' },
      { price: 1930, time: '18:00' }
    ];

    console.log('\nCreating trips with updated prices:');
    
    // Get tomorrow's date for the trips
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    for (const trip of trips) {
      const [hours, minutes] = trip.time.split(':').map(Number);
      
      // Set departure time
      const departureAt = new Date(tomorrow);
      departureAt.setHours(hours, minutes, 0, 0);
      
      // Set arrival time (16 hours later)
      const arrivalAt = new Date(departureAt);
      arrivalAt.setHours(arrivalAt.getHours() + 16);

      const createdTrip = await prisma.trip.create({
        data: {
          routeId: route.id,
          busId: bus.id,
          departureAt: departureAt,
          arrivalAt: arrivalAt,
          price: trip.price * 100, // Convert to paise
          seatsTotal: 40,
          seatsAvailable: 40
        }
      });

      console.log(`  ✓ Trip at ${trip.time}: ₹${trip.price}, 16h duration`);
    }

    console.log('\n✅ Successfully seeded Kalpa to Delhi routes!');
    console.log('\nSummary:');
    console.log('- Operator: UrbanBus Himachal');
    console.log('- Route: Kalpa (Kinnaur) → Delhi');
    console.log('- Trips: 7 trips for tomorrow');
    console.log('- Prices: ₹1610, ₹1830, ₹2200, ₹2050, ₹2350, ₹2560, ₹1930');
    console.log('- Duration: All 16 hours');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedKalpaRoutes();

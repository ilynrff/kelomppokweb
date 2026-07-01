const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  const existingCourts = await prisma.court.findMany();
  
  if (existingCourts.length === 0) {
    console.log("No existing courts found.");
    return;
  }

  // Check if any venue exists, to avoid double run
  const existingVenues = await prisma.venue.findMany();
  if (existingVenues.length > 0) {
    console.log("Venues already exist. Aborting to prevent duplicates.");
    return;
  }

  console.log(`Found ${existingCourts.length} existing courts. Migrating...`);

  for (const c of existingCourts) {
    let slug = generateSlug(c.name);
    
    // Check slug uniqueness
    let isUnique = false;
    let counter = 1;
    let finalSlug = slug;
    while(!isUnique) {
      const exists = await prisma.venue.findUnique({ where: { slug: finalSlug } });
      if (!exists) {
        isUnique = true;
      } else {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
    }

    // 1. Create Venue
    const venue = await prisma.venue.create({
      data: {
        name: c.name,
        slug: finalSlug,
        location: c.location,
        description: c.description,
        thumbnail: Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null,
      }
    });

    console.log(`Created Venue: ${venue.name} (${venue.slug})`);

    // 2. Update existing Court to "Court 1" and link to Venue
    await prisma.court.update({
      where: { id: c.id },
      data: {
        venueId: venue.id,
        name: "Court 1",
        type: c.name,
      }
    });

    console.log(`Updated existing court ${c.id} to "Court 1" in Venue ${venue.name}`);

    // 3. Create a new "Court 2"
    await prisma.court.create({
      data: {
        venueId: venue.id,
        name: "Court 2",
        type: c.name,
        location: c.location,
        pricePerHour: c.pricePerHour,
        images: c.images,
        description: c.description,
      }
    });

    console.log(`Created new "Court 2" in Venue ${venue.name}`);
  }

  console.log("Migration complete!");
}

run().catch(console.error).finally(() => prisma.$disconnect());

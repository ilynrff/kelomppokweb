import 'dotenv/config';
import { prisma } from './src/lib/prisma';

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  const existingCourts = await prisma.court.findMany();
  
  if (existingCourts.length === 0) {
    console.log("No existing courts found.");
    return;
  }

  const existingVenues = await prisma.venue.findMany();
  if (existingVenues.length > 0) {
    console.log("Venues already exist. Aborting to prevent duplicates.");
    return;
  }

  console.log(`Found ${existingCourts.length} existing courts. Migrating...`);

  for (const c of existingCourts) {
    let slug = generateSlug(c.name);
    
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

    let thumbUrl = null;
    if (Array.isArray(c.images) && c.images.length > 0) {
      const img = c.images[0] as any;
      thumbUrl = typeof img === 'string' ? img : (img.url || null);
    }

    const venue = await prisma.venue.create({
      data: {
        name: c.name,
        slug: finalSlug,
        location: c.location,
        description: c.description,
        thumbnail: thumbUrl,
      }
    });

    console.log(`Created Venue: ${venue.name} (${venue.slug})`);

    await prisma.court.update({
      where: { id: c.id },
      data: {
        venueId: venue.id,
        name: "Court 1",
        type: c.name,
      }
    });

    console.log(`Updated existing court ${c.id} to "Court 1" in Venue ${venue.name}`);

    await prisma.court.create({
      data: {
        venueId: venue.id,
        name: "Court 2",
        type: c.name,
        location: c.location,
        pricePerHour: c.pricePerHour,
        images: c.images || [],
        description: c.description,
      }
    });

    console.log(`Created new "Court 2" in Venue ${venue.name}`);
  }

  console.log("Migration complete!");
}

run().catch(console.error).finally(() => process.exit(0));

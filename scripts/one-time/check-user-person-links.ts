import { prisma } from "../src/infrastructure/database/prisma/client";

async function checkUserPersonLinks() {
  try {
    console.log("Checking User-Person linkage...\n");

    const users = await prisma.user.findMany({
      include: { person: true },
    });

    console.log(`Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log("No users found in database.");
      return;
    }

    users.forEach((user) => {
      console.log(`User: ${user.email || user.id}`);
      console.log(`  - Name: ${user.name || "N/A"}`);
      console.log(`  - Email Verified: ${user.emailVerified ? "Yes" : "No"}`);
      console.log(`  - Person Linked: ${user.person ? "✅ Yes" : "❌ No"}`);
      if (user.person) {
        console.log(
          `  - Person Name: ${user.person.firstName} ${user.person.lastName}`,
        );
        console.log(`  - Person ID: ${user.person.id}`);
      }
      console.log("");
    });

    const usersWithoutPerson = users.filter((u) => !u.person);
    console.log(`Users WITHOUT Person: ${usersWithoutPerson.length}`);

    const persons = await prisma.person.findMany({
      where: { userId: null },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    console.log(`\nPersons WITHOUT User: ${persons.length}`);
    if (persons.length > 0) {
      persons.slice(0, 5).forEach((p) => {
        console.log(`  - ${p.firstName} ${p.lastName} (${p.email})`);
      });
      if (persons.length > 5) {
        console.log(`  ... and ${persons.length - 5} more`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPersonLinks();

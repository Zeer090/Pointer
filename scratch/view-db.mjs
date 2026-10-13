import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Delete the bad record created previously
const del = await prisma.aspiration.deleteMany({
  where: {
    message: "saya mau mengajukan aspirasi dong"
  }
});
console.log("Deleted old premature junk aspirations:", del.count);

// Also delete test record if still present
await prisma.aspiration.deleteMany({
  where: {
    student_name: "Muhammad Rizki"
  }
});

const list = await prisma.aspiration.findMany({ take: 5, orderBy: { id: "desc" } });
console.log("Current clean aspirations:");
console.log(JSON.stringify(list, null, 2));
await prisma.$disconnect();

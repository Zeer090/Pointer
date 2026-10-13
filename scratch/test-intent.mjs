import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const startCount = await prisma.aspiration.count();

  // Test 1: User says 'saya mau mengajukan aspirasi dong'
  const res1 = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "saya mau mengajukan aspirasi dong",
      context: { user: { name: "Muhammad Rizki", role: "mahasiswa" } },
    }),
  });
  const data1 = await res1.json();
  const countAfter1 = await prisma.aspiration.count();
  console.log("--- TEST 1: Intent-only phrase ---");
  console.log("Action Executed:", data1.actionExecuted ? "YES (FAIL)" : "NONE (PASS)");
  console.log("Database Count Diff:", countAfter1 - startCount, countAfter1 === startCount ? "(PASS: 0 records added)" : "(FAIL)");
  console.log("Reply Snippet:", data1.reply.substring(0, 120).replace(/\n/g, " "));

  // Test 2: User sends real aspiration
  const res2 = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Saya mau mengajukan aspirasi fasilitas: Stopkontak di lab 2 lantai 3 rusak, mohon diperbaiki",
      context: { user: { name: "Muhammad Rizki", role: "mahasiswa" } },
    }),
  });
  const data2 = await res2.json();
  const countAfter2 = await prisma.aspiration.count();
  const latestAsp = await prisma.aspiration.findFirst({ orderBy: { id: "desc" } });
  console.log("\n--- TEST 2: Real substantive aspiration ---");
  console.log("Action Executed:", data2.actionExecuted?.type);
  console.log("Record Student Name in DB:", latestAsp.student_name, latestAsp.student_name === "Muhammad Rizki" ? "(PASS: Logged in username used!)" : "(FAIL)");
  console.log("Database Count Diff:", countAfter2 - countAfter1);

  // Clean up test entry
  if (latestAsp && latestAsp.student_name === "Muhammad Rizki") {
    await prisma.aspiration.delete({ where: { id: latestAsp.id } });
    console.log("Cleaned up test aspiration entry.");
  }

  await prisma.$disconnect();
}

run();

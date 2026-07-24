import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.note.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.call.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.dialSession.deleteMany();
  await prisma.prospect.deleteMany();

  const prospects = [
    {
      businessName: "Maple Street Elementary",
      ownerName: "Denise Carver",
      phone: "+15555550101",
      industry: "Education",
      addressLine1: "482 Maple Street",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      relationshipStatus: "WARM" as const,
      script: "Open with teacher retention angle. Ask about payroll meeting timing before pitching group benefits.",
      quickFacts: "Mentioned teacher retention is a top priority. Daughter is graduating this spring. Wants a proposal after the payroll meeting.",
      lastContactedAt: new Date("2026-07-17T15:00:00Z"),
      notes: [
        "Mentioned teacher retention",
        "Wants proposal after payroll meeting",
        "Daughter graduating",
        "Loves helping employees",
      ],
      timeline: [
        { type: "COLD_CALL" as const, label: "Cold Call", occurredAt: new Date("2026-07-10T14:00:00Z") },
        { type: "FOLLOW_UP_CALL" as const, label: "Follow-up", occurredAt: new Date("2026-07-17T15:00:00Z") },
      ],
    },
    {
      businessName: "Riverside Auto Repair",
      ownerName: "Marcus Ibe",
      phone: "+15555550102",
      industry: "Automotive",
      addressLine1: "119 Riverside Dr",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      relationshipStatus: "COLD" as const,
      script: "Lead with workers' comp cost angle for shop owners. Keep it under 60 seconds.",
      quickFacts: "Family-owned, 8 employees. Never contacted before.",
      lastContactedAt: null,
      notes: [],
      timeline: [],
    },
    {
      businessName: "Harborview Dental",
      ownerName: "Dr. Priya Shah",
      phone: "+15555550103",
      industry: "Healthcare",
      addressLine1: "77 Harbor Ave",
      city: "Springfield",
      state: "IL",
      zip: "62702",
      relationshipStatus: "FOLLOW_UP" as const,
      script: "Reference last quote on group dental/vision bundle. Ask if she reviewed it with her office manager.",
      quickFacts: "Requested a formal quote on 7/12. Office manager is the real decision-maker.",
      lastContactedAt: new Date("2026-07-12T18:30:00Z"),
      notes: ["Sent quote on group dental/vision bundle", "Office manager (Renee) makes final call"],
      timeline: [
        { type: "COLD_CALL" as const, label: "Cold Call", occurredAt: new Date("2026-07-01T13:00:00Z") },
        { type: "QUOTE" as const, label: "Quote Sent", occurredAt: new Date("2026-07-12T18:30:00Z") },
      ],
    },
    {
      businessName: "Founders Coffee Roasters",
      ownerName: "Alan Whitfield",
      phone: "+15555550104",
      industry: "Food & Beverage",
      addressLine1: "22 Founders Way",
      city: "Springfield",
      state: "IL",
      zip: "62703",
      relationshipStatus: "COLD" as const,
      script: "New roastery, growing fast. Ask about coverage for the new second location.",
      quickFacts: "Opened a second location last month. 14 employees across both.",
      lastContactedAt: null,
      notes: [],
      timeline: [],
    },
    {
      businessName: "Blue Ridge Landscaping",
      ownerName: "Tom Weller",
      phone: "+15555550105",
      industry: "Landscaping",
      addressLine1: "900 Ridge Rd",
      city: "Chatham",
      state: "IL",
      zip: "62629",
      relationshipStatus: "WARM" as const,
      script: "Seasonal business — ask how staffing looks heading into fall layoffs. Bring up disability coverage.",
      quickFacts: "Owner is a former client's brother, warm referral. Mentioned crew injuries last season.",
      lastContactedAt: new Date("2026-07-20T16:00:00Z"),
      notes: ["Referred by Denise Carver", "Had two crew injuries last season, interested in disability coverage"],
      timeline: [
        { type: "COLD_CALL" as const, label: "Cold Call", occurredAt: new Date("2026-07-20T16:00:00Z") },
      ],
    },
    {
      businessName: "Lakeside Veterinary Clinic",
      ownerName: "Dr. Nina Okafor",
      phone: "+15555550106",
      industry: "Veterinary",
      addressLine1: "310 Lakeside Blvd",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      relationshipStatus: "CLIENT" as const,
      script: "Annual policy review is due. Ask about adding the new associate vet to the group plan.",
      quickFacts: "Existing client since March. Hired a new associate vet in June.",
      lastContactedAt: new Date("2026-06-30T12:00:00Z"),
      notes: ["Existing group policy, annual review coming up", "New associate vet needs to be added"],
      timeline: [
        { type: "COLD_CALL" as const, label: "Cold Call", occurredAt: new Date("2026-02-14T13:00:00Z") },
        { type: "APPOINTMENT" as const, label: "Appointment", occurredAt: new Date("2026-02-21T15:00:00Z") },
        { type: "PROPOSAL" as const, label: "Proposal", occurredAt: new Date("2026-03-01T15:00:00Z") },
        { type: "BECAME_CLIENT" as const, label: "Became Client", occurredAt: new Date("2026-03-10T15:00:00Z") },
        { type: "POLICY_REVIEW" as const, label: "Policy Review", occurredAt: new Date("2026-06-30T12:00:00Z") },
      ],
    },
    {
      businessName: "Prairie Wind Brewing Co.",
      ownerName: "Jake Sorensen",
      phone: "+15555550107",
      industry: "Food & Beverage",
      addressLine1: "48 Prairie Wind Ln",
      city: "Springfield",
      state: "IL",
      zip: "62711",
      relationshipStatus: "COLD" as const,
      script: "Craft brewery, 20+ staff. Ask about current group benefits provider and renewal timing.",
      quickFacts: "No prior contact. Found via Chamber of Commerce list.",
      lastContactedAt: null,
      notes: [],
      timeline: [],
    },
    {
      businessName: "Summit Peak Roofing",
      ownerName: "Carla Duncan",
      phone: "+15555550108",
      industry: "Construction",
      addressLine1: "615 Summit Ave",
      city: "Chatham",
      state: "IL",
      zip: "62629",
      relationshipStatus: "DO_NOT_CALL" as const,
      script: "",
      quickFacts: "Asked to be removed from call list on 6/2.",
      lastContactedAt: new Date("2026-06-02T14:00:00Z"),
      notes: ["Requested do-not-call on 6/2/26"],
      timeline: [],
    },
  ];

  for (const p of prospects) {
    const { notes, timeline, ...prospectData } = p;
    await prisma.prospect.create({
      data: {
        ...prospectData,
        notes: { create: notes.map((content) => ({ content })) },
        timelineEvents: { create: timeline },
      },
    });
  }

  console.log(`Seeded ${prospects.length} prospects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

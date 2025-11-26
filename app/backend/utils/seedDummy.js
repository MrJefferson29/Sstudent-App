const Contest = require('../models/Contest');
const Contestant = require('../models/Contestant');
const User = require('../models/User');

async function seedDummyDataIfEmpty() {
  try {
    const existingContests = await Contest.countDocuments();
    const existingContestants = await Contestant.countDocuments();

    if (existingContests > 0 && existingContestants > 0) {
      console.log('[Seed] Contests and contestants already exist. Skipping seeding.');
      return;
    }

    console.log('[Seed] Seeding dummy contests and contestants...');

    // Ensure there is at least one admin user for createdBy reference
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Seed Admin',
        email: 'seed-admin@example.com',
        password: 'Password123!',
        role: 'admin',
        profileCompleted: true,
      });
      console.log('[Seed] Created fallback admin user seed-admin@example.com / Password123!');
    }

    const contests = [
      {
        name: 'Mr. University of Bamenda',
        description: 'Vote for the most outstanding male student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        name: 'Miss University of Bamenda',
        description: 'Vote for the most outstanding female student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        name: 'Best Dressed Student',
        description: 'Vote for the best dressed student on campus',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
      {
        name: 'Most Talented Student',
        description: 'Vote for the most talented student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id,
      },
    ];

    const createdContests = await Contest.insertMany(contests);

    const contestantsData = [
      // Mr. University contestants
      [
        { name: 'John Doe', bio: 'Computer Science student, passionate about technology and innovation' },
        { name: 'Michael Smith', bio: 'Engineering student with leadership qualities' },
        { name: 'David Johnson', bio: 'Business Administration student, entrepreneur at heart' },
        { name: 'Robert Brown', bio: 'Medical student dedicated to healthcare' },
      ],
      // Miss University contestants
      [
        { name: 'Jane Smith', bio: 'Arts student with creative talents' },
        { name: 'Emily Davis', bio: 'Science student passionate about research' },
        { name: 'Sarah Wilson', bio: 'Law student with strong advocacy skills' },
        { name: 'Lisa Anderson', bio: 'Education student focused on teaching excellence' },
      ],
      // Best Dressed contestants
      [
        { name: 'Alex Thompson', bio: 'Fashion design student with impeccable style' },
        { name: 'Chris Martinez', bio: 'Business student known for elegant attire' },
        { name: 'Jordan Lee', bio: 'Arts student with unique fashion sense' },
        { name: 'Taylor Garcia', bio: 'Communications student with trendy style' },
      ],
      // Most Talented contestants
      [
        { name: 'Sam Parker', bio: 'Music and performing arts student' },
        { name: 'Casey Taylor', bio: 'Sports and athletics enthusiast' },
        { name: 'Morgan White', bio: 'Dance and choreography student' },
        { name: 'Riley Clark', bio: 'Creative writing and poetry talent' },
      ],
    ];

    for (let i = 0; i < createdContests.length; i++) {
      const contest = createdContests[i];
      const contestants = contestantsData[i] || [];
      for (const contestantData of contestants) {
        await Contestant.create({ contest: contest._id, ...contestantData });
      }
    }

    console.log('[Seed] Dummy data seeded successfully.');
  } catch (e) {
    console.error('[Seed] Error seeding dummy data:', e);
  }
}

module.exports = { seedDummyDataIfEmpty };
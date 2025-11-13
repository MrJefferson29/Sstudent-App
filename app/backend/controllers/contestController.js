const Contest = require('../models/Contest');
const Contestant = require('../models/Contestant');
const Vote = require('../models/Vote');

exports.getContests = async (req, res) => {
  try {
    const contests = await Contest.find({}).sort({ isActive: -1, createdAt: -1 });
    res.json({ success: true, data: contests });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching contests', error: e.message });
  }
};

exports.getContestants = async (req, res) => {
  try {
    const { contestId } = req.params;
    const contestants = await Contestant.find({ contest: contestId }).sort({ createdAt: -1 });

    // Get vote counts for each contestant
    const contestantsWithVotes = await Promise.all(
      contestants.map(async (contestant) => {
        const voteCount = await Vote.countDocuments({ contest: contestId, contestant: contestant._id });
        return {
          ...contestant.toObject(),
          voteCount,
        };
      })
    );

    res.json({ success: true, data: contestantsWithVotes });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching contestants', error: e.message });
  }
};

// Admin: create contest
exports.createContest = async (req, res) => {
  try {
    const { name, description, startAt, endAt, isActive } = req.body;
    const contest = await Contest.create({ name, description, startAt, endAt, isActive });
    res.status(201).json({ success: true, data: contest });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error creating contest', error: e.message });
  }
};

// Admin: add contestant
exports.addContestant = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { name, bio } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    const contestant = await Contestant.create({ contest: contestId, name, bio, image });
    res.status(201).json({ success: true, data: contestant });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error adding contestant', error: e.message });
  }
};

// Get contest statistics
exports.getContestStats = async (req, res) => {
  try {
    const { contestId } = req.params;

    // Get total votes for the contest
    const totalVotes = await Vote.countDocuments({ contest: contestId });

    // Get vote distribution by contestant
    const voteStats = await Vote.aggregate([
      { $match: { contest: require('mongoose').Types.ObjectId(contestId) } },
      {
        $group: {
          _id: '$contestant',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'contestants',
          localField: '_id',
          foreignField: '_id',
          as: 'contestant'
        }
      },
      { $unwind: '$contestant' },
      {
        $project: {
          contestantName: '$contestant.name',
          votes: '$count'
        }
      },
      { $sort: { votes: -1 } }
    ]);

    // Get total contestants
    const totalContestants = await Contestant.countDocuments({ contest: contestId });

    res.json({
      success: true,
      data: {
        totalVotes,
        totalContestants,
        voteDistribution: voteStats
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching contest stats', error: e.message });
  }
};

// Seed dummy data for contests and contestants
exports.seedDummyData = async (req, res) => {
  try {
    // Create contests
    const contests = [
      {
        name: 'Mr. University of Bamenda',
        description: 'Vote for the most outstanding male student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        name: 'Miss University of Bamenda',
        description: 'Vote for the most outstanding female student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Best Dressed Student',
        description: 'Vote for the best dressed student on campus',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Most Talented Student',
        description: 'Vote for the most talented student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    ];

    const createdContests = await Contest.insertMany(contests);

    // Create contestants for each contest
    const contestantsData = [
      // Mr. University contestants
      [
        { name: 'John Doe', bio: 'Computer Science student, passionate about technology and innovation', image: '/uploads/contestant1.jpg' },
        { name: 'Michael Smith', bio: 'Engineering student with leadership qualities', image: '/uploads/contestant2.jpg' },
        { name: 'David Johnson', bio: 'Business Administration student, entrepreneur at heart', image: '/uploads/contestant3.jpg' },
        { name: 'Robert Brown', bio: 'Medical student dedicated to healthcare', image: '/uploads/contestant4.jpg' },
      ],
      // Miss University contestants
      [
        { name: 'Jane Smith', bio: 'Arts student with creative talents', image: '/uploads/contestant5.jpg' },
        { name: 'Emily Davis', bio: 'Science student passionate about research', image: '/uploads/contestant6.jpg' },
        { name: 'Sarah Wilson', bio: 'Law student with strong advocacy skills', image: '/uploads/contestant7.jpg' },
        { name: 'Lisa Anderson', bio: 'Education student focused on teaching excellence', image: '/uploads/contestant8.jpg' },
      ],
      // Best Dressed contestants
      [
        { name: 'Alex Thompson', bio: 'Fashion design student with impeccable style', image: '/uploads/contestant9.jpg' },
        { name: 'Chris Martinez', bio: 'Business student known for elegant attire', image: '/uploads/contestant10.jpg' },
        { name: 'Jordan Lee', bio: 'Arts student with unique fashion sense', image: '/uploads/contestant11.jpg' },
        { name: 'Taylor Garcia', bio: 'Communications student with trendy style', image: '/uploads/contestant12.jpg' },
      ],
      // Most Talented contestants
      [
        { name: 'Sam Parker', bio: 'Music and performing arts student', image: '/uploads/contestant13.jpg' },
        { name: 'Casey Taylor', bio: 'Sports and athletics enthusiast', image: '/uploads/contestant14.jpg' },
        { name: 'Morgan White', bio: 'Dance and choreography student', image: '/uploads/contestant15.jpg' },
        { name: 'Riley Clark', bio: 'Creative writing and poetry talent', image: '/uploads/contestant16.jpg' },
      ],
    ];

    for (let i = 0; i < createdContests.length; i++) {
      const contest = createdContests[i];
      const contestants = contestantsData[i];

      for (const contestantData of contestants) {
        await Contestant.create({
          contest: contest._id,
          ...contestantData,
        });
      }
    }

    res.json({
      success: true,
      message: 'Dummy data seeded successfully',
      data: { contests: createdContests.length, contestants: contestantsData.flat().length }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error seeding dummy data', error: e.message });
  }
};

const Contest = require('../models/Contest');
const Contestant = require('../models/Contestant');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

const normalizeContestant = (contestant) => {
  const data = contestant.toObject ? contestant.toObject() : contestant;
  return {
    ...data,
    image: data.image
      ? typeof data.image === 'string'
        ? { url: data.image, publicId: null }
        : data.image
      : null,
  };
};

exports.getContests = async (req, res) => {
  try {
    const contests = await Contest.find({})
      .populate('restrictedSchool', 'name')
      .populate('restrictedDepartment', 'name')
      .populate('createdBy', 'name email')
      .sort({ isActive: -1, createdAt: -1 });
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
          ...normalizeContestant(contestant),
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
    const { name, description, startAt, endAt, isActive, votingRestriction, restrictedSchool, restrictedDepartment } = req.body;
    const userId = req.userId;

    const contestData = {
      name,
      description,
      startAt,
      endAt,
      isActive,
      votingRestriction: votingRestriction || 'all',
      createdBy: userId,
    };

    // Set restriction fields based on votingRestriction
    if (votingRestriction === 'school' && restrictedSchool) {
      contestData.restrictedSchool = restrictedSchool;
    } else if (votingRestriction === 'department' && restrictedDepartment) {
      contestData.restrictedDepartment = restrictedDepartment;
    }

    const contest = await Contest.create(contestData);
    const populatedContest = await Contest.findById(contest._id)
      .populate('restrictedSchool', 'name')
      .populate('restrictedDepartment', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populatedContest });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error creating contest', error: e.message });
  }
};

// Admin: update contest
exports.updateContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { name, description, startAt, endAt, isActive, votingRestriction, restrictedSchool, restrictedDepartment } = req.body;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (name) contest.name = name;
    if (description !== undefined) contest.description = description;
    if (startAt) contest.startAt = startAt;
    if (endAt) contest.endAt = endAt;
    if (isActive !== undefined) contest.isActive = isActive;
    if (votingRestriction) contest.votingRestriction = votingRestriction;

    // Update restriction fields
    if (votingRestriction === 'school' && restrictedSchool) {
      contest.restrictedSchool = restrictedSchool;
      contest.restrictedDepartment = null;
    } else if (votingRestriction === 'department' && restrictedDepartment) {
      contest.restrictedDepartment = restrictedDepartment;
      contest.restrictedSchool = null;
    } else if (votingRestriction === 'all') {
      contest.restrictedSchool = null;
      contest.restrictedDepartment = null;
    }

    await contest.save();

    const populatedContest = await Contest.findById(contest._id)
      .populate('restrictedSchool', 'name')
      .populate('restrictedDepartment', 'name')
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, data: populatedContest });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error updating contest', error: e.message });
  }
};

// Admin: delete contest
exports.deleteContest = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Check if contest has contestants
    const contestantsCount = await Contestant.countDocuments({ contest: contestId });
    if (contestantsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete contest with existing contestants. Please delete contestants first.',
      });
    }

    await Contest.findByIdAndDelete(contestId);
    res.status(200).json({ success: true, message: 'Contest deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error deleting contest', error: e.message });
  }
};

// Admin: add contestant
exports.addContestant = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { name, bio } = req.body;

    let image = null;
    if (req.file) {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'contests',
        resource_type: 'image',
      });
      image = { url: upload.secure_url, publicId: upload.public_id };
    }

    const contestant = await Contestant.create({ contest: contestId, name, bio, image });
    res.status(201).json({ success: true, data: normalizeContestant(contestant) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error adding contestant', error: e.message });
  }
};

// Admin: delete contestant
exports.deleteContestant = async (req, res) => {
  try {
    const { contestantId } = req.params;

    const contestant = await Contestant.findById(contestantId);
    if (!contestant) {
      return res.status(404).json({ success: false, message: 'Contestant not found' });
    }

    // Delete image from Cloudinary if exists
    if (contestant.image?.publicId) {
      await deleteResource(contestant.image.publicId, 'image');
    }

    await Contestant.findByIdAndDelete(contestantId);
    res.status(200).json({ success: true, message: 'Contestant deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error deleting contestant', error: e.message });
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
    let createdBy = req.userId;
    if (!createdBy) {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(400).json({ success: false, message: 'No admin user found to assign as contest creator' });
      }
      createdBy = admin._id;
    }

    // Create contests
    const contests = [
      {
        name: 'Mr. University of Bamenda',
        description: 'Vote for the most outstanding male student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy,
      },
      {
        name: 'Miss University of Bamenda',
        description: 'Vote for the most outstanding female student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy,
      },
      {
        name: 'Best Dressed Student',
        description: 'Vote for the best dressed student on campus',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy,
      },
      {
        name: 'Most Talented Student',
        description: 'Vote for the most talented student',
        isActive: true,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy,
      }
    ];

    const createdContests = await Contest.insertMany(contests);

    // Create contestants for each contest
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

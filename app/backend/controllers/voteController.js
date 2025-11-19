const Vote = require('../models/Vote');
const Contest = require('../models/Contest');
const User = require('../models/User');

exports.castVote = async (req, res) => {
  try {
    const userId = req.userId;
    const { contestId, contestantId } = req.body;
    if (!contestId || !contestantId) {
      return res.status(400).json({ success: false, message: 'contestId and contestantId are required' });
    }

    // Get the contest to check voting restrictions
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    if (!contest.isActive) {
      return res.status(400).json({ success: false, message: 'This contest is not active' });
    }

    // Check if voting period is valid
    const now = new Date();
    if (contest.startAt && now < contest.startAt) {
      return res.status(400).json({ success: false, message: 'Voting has not started yet' });
    }
    if (contest.endAt && now > contest.endAt) {
      return res.status(400).json({ success: false, message: 'Voting has ended' });
    }

    // Get user to check voting eligibility
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check voting restrictions
    if (contest.votingRestriction === 'school') {
      if (!contest.restrictedSchool || !user.school) {
        return res.status(403).json({ success: false, message: 'You are not eligible to vote in this contest. Only users from the specified school can vote.' });
      }
      if (contest.restrictedSchool.toString() !== user.school.toString()) {
        return res.status(403).json({ success: false, message: 'You are not eligible to vote in this contest. Only users from the specified school can vote.' });
      }
    } else if (contest.votingRestriction === 'department') {
      if (!contest.restrictedDepartment || !user.department) {
        return res.status(403).json({ success: false, message: 'You are not eligible to vote in this contest. Only users from the specified department can vote.' });
      }
      if (contest.restrictedDepartment.toString() !== user.department.toString()) {
        return res.status(403).json({ success: false, message: 'You are not eligible to vote in this contest. Only users from the specified department can vote.' });
      }
    }
    // If votingRestriction is 'all', no additional checks needed

    // Enforce one vote per user per contest via unique index
    const vote = await Vote.create({ user: userId, contest: contestId, contestant: contestantId });
    res.status(201).json({ success: true, message: 'Vote cast successfully', data: vote });
  } catch (e) {
    // Handle duplicate key error for repeated votes
    if (e && e.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already voted in this contest' });
    }
    res.status(500).json({ success: false, message: 'Error casting vote', error: e.message });
  }
};

exports.getMyVotes = async (req, res) => {
  try {
    const userId = req.userId;
    const votes = await Vote.find({ user: userId }).select('contest contestant').lean();
    res.json({ success: true, data: votes });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching votes', error: e.message });
  }
};

const Vote = require('../models/Vote');

exports.castVote = async (req, res) => {
  try {
    const userId = req.userId;
    const { contestId, contestantId } = req.body;
    if (!contestId || !contestantId) {
      return res.status(400).json({ success: false, message: 'contestId and contestantId are required' });
    }

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

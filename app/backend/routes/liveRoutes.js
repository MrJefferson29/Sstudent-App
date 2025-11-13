const express = require('express')
const router = express.Router()
const LiveMessage = require('../models/LiveMessage')

// GET /live/:room/messages?limit=50
router.get('/:room/messages', async (req, res) => {
  try {
    const { room } = req.params
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200)
    const messages = await LiveMessage.find({ room })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    res.json(messages.reverse())
  } catch (err) {
    console.error('Live messages fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch live messages' })
  }
})

// POST /live/:room/messages
router.post('/:room/messages', async (req, res) => {
  try {
    const { room } = req.params
    const { username, message } = req.body || {}
    if (!username || !message) {
      return res.status(400).json({ error: 'username and message are required' })
    }
    const saved = await LiveMessage.create({ room, username, message })
    res.status(201).json(saved)
  } catch (err) {
    console.error('Live message save error:', err)
    res.status(500).json({ error: 'Failed to save live message' })
  }
})

module.exports = router
const express = require('express');
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  getEventsByClub,
} = require('../controllers/eventController');
const { auth, managerOnly } = require('../middleware/auth');

router.post('/', auth, managerOnly, createEvent);
router.get('/', auth, getAllEvents);
router.get('/:id', auth, getEventById);
router.get('/club/:clubId', auth, getEventsByClub);

module.exports = router;

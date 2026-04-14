const express = require('express');
const router = express.Router();
const { createClub, getClubs, getClubById, getMyClubs } = require('../controllers/clubController');
const { auth, managerOnly } = require('../middleware/auth');

router.post('/', auth, managerOnly, createClub);
router.get('/', auth, getClubs);
router.get('/my', auth, getMyClubs);
router.get('/:id', auth, getClubById);

module.exports = router;

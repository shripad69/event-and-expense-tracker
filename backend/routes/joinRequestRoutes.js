const express = require('express');
const router = express.Router();
const {
  sendJoinRequest,
  getClubJoinRequests,
  handleJoinRequest,
  getMyJoinRequests,
} = require('../controllers/joinRequestController');
const { auth, managerOnly } = require('../middleware/auth');

router.post('/', auth, sendJoinRequest);
router.get('/my', auth, getMyJoinRequests);
router.get('/club/:clubId', auth, managerOnly, getClubJoinRequests);
router.put('/:requestId', auth, managerOnly, handleJoinRequest);

module.exports = router;

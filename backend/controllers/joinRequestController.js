const JoinRequest = require('../models/JoinRequest');
const Club = require('../models/Club');

exports.sendJoinRequest = async (req, res, next) => {
  try {
    const { clubId } = req.body;
    const existing = await JoinRequest.findOne({
      user: req.user._id,
      club: clubId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ message: 'Join request already pending' });
    }
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (club.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }
    const joinRequest = await JoinRequest.create({ user: req.user._id, club: clubId });
    res.status(201).json(joinRequest);
  } catch (error) {
    next(error);
  }
};

exports.getClubJoinRequests = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (club.revenueManager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the revenue manager can view requests' });
    }
    const requests = await JoinRequest.find({ club: clubId, status: 'pending' })
      .populate('user', 'name email college');
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

exports.handleJoinRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'approved' or 'rejected'
    const joinRequest = await JoinRequest.findById(requestId).populate('club');
    if (!joinRequest) return res.status(404).json({ message: 'Request not found' });
    if (joinRequest.club.revenueManager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the revenue manager can handle requests' });
    }
    joinRequest.status = action;
    await joinRequest.save();
    if (action === 'approved') {
      await Club.findByIdAndUpdate(joinRequest.club._id, {
        $addToSet: { members: joinRequest.user },
      });
    }
    res.json(joinRequest);
  } catch (error) {
    next(error);
  }
};

exports.getMyJoinRequests = async (req, res, next) => {
  try {
    const requests = await JoinRequest.find({ user: req.user._id })
      .populate('club', 'name college');
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

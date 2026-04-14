const Club = require('../models/Club');

exports.createClub = async (req, res, next) => {
  try {
    const { name, college } = req.body;
    const club = await Club.create({
      name,
      college,
      revenueManager: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(club);
  } catch (error) {
    next(error);
  }
};

exports.getClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find()
      .populate('revenueManager', 'name email')
      .populate('members', 'name email');
    res.json(clubs);
  } catch (error) {
    next(error);
  }
};

exports.getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('revenueManager', 'name email')
      .populate('members', 'name email');
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json(club);
  } catch (error) {
    next(error);
  }
};

exports.getMyClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({
      $or: [{ revenueManager: req.user._id }, { members: req.user._id }],
    })
      .populate('revenueManager', 'name email')
      .populate('members', 'name email');
    res.json(clubs);
  } catch (error) {
    next(error);
  }
};

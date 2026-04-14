const Event = require('../models/Event');
const Club = require('../models/Club');

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, clubId } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (club.revenueManager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the revenue manager can create events' });
    }
    const event = await Event.create({
      title,
      description,
      date,
      club: clubId,
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('club', 'name college')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club', 'name college')
      .populate('createdBy', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    next(error);
  }
};

exports.getEventsByClub = async (req, res, next) => {
  try {
    const events = await Event.find({ club: req.params.clubId })
      .populate('club', 'name college')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    next(error);
  }
};

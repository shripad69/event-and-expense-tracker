const Event = require('../models/Event');
const Club = require('../models/Club');

/**
 * Helper: strip budget fields from an event object for non-manager users.
 */
const stripBudgetFields = (eventObj) => {
  const obj = eventObj.toJSON ? eventObj.toJSON() : { ...eventObj };
  delete obj.budget;
  delete obj.spentAmount;
  delete obj.remainingAmount;
  return obj;
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, clubId, budget } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (club.revenueManager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the revenue manager can create events' });
    }

    const eventData = {
      title,
      description,
      date,
      club: clubId,
      createdBy: req.user._id,
    };

    // Only managers can set budget; budget is optional
    if (budget != null && budget !== '') {
      const parsedBudget = Number(budget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        return res.status(400).json({ message: 'Budget must be a non-negative number' });
      }
      eventData.budget = parsedBudget;
      eventData.spentAmount = 0;
    }

    const event = await Event.create(eventData);
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

    const isManager = req.user.role === 'manager';
    const result = isManager ? events : events.map(stripBudgetFields);
    res.json(result);
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

    const isManager = req.user.role === 'manager';
    res.json(isManager ? event : stripBudgetFields(event));
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

    const isManager = req.user.role === 'manager';
    const result = isManager ? events : events.map(stripBudgetFields);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

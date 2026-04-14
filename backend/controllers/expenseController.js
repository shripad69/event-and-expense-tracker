const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

exports.createExpense = async (req, res, next) => {
  try {
    const { title, description, amount, upiId, eventId } = req.body;
    let imageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }
    const expense = await Expense.create({
      title,
      description,
      amount,
      imageUrl,
      upiId,
      user: req.user._id,
      event: eventId,
    });
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

exports.getExpensesByEvent = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

exports.getMyExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ user: req.user._id })
      .populate('event', 'title date')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

exports.approveExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('event', 'title');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    expense.status = 'approved';
    await expense.save();

    // Notify the expense owner
    try {
      await Notification.create({
        user: expense.user,
        type: 'expense_approved',
        message: `Your expense "${expense.title}" has been approved`,
        data: { expenseId: expense._id, eventTitle: expense.event?.title },
      });
    } catch (_) { /* non-critical */ }

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

exports.rejectExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('event', 'title');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    expense.status = 'rejected';
    await expense.save();

    // Notify the expense owner
    try {
      await Notification.create({
        user: expense.user,
        type: 'expense_rejected',
        message: `Your expense "${expense.title}" has been rejected`,
        data: { expenseId: expense._id, eventTitle: expense.event?.title },
      });
    } catch (_) { /* non-critical */ }

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

exports.getPendingExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ status: 'pending' })
      .populate('user', 'name email')
      .populate('event', 'title date')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

exports.getApprovedExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ status: 'approved' })
      .populate('user', 'name email')
      .populate('event', 'title date')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

exports.getPaidExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ status: 'paid' })
      .populate('user', 'name email')
      .populate('event', 'title date')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

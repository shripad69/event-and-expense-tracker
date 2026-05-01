const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Expense = require('../models/Expense');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { expenseId } = req.body;
    const expense = await Expense.findById(expenseId).populate('event', 'budget spentAmount');
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    if (expense.status !== 'approved') {
      return res.status(400).json({ message: 'Expense must be approved before payment' });
    }

    // Soft warning if this payment would exceed the event budget
    let budgetWarning = null;
    if (expense.event?.budget != null) {
      const projectedSpent = expense.event.spentAmount + expense.amount;
      if (projectedSpent > expense.event.budget) {
        budgetWarning = `Warning: This payment of ₹${expense.amount} will exceed the event budget. Projected total: ₹${projectedSpent} / ₹${expense.event.budget}`;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: { name: expense.title },
            unit_amount: Math.round(expense.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        expenseId: expense._id.toString(),
        eventId: expense.event?._id?.toString() || '',
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?expenseId=${expense._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/manager`,
    });

    const response = { url: session.url };
    if (budgetWarning) response.budgetWarning = budgetWarning;
    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { expenseId, paymentId } = req.body;
    if (!expenseId || !paymentId) {
      return res.status(400).json({ message: 'expenseId and paymentId are required' });
    }
    const expense = await Expense.findByIdAndUpdate(
      expenseId,
      { status: 'paid', paymentId },
      { new: true }
    );
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Atomically update the event's spentAmount using $inc to avoid race conditions
    let overBudget = false;
    if (expense.event) {
      const updatedEvent = await Event.findByIdAndUpdate(
        expense.event,
        { $inc: { spentAmount: expense.amount } },
        { new: true }
      );
      if (updatedEvent && updatedEvent.budget != null) {
        overBudget = updatedEvent.spentAmount > updatedEvent.budget;
      }
    }

    // Notify the expense owner
    try {
      await Notification.create({
        user: expense.user,
        type: 'payment_completed',
        message: `Payment completed for your expense "${expense.title}"`,
        data: { expenseId: expense._id, amount: expense.amount },
      });
    } catch (_) { /* non-critical */ }

    res.json({ message: 'Payment verified successfully', expense, overBudget });
  } catch (error) {
    next(error);
  }
};
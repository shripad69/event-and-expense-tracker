const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    budget: { type: Number, min: 0, default: null },
    spentAmount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: remainingAmount = budget - spentAmount
eventSchema.virtual('remainingAmount').get(function () {
  if (this.budget == null) return null;
  return this.budget - this.spentAmount;
});

module.exports = mongoose.model('Event', eventSchema);

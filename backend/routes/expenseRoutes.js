const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createExpense,
  getExpensesByEvent,
  getMyExpenses,
  approveExpense,
  rejectExpense,
  getPendingExpenses,
  getApprovedExpenses,
  getPaidExpenses,
} = require('../controllers/expenseController');
const { auth, managerOnly } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', auth, upload.single('image'), createExpense);
router.get('/my', auth, getMyExpenses);
router.get('/pending', auth, managerOnly, getPendingExpenses);
router.get('/approved', auth, managerOnly, getApprovedExpenses);
router.get('/paid', auth, managerOnly, getPaidExpenses);
router.get('/event/:eventId', auth, getExpensesByEvent);
router.put('/:id/approve', auth, managerOnly, approveExpense);
router.put('/:id/reject', auth, managerOnly, rejectExpense);

module.exports = router;

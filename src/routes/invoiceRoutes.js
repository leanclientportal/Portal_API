const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid
} = require('../controllers/invoiceController');

// All routes are protected
// router.use(protect);

router.route('/:projectId')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:projectId/:invoiceId')
  .put(updateInvoice)
  .delete(deleteInvoice);

router.route('/:projectId/:invoiceId/pay')
  .put(markAsPaid);

module.exports = router;

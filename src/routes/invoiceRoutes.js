const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');

// All routes are protected
router.use(protect);

router.route('/:projectId')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:projectId/:invoiceId')
  .put(updateInvoice)
  .delete(deleteInvoice);

module.exports = router;

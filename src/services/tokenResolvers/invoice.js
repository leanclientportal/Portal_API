const Invoice = require('../../models/Invoice');

async function getInvoiceDetails(invoiceId) {
  if (!invoiceId) return null;
  return Invoice.findById(invoiceId).lean();
}

module.exports = { getInvoiceDetails };
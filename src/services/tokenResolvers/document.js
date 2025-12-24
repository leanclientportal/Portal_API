const Document = require('../../models/Document');

async function getDocumentDetails(documentId) {
  if (!documentId) return null;
  return Document.findById(documentId).lean();
}

module.exports = { getDocumentDetails };
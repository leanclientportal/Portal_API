const Client = require('../../models/Client');

async function getClientDetails(clientId) {
  if (!clientId) return null;
  return Client.findById(clientId).lean();
}

module.exports = { getClientDetails };
const { getProjectDetails } = require('./tokenResolvers/project');
const { getTaskDetails } = require('./tokenResolvers/task');
const { getClientDetails } = require('./tokenResolvers/client');
const { getTenantDetails } = require('./tokenResolvers/tenant');
const { getDocumentDetails } = require('./tokenResolvers/document');
const { getInvoiceDetails } = require('./tokenResolvers/invoice');

async function getTokenData(ids) {
  const { projectId, taskId, clientId, tenantId, documentId, invoiceId } = ids;

  const data = {};

  if (projectId) {
    data.project = await getProjectDetails(projectId);
  }

  if (taskId) {
    data.task = await getTaskDetails(taskId);
  }

  if (clientId) {
    data.client = await getClientDetails(clientId);
  }

  if (tenantId) {
    data.tenant = await getTenantDetails(tenantId);
  }

  if (documentId) {
    data.document = await getDocumentDetails(documentId);
  }

  if (invoiceId) {
    data.invoice = await getInvoiceDetails(invoiceId);
  }

  return data;
}

module.exports = { getTokenData };
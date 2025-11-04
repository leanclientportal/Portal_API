const mongoose = require('mongoose');

const tenantClientMappingSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'tenant_client_mapping'
});

tenantClientMappingSchema.index({ tenantId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('TenantClientMapping', tenantClientMappingSchema);
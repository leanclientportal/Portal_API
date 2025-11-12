const mongoose = require('mongoose');

const userTenantClientMappingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  masterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  role: {
    type: String,
    enum: ['client', 'tenant'],
    required: true
  }
}, {
  timestamps: true,
  collection: 'user_tenant_client_mapping'
});

module.exports = mongoose.model('UserTenantClientMapping', userTenantClientMappingSchema);
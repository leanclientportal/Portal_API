const mongoose = require('mongoose');

const userTenantClientMappingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  masterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'user_tenant_client_mapping'
});

userTenantClientMappingSchema.index({ userId: 1, masterId: 1 }, { unique: true });

module.exports = mongoose.model('UserTenantClientMapping', userTenantClientMappingSchema);
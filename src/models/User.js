const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const credentialSchema = new mongoose.Schema({
  password: {
    type: String,
    required: false, // Changed to false
    minlength: 6,
    select: false // prevent password from being returned in queries by default
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    minlength: 7,
    maxlength: 20
  },
  activeProfile: {
    type: String
  },
  activeProfileId: {
    type: mongoose.Schema.Types.ObjectId
  },
  lastActiveDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'user'
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new) AND it exists
  if (this.credential && this.isModified('credential.password') && this.credential.password) {
    // Generate a salt and hash the password in one step
    this.credential.password = await bcrypt.hash(this.credential.password, 10);
  }
  next();
});

// Exclude credential details from JSON responses by default
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.credential;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
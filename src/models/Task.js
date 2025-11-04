const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  visibleToClient: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'in-review', 'completed', 'cancelled'],
    default: 'todo'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'task'
});

// Indexes aligned with simplified schema
taskSchema.index({ projectId: 1, isActive: 1 });
taskSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
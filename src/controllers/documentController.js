const Document = require('../models/Document');
const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all documents for a project
// @route   GET /api/v1/documents/:projectId
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20, search } = req.query;

  const query = { projectId };
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const documents = await Document.find(query)
    .populate('uploaderId', 'email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Document.countDocuments(query);

  res.status(200).json({
    success: true,
    count: documents.length,
    pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    data: documents
  });
});

// @desc    Get a single document
// @route   GET /api/v1/documents/:projectId/:documentId
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;
  const document = await Document.findOne({ _id: documentId, projectId })

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  res.status(200).json({ success: true, data: document });
});

// @desc    Upload a document
// @route   POST /api/v1/documents/:projectId
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, docUrl, uploadedBy, uploaderId, isOverwrite } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  let document = await Document.findOne({ name, projectId });

  if (document && !isOverwrite) {
    return res.status(400).json({ success: false, message: 'Document with this name already exists.' });
  }

  if (document && isOverwrite) {
    document.docUrl = docUrl;
    document.uploadedBy = uploadedBy;
    document.uploaderId = uploaderId;
    document.isOverwrite = true;
    await document.save();
    return res.status(200).json({ success: true, data: document });
  }

  document = await Document.create({
    name,
    docUrl,
    projectId,
    uploadedBy,
    uploaderId,
    isOverwrite
  });

  res.status(201).json({ success: true, data: document });
});

// @desc    Update a document
// @route   PUT /api/v1/documents/:projectId/:documentId
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;
  const { name, docUrl, uploadedBy, uploaderId, isOverwrite } = req.body;

  const document = await Document.findOneAndUpdate(
    { _id: documentId, projectId, isActive: true },
    { name, docUrl, uploadedBy, uploaderId, isOverwrite },
    { new: true, runValidators: true }
  );

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  res.status(200).json({ success: true, data: document });
});

// @desc    Delete a document (soft delete)
// @route   DELETE /api/v1/documents/:projectId/:documentId
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;

  const document = await Document.findOneAndDelete({ _id: documentId, projectId });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  res.status(200).json({ success: true, message: 'Document deleted successfully' });
});

module.exports = {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
};

const Document = require('../models/Document');
const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');

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

  const pagination = {
    current: parseInt(page),
    total: Math.ceil(total / limit),
    count: documents.length,
    totalRecords: total
  };

  sendResponse(res, 200, 'Documents retrieved successfully', { documents }, pagination);
});

// @desc    Get a single document
// @route   GET /api/v1/documents/:projectId/:documentId
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;
  const document = await Document.findOne({ _id: documentId, projectId })

  if (!document) {
    return sendResponse(res, 404, 'Document not found', null, false);
  }

  sendResponse(res, 200, 'Document retrieved successfully', document);
});

// @desc    Upload a document
// @route   POST /api/v1/documents/:projectId
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, docUrl, uploadedBy, uploaderId, isOverwrite } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return sendResponse(res, 404, 'Project not found', null, false);
  }

  let document = await Document.findOne({ name, projectId });

  if (document && !isOverwrite) {
    return sendResponse(res, 400, 'Document with this name already exists.', null, false);
  }

  if (document && isOverwrite) {
    document.docUrl = docUrl;
    document.uploadedBy = uploadedBy;
    document.uploaderId = uploaderId;
    document.isOverwrite = true;
    await document.save();
    return sendResponse(res, 200, 'Document overwritten successfully', document);
  }

  document = await Document.create({
    name,
    docUrl,
    projectId,
    uploadedBy,
    uploaderId,
    isOverwrite
  });

  sendResponse(res, 201, 'Document uploaded successfully', document);
});

// @desc    Update a document
// @route   PUT /api/v1/documents/:projectId/:documentId
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;
  const { name, docUrl, uploadedBy, uploaderId, isOverwrite } = req.body;

  const document = await Document.findOneAndUpdate(
    { _id: documentId, projectId }, 
    { name, docUrl, uploadedBy, uploaderId, isOverwrite },
    { new: true, runValidators: true }
  );

  if (!document) {
    return sendResponse(res, 404, 'Document not found', null, false);
  }

  sendResponse(res, 200, 'Document updated successfully', document);
});

// @desc    Delete a document (soft delete)
// @route   DELETE /api/v1/documents/:projectId/:documentId
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;

  const document = await Document.findOneAndDelete({ _id: documentId, projectId });

  if (!document) {
    return sendResponse(res, 404, 'Document not found', null, false);
  }

  sendResponse(res, 200, 'Document deleted successfully', {});
});

module.exports = {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
};

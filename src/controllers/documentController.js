const Document = require('../models/Document');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get single document by id
// @route   GET /api/v1/documents/:clientId/:projectId/:documentId
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
  const { clientId, projectId, documentId } = req.params;

  const document = await Document.findOne({
    _id: documentId,
    clientId,
    projectId,

  }).populate([
    { path: 'projectId', select: 'name' },
    { path: 'clientId', select: 'name' }
  ]);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Document retrieved successfully',
    data: document
  });
});

// @desc    Get all documents for a project
// @route   GET /api/v1/documents/:clientId/:projectId
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const { clientId, projectId } = req.params;
  const { page = 1, limit = 20, search } = req.query;

  // Build query
  const query = { clientId, projectId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { tag: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const documents = await Document.find(query)
    .populate('projectId', 'name')
    .populate('clientId', 'name')
    .select('-__v')
    .sort({ createdDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Document.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Documents retrieved successfully',
    data: {
      documents,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: documents.length,
        totalRecords: total
      }
    }
  });
});

// @desc    Create document (URL-based)
// @route   POST /api/v1/documents/:clientId/:projectId
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  const { clientId, projectId } = req.params;
  const { name, url, tag, uploadedBy, uploaderId, createdDate } = req.body;

  const document = await Document.create({
    clientId,
    projectId,
    name,
    url,
    tag,
    uploadedBy,
    uploaderId,
    createdDate
  });

  await document.populate([
    { path: 'projectId', select: 'name' },
    { path: 'clientId', select: 'name' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Document created successfully',
    data: document
  });
});

// @desc    Download document (redirect) and increment download count
// @route   GET /api/v1/documents/:clientId/:projectId/:documentId/download
// @access  Private
const downloadDocument = asyncHandler(async (req, res) => {
  const { clientId, projectId, documentId } = req.params;

  const document = await Document.findOne({
    _id: documentId,
    clientId,
    projectId,

  });

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Redirect to the file URL (Cloudinary secure URL)
  return res.redirect(document.url);
});

// @desc    Update document metadata
// @route   PUT /api/v1/documents/:clientId/:projectId/:documentId
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const { clientId, projectId, documentId } = req.params;

  const document = await Document.findOneAndUpdate(
    { _id: documentId, clientId, projectId },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'projectId', select: 'name' },
    { path: 'clientId', select: 'name' }
  ]);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Document updated successfully',
    data: document
  });
});

// @desc    Delete document
// @route   DELETE /api/v1/documents/:clientId/:projectId/:documentId
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const { clientId, projectId, documentId } = req.params;

  const document = await Document.findOne({
    _id: documentId,
    clientId,
    projectId
  });

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  await Document.findByIdAndDelete(documentId);

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully'
  });
});

module.exports = {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument
};
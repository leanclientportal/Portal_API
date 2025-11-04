const Client = require('../models/Client');
const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Configure Cloudinary (reuse env vars as in documentController)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure a folder exists in Cloudinary (idempotent)
async function ensureCloudinaryFolder(folderPath) {
  try {
    await cloudinary.api.create_folder(folderPath);
  } catch (err) {
    // If folder already exists or admin API limited, ignore specific errors
    // Cloudinary returns error code 409 for existing folders
    if (!(err && (err.http_code === 409 || /already exists/i.test(err.message || '')))) {
      throw err;
    }
  }
}

// Memory storage for small images
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// @desc    Get all clients for a tenant
// @route   GET /api/v1/clients/:tenantId
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { page = 1, limit = 20, search, status } = req.query;

  // Build query
  const query = { tenantId, isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const clients = await Client.find(query)
    .select('-__v')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Client.countDocuments(query);

  // Get total projects count for each client
  const clientsWithProjects = await Promise.all(
    clients.map(async (client) => {
      const totalProjects = await Project.countDocuments({
        tenantId,
        clientId: client._id,
        isActive: true
      });
      return {
        ...client.toObject(),
        totalProjects
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Clients retrieved successfully',
    data: {
      clients: clientsWithProjects,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: clientsWithProjects.length,
        totalRecords: total
      }
    }
  });
});

// @desc    Get a single client by tenant and client id
// @route   GET /api/v1/clients/:tenantId/:clientId
// @access  Private
const getClientById = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const client = await Client.findOne({ _id: clientId, tenantId, isActive: true }).select('-__v');

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Client retrieved successfully',
    data: client
  });
});

// @desc    Create new client
// @route   POST /api/v1/clients/:tenantId
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  let profileUrl = '';
  const folderPath = `lean-client-portal/${tenantId}/clients`;


  // 2) JSON base64/data URI path via profileImageBinary
  if (req.body && req.body.profileImageBinary) {
    const client = await Client.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      isActive: req.body.isActive,
      profileUrl,
      tenantId
    });

    const outputDir = path.join(__dirname, `${folderPath}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const imagePath = path.join(outputDir, `profile_${client._id}.jpeg`);
    const imageby64 = req.body.profileImageBinary.replace('data:image/jpeg;base64,', '');
    // Save file
    fs.writeFileSync(imagePath, Buffer.from(imageby64, 'base64'));

    const updateclient = await Client.findOneAndUpdate(
      { _id: client._id, tenantId },
      { profileUrl: imagePath },
      { new: true }
    );
    // Make sure folder exists
    // try {
    //   await ensureCloudinaryFolder(folderPath);
    // } catch (e) {
    //   return res.status(500).json({ success: false, message: 'Failed to prepare storage folder', error: e.message });
    // }

  }


  res.status(201).json({
    success: true,
    message: 'Client created successfully',
  });
});

// @desc    Update client
// @route   PUT /api/v1/clients/:tenantId/:clientId
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const folderPath = `lean-client-portal/${tenantId}/clients`;
  const outputDir = path.join(__dirname, `${folderPath}`);

  const updateFields = { ...req.body };

  // Handle multipart file if provided
  if (req.file && req.file.buffer) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const imagePath = path.join(outputDir, `profile_${clientId}.jpeg`);
    fs.writeFileSync(imagePath, req.file.buffer);
    updateFields.profileUrl = imagePath;
  }

  // Handle base64/data URI if provided
  if (req.body && req.body.profileImageBinary) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const imagePath = path.join(outputDir, `profile_${clientId}.jpeg`);
    const data = req.body.profileImageBinary
      .replace(/^data:image\/[^;]+;base64,/, '');
    fs.writeFileSync(imagePath, Buffer.from(data, 'base64'));
    updateFields.profileUrl = imagePath;
    delete updateFields.profileImageBinary;
  }

  const client = await Client.findOneAndUpdate(
    { _id: clientId, tenantId },
    updateFields,
    {
      new: true,
      runValidators: true
    }
  );

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Client updated successfully',
    data: client
  });
});

// @desc    Delete client (soft delete)
// @route   DELETE /api/v1/clients/:tenantId/:clientId
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const client = await Client.findOneAndUpdate(
    { _id: clientId, tenantId },
    { isActive: false },
    { new: true }
  );

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Client deleted successfully'
  });
});

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  upload
};
const express = require('express');
const {
  getTenantsByClientId,
} = require('../controllers/tenantController');

const router = express.Router();

// Route to get all tenants for a specific client
router.route('/by-client/:clientId').get(getTenantsByClientId);

module.exports = router;

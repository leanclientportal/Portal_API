/**
 * Standard API Response structure
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {Object|Array|null} data - Data to return
 * @param {Object|null} pagination - Pagination metadata
 * @param {boolean} success - Success status (default true if statusCode < 400)
 */
const sendResponse = (res, statusCode, message, data = null, pagination = null, success = null) => {
  const isSuccess = success !== null ? success : statusCode < 400;
  
  const response = {
    success: isSuccess,
    code: statusCode,
    message,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

module.exports = sendResponse;

/**
 * Replaces placeholders in a template string with values from a data object.
 * Placeholders are in the format {{object.property}}.
 *
 * @param {string} template The template string.
 * @param {object} data The data object containing the values.
 * @returns {string} The string with placeholders replaced.
 */
function replaceTokens(template, data) {
  if (!template || typeof template !== 'string') return '';

  return template.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (_, key) => {
    const keys = key.split('.');
    let value = data;

    for (const k of keys) {
      if (!value || typeof value !== 'object' || !(k in value)) {
        return '';
      }
      value = value[k];
    }

    if (value == null) return '';

    // Date formatting
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    // Allow only primitive values
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      return escapeHtml(String(value));
    }

    // Reject objects/arrays
    return '';
  });
}

// Prevent XSS / broken HTML
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


module.exports = { replaceTokens };
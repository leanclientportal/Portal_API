/**
 * Replaces placeholders in a template string with values from a data object.
 * Placeholders are in the format {{object.property}}.
 *
 * @param {string} template The template string.
 * @param {object} data The data object containing the values.
 * @returns {string} The string with placeholders replaced.
 */
function replaceTokens(template, data) {
  if (!template) return '';

  return template.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (match, key) => {
    const keys = key.split('.');
    let value = data;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return match;
      }
    }
    
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } else if (typeof value === 'object' && value !== null) {
      return String(value); // Convert other objects to string
    }

    return value;
  });
}

module.exports = { replaceTokens };
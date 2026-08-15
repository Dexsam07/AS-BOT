const config = require('../config');

module.exports = async function isOwner(jid = '') {
  if (typeof jid !== 'string') return false;
  const number = jid.replace(/[^0-9]/g, '');
  return number === String(config.OWNER_NUMBER).replace(/[^0-9]/g, '');
};

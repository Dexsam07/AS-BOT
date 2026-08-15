const commands = [];

function register(meta = {}, handler) {
  if (typeof handler !== 'function') throw new TypeError('Command handler must be a function.');
  const command = {
    ...meta,
    pattern: meta.pattern || meta.command || meta.name,
    alias: meta.alias || meta.aliases || [],
    function: handler
  };
  commands.push(command);
  return command;
}

function cmd(meta, handler) {
  return register(meta, handler);
}

function bandah(meta, handler) {
  return register(meta, handler);
}

module.exports = {
  cmd,
  bandah,
  commands,
  register
};

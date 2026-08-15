const startedAt = Date.now();
const commands = new Map();
const recentErrors = [];

function stateFor(name) {
  if (!commands.has(name)) commands.set(name, {
    name,
    calls: 0,
    success: 0,
    failures: 0,
    totalMs: 0,
    maxMs: 0,
    lastError: '',
    lastAt: 0
  });
  return commands.get(name);
}

function begin(name) {
  const started = Date.now();
  const state = stateFor(String(name || 'unknown'));
  state.calls += 1;
  return {
    end(error = null) {
      const elapsed = Date.now() - started;
      state.totalMs += elapsed;
      state.maxMs = Math.max(state.maxMs, elapsed);
      state.lastAt = Date.now();
      if (error) {
        state.failures += 1;
        state.lastError = String(error.message || error).slice(0, 240);
        recentErrors.push({ command: state.name, error: state.lastError, at: new Date().toISOString() });
        if (recentErrors.length > 50) recentErrors.shift();
      } else {
        state.success += 1;
      }
      return elapsed;
    }
  };
}

function getSummary() {
  return {
    uptimeMs: Date.now() - startedAt,
    commands: [...commands.values()].map((item) => ({
      ...item,
      averageMs: item.calls ? Math.round(item.totalMs / item.calls) : 0,
      failureRate: item.calls ? Number((item.failures / item.calls * 100).toFixed(1)) : 0
    })),
    recentErrors: [...recentErrors]
  };
}

function reset() {
  commands.clear();
  recentErrors.length = 0;
}

module.exports = { begin, getSummary, reset };

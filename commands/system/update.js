const updateManager = require('../../lib/update-manager');

function help() {
  return [
    'Self-update commands:',
    'update status',
    'update now',
    'update rollback',
    '',
    'Update sirf approved GitHub main branch se hoga. Real session/data protected rahega.'
  ].join('\n');
}
function short(value) { return value ? String(value).slice(0, 12) : 'unknown'; }

module.exports = {
  command: 'update',
  aliases: ['selfupdate', 'upgrade'],
  category: 'system',
  description: 'Check, apply, or rollback a validated GitHub update.',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const action = String(args[0] || 'status').toLowerCase();
    try {
      if (action === 'status') {
        const state = await updateManager.status();
        if (!state.supported) return context.reply(`❌ ${state.reason}`);
        if (state.error) return context.reply(`❌ GitHub check failed: ${state.error}`);
        return context.reply([
          `Repo: ${state.repo}`,
          `Branch: ${state.branch}`,
          `Current: ${short(state.current)}`,
          `Latest: ${short(state.remote)}`,
          `Update: ${state.updateAvailable ? 'available' : 'already latest'}`,
          `Working tree: ${state.dirty ? 'dirty—update blocked' : 'clean'}`
        ].join('\n'));
      }
      if (action === 'rollback') {
        const result = await updateManager.rollback();
        return context.reply(`✅ ${result.message}\nFrom: ${short(result.from)}\nTo: ${short(result.to)}`);
      }
      if (action !== 'now' && action !== 'apply') return context.reply(help());

      await context.reply('⏳ GitHub update check, backup state aur validation start ho rahi hai.');
      const result = await updateManager.applyUpdate();
      if (!result.updated) return context.reply(`ℹ️ ${result.message}`);

      await context.reply([
        `✅ ${result.message}`,
        `Previous: ${short(result.previousCommit)}`,
        `New: ${short(result.nextCommit)}`,
        `Changed files: ${result.files}`,
        `Package changed: ${result.packageChanged ? 'yes—host restart/install check required' : 'no'}`
      ].join('\n'));
      if (typeof context.requestRestart === 'function') {
        const timer = setTimeout(() => context.requestRestart('github-update'), 1500);
        timer.unref?.();
      }
      return { updated: true };
    } catch (error) {
      return context.reply(`❌ Update blocked: ${error.message}`);
    }
  }
};

const fs = require('node:fs');
for (const file of ['package-lock.json', 'yarn.lock']) { try { fs.rmSync(file, { force: true }); } catch {} }
const agent = process.env.npm_config_user_agent || '';
if (!agent.startsWith('pnpm/')) { console.error('Use pnpm instead'); process.exit(1); }

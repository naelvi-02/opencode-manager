// Interactive CLI Switcher for OpenCode
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { exec } = require('child_process');

const USER_HOME = os.homedir();
const CONFIG_DIR = path.join(USER_HOME, '.config', 'opencode');
const OPENCODE_JSON = path.join(CONFIG_DIR, 'opencode.json');
const OH_MY_JSON = path.join(CONFIG_DIR, 'oh-my-opencode-slim.json');
const BACKUP_DIR = path.join(CONFIG_DIR, '.backups');

function backup(fp) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(fp)) {
    const ts = new Date().isoString().replace(/[:.]/g, '-');
    fs.copyFileSync(fp, path.join(BACKUP_DIR, `${path.basename(fp)}.${ts}.bak`));
  }
}

function read(fp) {
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { return {}; }
}

function write(fp, d) {
  backup(fp);
  fs.writeFileSync(fp, JSON.stringify(d, null, 2), 'utf8');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

async function main() {
  console.clear();
  console.log('======================================================');
  console.log('  🚀 OpenCode Model & Router Quick Switcher');
  console.log('======================================================');
  const op = read(OPENCODE_JSON);
  const om = read(OH_MY_JSON);
  console.log('Current Main Model :', op.model || '(Not set)');
  console.log('Current OMO Preset :', om.preset || '(Not set)');
  console.log('------------------------------------------------------');
  console.log('Pilihan Aksi:');
  console.log('[1] Ganti Router Global (9router <-> omniroute)');
  console.log('[2] Ganti Main Model OpenCode');
  console.log('[3] Ganti Preset Oh-My-OpenCode');
  console.log('[4] Buka Web Dashboard (GUI)');
  console.log('[0] Keluar');

  const ans = (await ask('\nMasukkan pilihan (0-4): ')).trim();
  if (ans === '1') {
    const prov = (await ask('Masukkan nama router tujuan (contoh: 9router atau omniroute): ')).trim();
    if (prov) {
      function rep(m) { if (!m || typeof m !== 'string') return m; const p = m.split('/'); if (p.length >= 2) { p[0] = prov; return p.join('/'); } return prov + '/' + m; }
      if (op.model) op.model = rep(op.model);
      if (op.agent) { for (const k of Object.keys(op.agent)) if (op.agent[k] && op.agent[k].model) op.agent[k].model = rep(op.agent[k].model); }
      write(OPENCODE_JSON, op);
      if (om.agents) { for (const k of Object.keys(om.agents)) if (om.agents[k] && om.agents[k].model) om.agents[k].model = rep(om.agents[k].model); }
      if (om.presets) { for (const pk of Object.keys(om.presets)) for (const ak of Object.keys(om.presets[pk])) if (om.presets[pk][ak] && om.presets[pk][ak].model) om.presets[pk][ak].model = rep(om.presets[pk][ak].model); }
      write(OH_MY_JSON, om);
      console.log('\n' + `✅ Sukses! Semua router dialihkan ke ${prov}`);
    }
  } else if (ans === '2') {
    const nm = (await ask(`Masukkan nama model baru (contoh: 9router/cmc/deepseek/deepseek-v4-pro): `)).trim();
    if (nm) { op.model = nm; write(OPENCODE_JSON, op); console.log('\n' + `✅ Main model diganti ke ${nm}`); }
  } else if (ans === '3') {
    const ps = Object.keys(om.presets || {});
    console.log('Preset yang tersedia:', ps.join(', '));
    const sel = (await ask('Masukkan nama preset: ')).trim();
    if (sel) { om.preset = sel; write(OH_MY_JSON, om); console.log('\n' + `✅ Preset diganti ke ${sel}`); }
  } else if (ans === '4') {
    exec('start http://127.0.0.1:3928');
    require('./server.js');
    return;
  } else if (ans === '0') {
    rl.close();
    process.exit(0);
  }
  await ask('\nTekan Enter untuk kembali ke menu...');
  main();
}
main();

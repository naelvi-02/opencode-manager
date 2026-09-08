// OpenCode Model & Router Manager Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3928;
const USER_HOME = os.homedir();
const CONFIG_DIR = path.join(USER_HOME, '.config', 'opencode');
const OPENCODE_JSON = path.join(CONFIG_DIR, 'opencode.json');
const OH_MY_JSON = path.join(CONFIG_DIR, 'oh-my-opencode-slim.json');
const BACKUP_DIR = path.join(CONFIG_DIR, '.backups');

if (!fs.existsSync(BACKUP_DIR)) {
  try { fs.mkdirSync(BACKUP_DIR, { recursive: true }); } catch (e) {}
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    try {
      fs.copyFileSync(filePath, path.join(BACKUP_DIR, `${fileName}.${timestamp}.bak`));
    } catch (err) {
      console.error('Backup error for ' + filePath, err);
    }
  }
}

function readJson(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      let raw = fs.readFileSync(filePath, 'utf8').replace(/,\s*([}\]])/g, '$1'); return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading JSON ' + filePath, err);
  }
  return fallback;
}

function writeJson(filePath, data) {
  if (data && data.provider) {
    for (const provKey of Object.keys(data.provider)) {
      const prov = data.provider[provKey];
      if (prov && prov.models) {
        for (const mKey of Object.keys(prov.models)) {
          const m = prov.models[mKey];
          if (m) {
            const hasImage = m.modalities && Array.isArray(m.modalities.input) && m.modalities.input.includes('image');
            const isVisionName = /gemini|gpt-5|vision|flash|kimi|muse|grok|minimax|4o|luna|sol/i.test(mKey) || /gemini|gpt-5|vision|flash|kimi|muse|grok|minimax|4o|luna|sol/i.test(m.name || '');
            if (hasImage || isVisionName) {
              m.attachment = true;
              if (!m.modalities) {
                m.modalities = { input: ["text", "image"], output: ["text"] };
              } else if (!m.modalities.input.includes('image')) {
                m.modalities.input.push('image');
              }
            }
          }
        }
      }
    }
  }
  backupFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getFullConfig() {
  const opencodeJson = readJson(OPENCODE_JSON, {});
  const ohMyJson = readJson(OH_MY_JSON, {});

  const providers = opencodeJson.provider || {};
  const allModels = [];

  for (const [provKey, provVal] of Object.entries(providers)) {
    const models = provVal.models || {};
    for (const modelKey of Object.keys(models)) {
      const fullModelId = `${provKey}/${modelKey}`;
      allModels.push({
        id: fullModelId,
        provider: provKey,
        model: modelKey,
        displayName: (models[modelKey] && models[modelKey].name) || modelKey,
        modalities: (models[modelKey] && models[modelKey].modalities) || null
      });
    }
  }

  let backupFiles = [];
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      backupFiles = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.bak'))
        .map(f => {
          const stats = fs.statSync(path.join(BACKUP_DIR, f));
          return { name: f, time: stats.mtime, size: stats.size };
        })
        .sort((a, b) => b.time - a.time);
    }
  } catch (e) {}

  return {
    paths: {
      opencode: OPENCODE_JSON,
      ohMy: OH_MY_JSON,
      backupDir: BACKUP_DIR
    },
    opencode: opencodeJson,
    ohMy: ohMyJson,
    providers: Object.keys(providers),
    models: allModels,
    backups: backupFiles
  };
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(getFullConfig()));
  }

  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.opencode) writeJson(OPENCODE_JSON, payload.opencode);
        if (payload.ohMy) writeJson(OH_MY_JSON, payload.ohMy);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Konfigurasi berhasil disimpan dan otomatis dibackup!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/switch-router' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { targetRouter, scope } = JSON.parse(body);
        if (!targetRouter) throw new Error('Target router harus dipilih');

        const opencodeJson = readJson(OPENCODE_JSON, {});
        const ohMyJson = readJson(OH_MY_JSON, {});

        function replaceProvider(modelStr, newProv) {
          if (!modelStr || typeof modelStr !== 'string') return modelStr;
          const parts = modelStr.split('/');
          if (parts.length >= 2) {
            parts[0] = newProv;
            return parts.join('/');
          }
          return `${newProv}/${modelStr}`;
        }

        if (scope === 'all' || scope === 'main') {
          if (opencodeJson.model) opencodeJson.model = replaceProvider(opencodeJson.model, targetRouter);
          if (opencodeJson.agent) {
            for (const k of Object.keys(opencodeJson.agent)) {
              if (opencodeJson.agent[k] && opencodeJson.agent[k].model) {
                opencodeJson.agent[k].model = replaceProvider(opencodeJson.agent[k].model, targetRouter);
              }
            }
          }
          writeJson(OPENCODE_JSON, opencodeJson);
        }

        if (scope === 'all' || scope === 'oh-my') {
          if (ohMyJson.agents) {
            for (const k of Object.keys(ohMyJson.agents)) {
              if (ohMyJson.agents[k] && ohMyJson.agents[k].model) {
                ohMyJson.agents[k].model = replaceProvider(ohMyJson.agents[k].model, targetRouter);
              }
            }
          }
          if (ohMyJson.presets) {
            for (const pk of Object.keys(ohMyJson.presets)) {
              const pObj = ohMyJson.presets[pk];
              for (const ak of Object.keys(pObj)) {
                if (pObj[ak] && pObj[ak].model) {
                  pObj[ak].model = replaceProvider(pObj[ak].model, targetRouter);
                }
              }
            }
          }
          writeJson(OH_MY_JSON, ohMyJson);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Router berhasil dialihkan ke "${targetRouter}" secara menyeluruh!` }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/restore' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { backupFileName } = JSON.parse(body);
        const backupFilePath = path.join(BACKUP_DIR, backupFileName);
        if (!fs.existsSync(backupFilePath)) throw new Error('File backup tidak ditemukan');

        if (backupFileName.startsWith('opencode.json.')) {
          backupFile(OPENCODE_JSON);
          fs.copyFileSync(backupFilePath, OPENCODE_JSON);
        } else if (backupFileName.startsWith('oh-my-opencode-slim.json.')) {
          backupFile(OH_MY_JSON);
          fs.copyFileSync(backupFilePath, OH_MY_JSON);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Restore dari ${backupFileName} berhasil!` }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 OpenCode Model & Router Manager aktif!`);
  console.log(`  🔗 Web Dashboard: http://127.0.0.1:${PORT}`);
  console.log(`  📁 Config Path  : ${CONFIG_DIR}`);
  console.log(`======================================================\n`);

  if (process.argv.includes('--open') || !process.argv.includes('--no-open')) {
    const openCmd = process.platform === 'win32' ? `start http://127.0.0.1:${PORT}` : `open http://127.0.0.1:${PORT}`;
    exec(openCmd, () => {});
  }
});

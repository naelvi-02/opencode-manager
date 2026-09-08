# 🚀 OpenCode Manager

> Lightweight (zero-dependency) Model & Router Switcher untuk **OpenCode** dan **Oh-My-OpenCode-Slim**.

Aplikasi ini dibuat untuk memudahkan penggantian model AI, router provider (9router, OmniRoute, OpenRouter, dll), preset, dan subagent matrix secara instan tanpa perlu edit manual file `opencode.json` dan `oh-my-opencode-slim.json`.

---

## �( Fitur Utama

- �a️ **One-Click Mass Router Switcher**: Alihkan seluruh agent dan main model dari satu router ke router lain hanya dalam 1 klik.
- 🤖 **Oh-My-OpenCode-Slim Agent Matrix**: Konfigurasi model dan variant (`high`, `medium`, `low`) untuk setiap subagent (Orchestrator, Oracle, Council, Librarian, Explorer, Designer, Fixer, Observer).
- 🧩 **Preset Manager**: Ganti active preset (`naelvi-grok`, `naelvi-cmc`) atau buat preset baru langsung dari UI.
- 🌐 **Router & Model Editor**: Edit `baseURL`, `apiKey`, serta tambah/hapus model dengan auto-detect multimodal vision modalities.
- 🗄 **Auto Backup & Safe Restore**: Setiap kali simpan, snapshot bertimestamp otomatis disimpan di `.backups/` dan bisa di-restore 1 klik.
- 🔨 **BOM & Trailing Comma Sanitizer**: Tahan terhadap Windows UTF-8 BOM dan syntax error JSON.

---

## 🚀 Cara Install di Komputer Kantor

### Opsi 1: Clone & Install (Paling Gampang)

**Untuk Windows (PowerShell):**
```powershell
git clone https://github.com/naelvi-02/opencode-manager.git
cd opencode-manager
.\install.ps1
```

**Untuk Linux / macOS:**
```bash
git clone https://github.com/naelvi-02/opencode-manager.git
cd opencode-manager
bash install.sh
```

---

## 🎯 Cara Menjalankan

Setelah diinstall, kamu bisa jalankan dari mana saja:

1. **Dari Terminal Mana Saja:**
```bash
opencode-manager
```

2. **Dobel Klik (Windows):**
   - Buka folder `opencode-manager` dan klik dua kali `start.bat`.

3. **Dashboard Web UI:**
   - Browser akan otomatis terbuka ke: `http://127.0.0.1:3928`

---

## 📁 Struktur File
```
opencode-manager/
├── server.js               # Zero-dependency Node.js HTTP Server & REST API
├── cli.js                 # Interactive terminal switcher
├── start.bat               # Windows one-click launcher
├── install.ps1             # PowerShell PATH installer
├── install.sh              # Linux/macOS installer
├── public/
│   └── index.html         # Single-Page Tailwind Dark UI
├── README.md               # Dokumentasi utama
├── blueprint.md             # Arsitektur & design system
├── workflow.md             # Panduan workflow
└── workingagreement.md  # Standard kode
```

---

## 🔒 License
MIT License © 2026 [naelvi-02](https://github.com/naelvi-02)

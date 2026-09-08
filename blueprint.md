# Blueprint & System Architecture

## Overview
Aplikasi ini dirancang sebagai lightweight control plane untuk konfigurasi OpenCode dan Oh-My-OpenCode-Slim.

## Architecture Layers
1. **Presentation Layer**:
  - Single-Page Tailwind Dark UI (`public/index.html`)
  - Interactive CLI (`cli.js`)
2. **Application / REST API Layer**:
  - Node.js HTTP Server (`server.js`)
  - Endpoints: `/api/config`, `/api/save`, `/api/switch-router`, `/api/restore`
3. **Data / Filesystem Layer**:
  - Path Target: `%USERPROFILE%/.config/opencode/`
  - Auto-Backup Directory: `.backups/`

## Data Flow
```
[Web UI / CLI] --(JSON)--> [Server API]
                               |
                              v
                         [Auto-Backup Engine]
                              |
                              v
                         [opencode.json & oh-my-opencode-slim.json]
```

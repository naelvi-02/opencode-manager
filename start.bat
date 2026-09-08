@echo off
title OpenCode Model & Router Manager
cd /d "%~dp0"
echo Starting OpenCode Model & Router Manager...
start http://127.0.0.1:3928
node server.js
pause

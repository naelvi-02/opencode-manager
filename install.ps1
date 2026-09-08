# OpenCode Manager Windows Installer
$user = $env:USERPROFILE
$npmDir = "$user\AppData\Roaming\npm"
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path $npmDir)) {
    New-Item -ItemType Directory -Path $npmDir -Force | Out-Null
}

$cmdContent = @"
@echo off
start http://127.0.0.1:3928
node "$currentDir\server.js" %*
"@

[System.IO.File]::WriteAllText("$npmDir\opencode-manager.cmd", $cmdContent)
[System.IO.File]::WriteAllText("$npmDir\opencode-config.cmd", $cmdContent)

Write-Host "`n======================================================" -ForegroundColor Green
Write-Host "  OpenCode Manager successfully installed to PATH!" -ForegroundColor Cyan
Write-Host "  You can now run: opencode-manager from any terminal" -ForegroundColor Yellow
Write-Host "======================================================`n" -ForegroundColor Green

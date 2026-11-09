[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$LanIp,[int]$WebPort=5443,[int]$BackendPort=8082)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
try {
    if ($WebPort -lt 1024 -or $WebPort -gt 65535) { throw 'WebPort khong hop le.' }
    if (Get-NetTCPConnection -State Listen -LocalPort $WebPort -ErrorAction SilentlyContinue) { throw 'Cong HTTPS dang ban.' }
    & (Join-Path $PSScriptRoot 'prepare-classroom-https.ps1') -LanIp $LanIp
    $env:BACKEND_URL="http://127.0.0.1:$BackendPort"
    Write-Host "HTTPS web: https://localhost:$WebPort | https://${LanIp}:$WebPort"
    Write-Host 'Chung chi local tu ky. Kiem fingerprint truoc khi chap nhan; khong tu cai CA vao trust store.'
    Push-Location (Join-Path $repo 'frontend')
    try { & node 'node_modules/vite/bin/vite.js' preview --host 0.0.0.0 --port $WebPort --strictPort } finally { Pop-Location }
    exit $LASTEXITCODE
} catch { Write-Host "LOI: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }

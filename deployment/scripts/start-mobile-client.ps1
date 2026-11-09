[CmdletBinding()]
param([string]$LanIp, [int]$Port=8082, [int]$MetroPort=8081, [switch]$Check)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
try {
    if ($Port -lt 1024 -or $Port -gt 65535 -or $MetroPort -lt 1024 -or $MetroPort -gt 65535 -or $Port -eq $MetroPort) { throw 'Cong dich vu khong hop le.' }
    if (!$LanIp) {
        $network=Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' -and $_.NetAdapter.HardwareInterface -and $_.IPv4Address } | Select-Object -First 1
        if ($network) { $LanIp=@($network.IPv4Address)[0].IPAddress }
    }
    $parsed=$null
    if (![Net.IPAddress]::TryParse($LanIp,[ref]$parsed) -or $parsed.AddressFamily -ne 'InterNetwork') { throw 'Can IPv4 LAN laptop qua -LanIp.' }
    $expo=Join-Path $repo 'frontend\mobile\node_modules\expo\bin\cli'
    if (!(Test-Path -LiteralPath $expo)) { throw 'Chay npm ci trong frontend/mobile truoc.' }
    if (Get-NetTCPConnection -State Listen -LocalPort $MetroPort -ErrorAction SilentlyContinue) { throw "Expo port $MetroPort dang duoc su dung. Khong khoi dong them mot Metro." }
    $health=Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 4
    if ($health.status -ne 'UP') { throw 'Backend chua san sang. Khoi dong classroom truoc.' }
    Write-Host "Backend da chay: http://${LanIp}:$Port | Expo: exp://${LanIp}:$MetroPort"
    if ($Check) { Write-Host 'Preflight mobile PASS; chua khoi dong Metro.'; return }
    $env:EXPO_PUBLIC_API_BASE_URL="http://${LanIp}:$Port"
    $env:EXPO_PUBLIC_WS_URL="ws://${LanIp}:$Port/ws"
    $env:APP_ALLOW_HTTP='true'
    $env:REACT_NATIVE_PACKAGER_HOSTNAME=$LanIp
    Remove-Item Env:CI -ErrorAction SilentlyContinue
    Push-Location (Join-Path $repo 'frontend/mobile')
    try { & node $expo start --go --lan --port $MetroPort } finally { Pop-Location }
    exit $LASTEXITCODE
} catch { Write-Host "LOI: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }

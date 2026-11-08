[CmdletBinding()]
param(
    [int]$Port = 8082,
    [int]$MetroPort = 8081,
    [string]$LanIp,
    [switch]$ClearCache,
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$jar = Join-Path $repo 'backend\target\smart-motorbike-guardian-backend-1.0.0.jar'
$expo = Join-Path $repo 'frontend\mobile\node_modules\expo\bin\cli'
$localDir = Join-Path $repo '.local\mobile-demo'
$settingsFile = Join-Path $localDir 'settings.json'
$backendProcess = $null

function Protect-LocalText([string]$Value) {
    ConvertTo-SecureString $Value -AsPlainText -Force | ConvertFrom-SecureString
}
function Unprotect-LocalText([string]$Value) {
    $secure = ConvertTo-SecureString $Value
    [System.Net.NetworkCredential]::new('', $secure).Password
}
function Find-Java {
    if ($env:JAVA_HOME) {
        $candidate = Join-Path $env:JAVA_HOME 'bin\java.exe'
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    $javaRoot = Join-Path $env:ProgramFiles 'Java'
    if (Test-Path -LiteralPath $javaRoot) {
        $jdk = Get-ChildItem -LiteralPath $javaRoot -Directory -Filter 'jdk*' |
            Sort-Object LastWriteTime -Descending |
            Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin\java.exe') } |
            Select-Object -First 1
        if ($jdk) { return (Join-Path $jdk.FullName 'bin\java.exe') }
    }
    (Get-Command java.exe -ErrorAction Stop).Source
}

try {
    if ($Port -lt 1024 -or $Port -gt 65535 -or $MetroPort -lt 1024 -or $MetroPort -gt 65535 -or $Port -eq $MetroPort) {
        throw 'Port/MetroPort phai khac nhau, trong khoang 1024..65535.'
    }
    if (!(Test-Path -LiteralPath $jar)) { throw 'Thieu backend JAR. Chay mvn package trong backend truoc.' }
    if (!(Test-Path -LiteralPath $expo)) { throw 'Thieu mobile dependencies. Chay npm ci trong frontend/mobile truoc.' }
    $java = Find-Java
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    if (!$LanIp) {
        $network = Get-NetIPConfiguration | Where-Object {
            $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' -and $_.NetAdapter.HardwareInterface -and $_.IPv4Address
        } | Sort-Object { $_.NetIPv4Interface.InterfaceMetric } | Select-Object -First 1
        if ($network) { $LanIp = @($network.IPv4Address)[0].IPAddress }
    }
    $parsedIp = $null
    if (![System.Net.IPAddress]::TryParse($LanIp, [ref]$parsedIp) -or $parsedIp.AddressFamily -ne 'InterNetwork') {
        throw 'Chua tim duoc IPv4 LAN. Ket noi Wi-Fi hoac chay voi -LanIp <IPv4>.'
    }
    foreach ($listenPort in @($Port, $MetroPort)) {
        if (Get-NetTCPConnection -State Listen -LocalPort $listenPort -ErrorAction SilentlyContinue) {
            throw "Cong $listenPort dang ban. Dung backend/Expo cu hoac chon -Port / -MetroPort khac."
        }
    }
    Write-Host "Backend: http://${LanIp}:$Port | Expo port: $MetroPort"
    if ($Check) {
        Write-Host 'Preflight OK. Khong khoi dong dich vu hoac thay doi cau hinh.'
        return
    }

    New-Item -ItemType Directory -Path $localDir -Force | Out-Null
    if (!(Test-Path -LiteralPath $settingsFile)) {
        Write-Host 'Lan dau: dat mat khau demo (duoc luu ma hoa cho Windows user nay).'
        $securePassword = Read-Host 'Mat khau, toi thieu 8 ky tu' -AsSecureString
        $demoPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
        if ($demoPassword.Length -lt 8) { throw 'Mat khau can toi thieu 8 ky tu.' }
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        $secretBytes = New-Object byte[] 48
        try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
        @{
            Password = ($securePassword | ConvertFrom-SecureString)
            JwtSecret = (Protect-LocalText ([Convert]::ToBase64String($secretBytes)))
        } | ConvertTo-Json | Set-Content -LiteralPath $settingsFile -Encoding UTF8
    }
    $settings = Get-Content -LiteralPath $settingsFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $env:DEMO_PASSWORD = Unprotect-LocalText $settings.Password
    $env:JWT_SECRET = Unprotect-LocalText $settings.JwtSecret
    $env:DEMO_SEED_ENABLED = 'true'
    $env:MQTT_ENABLED = 'true'
    $env:MQTT_BROKER_URL = 'tcp://broker.emqx.io:1883'
    $env:EXPO_PUSH_ENABLED = 'false'
    $env:EXPO_PUBLIC_API_BASE_URL = "http://${LanIp}:$Port"
    $env:EXPO_PUBLIC_WS_URL = "ws://${LanIp}:$Port/ws"
    $env:APP_ALLOW_HTTP = 'true'
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $LanIp
    # The React web UI and Expo share this backend when testing the real boards.
    $env:CORS_ALLOWED_ORIGINS = "http://localhost:$MetroPort,http://127.0.0.1:$MetroPort,http://${LanIp}:$MetroPort,http://localhost:5173,http://127.0.0.1:5173,http://${LanIp}:5173"
    # A separate persistent demo DB: never resets or replaces the team's PostgreSQL database.
    $dbPath = (Join-Path $localDir 'guardian').Replace('\', '/')
    $arguments = @('-jar', ('"' + $jar + '"'), '--spring.profiles.active=h2', "--server.port=$Port", '--server.address=0.0.0.0',
        "--app.mqtt.client-id=guardian-demo-$env:COMPUTERNAME-$Port",
        ('"--spring.datasource.url=jdbc:h2:file:' + $dbPath + ';MODE=PostgreSQL;WRITE_DELAY=0"'),
        '--spring.datasource.driver-class-name=org.h2.Driver', '--spring.datasource.username=sa',
        '--spring.datasource.password=', '--spring.jpa.database-platform=org.hibernate.dialect.H2Dialect')
    $backendProcess = Start-Process -FilePath $java -ArgumentList $arguments -WorkingDirectory $repo -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $localDir 'backend.log') -RedirectStandardError (Join-Path $localDir 'backend-error.log')
    Write-Host 'Dang cho backend...'
    $ready = $false
    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline) {
        if ($backendProcess.HasExited) { throw "Backend da dung. Xem $localDir\backend.log va backend-error.log." }
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (!$ready) { throw "Backend chua san sang sau 60s. Xem log trong $localDir." }
    Write-Host "Backend OK. Tren dien thoai mo http://${LanIp}:$Port/api/health de kiem tra LAN."
    Write-Host 'Dang nhap: owner@guardian.iot | mat khau da dat lan dau.'
    Write-Host 'Quet QR bang Expo Go. Nhan Ctrl+C de dung; tai khoan/du lieu demo duoc giu lai.'
    Remove-Item Env:CI -ErrorAction SilentlyContinue
    $expoArguments = @('start', '--go', '--lan', '--port', $MetroPort.ToString())
    if ($ClearCache) { $expoArguments += '--clear' }
    Push-Location (Join-Path $repo 'frontend/mobile')
    try { & $node $expo @expoArguments } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw 'Expo da dung voi loi. Xem thong bao phia tren.' }
} catch {
    Write-Host "LOI: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Stop only the Java child opened by this launcher; never kill another service by port.
    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
        $backendProcess.WaitForExit(5000) | Out-Null
    }
}

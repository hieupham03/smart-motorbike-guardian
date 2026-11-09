[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$LanIp)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$directory=Join-Path $repo '.local\classroom-demo\tls'
$parsed=$null
if (![Net.IPAddress]::TryParse($LanIp,[ref]$parsed) -or $parsed.AddressFamily -ne 'InterNetwork') { throw 'Can IPv4 LAN hop le.' }
$ssl=Get-Command openssl.exe -ErrorAction SilentlyContinue
$openssl=if($ssl){$ssl.Source}else{'C:\msys64\mingw64\bin\openssl.exe'}
if (!(Test-Path -LiteralPath $openssl)) { throw 'Can OpenSSL de tao chung chi local; khong tu tai binary khong ro nguon.' }
New-Item -ItemType Directory -Path $directory -Force | Out-Null
$cert=Join-Path $directory 'localhost-cert.pem'
$key=Join-Path $directory 'localhost-key.pem'
$valid=$false
if ((Test-Path -LiteralPath $cert) -and (Test-Path -LiteralPath $key)) {
    & $openssl x509 -in $cert -noout -checkip $LanIp *> $null
    if ($LASTEXITCODE -eq 0) { & $openssl x509 -in $cert -noout -checkend 86400 *> $null; $valid=$LASTEXITCODE -eq 0 }
}
if (!$valid) {
    foreach ($file in @($cert,$key)) { if (Test-Path -LiteralPath $file) { Copy-Item -LiteralPath $file -Destination ($file+'.bak') } }
    $previousPreference=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        & $openssl req -x509 -newkey rsa:2048 -noenc -keyout $key -out $cert -days 365 -subj '/CN=Guardian classroom local' -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$LanIp" 2> (Join-Path $directory 'generation.log')
        $opensslCode=$LASTEXITCODE
    } finally { $ErrorActionPreference=$previousPreference }
    if ($opensslCode -ne 0) { throw 'Khong tao duoc chung chi local. Xem generation.log.' }
}
$env:GUARDIAN_HTTPS_CERT_FILE=$cert
$env:GUARDIAN_HTTPS_KEY_FILE=$key
Write-Host 'HTTPS certificate/key local ready. Private key stays outside Git.'
& $openssl x509 -in $cert -noout -fingerprint -sha256

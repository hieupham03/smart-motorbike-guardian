[CmdletBinding()]
param([switch]$Restore)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$local=Join-Path $repo '.local\classroom-demo'
$baseline=Join-Path $local 'baseline-unclaimed'
try {
    if (Get-NetTCPConnection -State Listen -LocalPort 8082 -ErrorAction SilentlyContinue) { throw 'Dung backend classroom bang Ctrl+C truoc. Khong ghi de database dang mo.' }
    foreach ($name in @('guardian.mv.db','settings.json','network_config.h')) {
        if (!(Test-Path -LiteralPath (Join-Path $baseline $name))) { throw "Thieu baseline $name. Khong tu tao du lieu gia de thay the." }
    }
    if (!$Restore) { Write-Host 'Baseline da co. Them -Restore de phuc hoi rieng DB classroom; DB hien tai se duoc sao luu truoc.'; return }
    $snapshot=Join-Path $local ('snapshots\'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
    if (![IO.Path]::GetFullPath($snapshot).StartsWith([IO.Path]::GetFullPath($local)+[IO.Path]::DirectorySeparatorChar)) { throw 'Snapshot path khong hop le.' }
    New-Item -ItemType Directory -Path $snapshot -Force | Out-Null
    foreach ($name in @('guardian.mv.db','settings.json')) {
        $current=Join-Path $local $name
        if (Test-Path -LiteralPath $current) { Copy-Item -LiteralPath $current -Destination (Join-Path $snapshot $name) }
        Copy-Item -LiteralPath (Join-Path $baseline $name) -Destination $current
    }
    $network=Join-Path $repo 'firmware\node_a_gateway\network_config.h'
    if (Test-Path -LiteralPath $network) { Copy-Item -LiteralPath $network -Destination (Join-Path $snapshot 'network_config.h') }
    Copy-Item -LiteralPath (Join-Path $baseline 'network_config.h') -Destination $network
    Write-Host 'Da phuc hoi baseline classroom chua claim; du lieu truoc do van o snapshots/. Khong tac dong DB mobile-demo hoac PostgreSQL.'
    Write-Host 'Neu doi LAN/Wi-Fi hoac da rotate khoa, chay -Classroom -Prepare va nap lai Node A truoc demo.'
} catch { Write-Host "LOI: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }

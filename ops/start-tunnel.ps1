$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$config = Join-Path $PSScriptRoot 'cloudflared.yml'
$logDir = Join-Path $root 'logs'
$logPath = Join-Path $logDir 'cloudflared.log'
$restartDelaySeconds = 3

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

if (-not (Test-Path -LiteralPath $cloudflared)) {
    throw "cloudflared executable was not found at $cloudflared"
}
if (-not (Test-Path -LiteralPath $config)) {
    throw "Cloudflare Tunnel configuration is missing at $config"
}

while ($true) {
    "[$(Get-Date -Format o)] Starting web-editor Cloudflare tunnel over HTTP/2." |
        Out-File -LiteralPath $logPath -Append -Encoding utf8

    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $cloudflared tunnel --protocol http2 --config $config --loglevel info --logfile $logPath run web-editor
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    "[$(Get-Date -Format o)] Tunnel exited with code $exitCode; restarting in $restartDelaySeconds seconds." |
        Out-File -LiteralPath $logPath -Append -Encoding utf8
    Start-Sleep -Seconds $restartDelaySeconds
}

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$node = 'C:\Users\wooch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$vinext = Join-Path $root 'node_modules\vinext\dist\cli.js'
$logDir = Join-Path $root 'logs'
$logPath = Join-Path $logDir 'web-server.log'
$errorLogPath = Join-Path $logDir 'web-server-error.log'
$restartDelaySeconds = 3

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

if (-not (Test-Path -LiteralPath $node)) {
    throw "Node.js executable was not found at $node"
}
if (-not (Test-Path -LiteralPath $vinext)) {
    throw "vinext is not installed. Restore project dependencies before starting the service."
}
if (-not (Test-Path -LiteralPath (Join-Path $root 'dist\server\index.js'))) {
    throw "Production build is missing. Build the project before starting the service."
}

Set-Location $root
while ($true) {
    "[$(Get-Date -Format o)] Starting Layout Lab on http://127.0.0.1:3210" |
        Out-File -LiteralPath $logPath -Append -Encoding utf8

    try {
        $previousErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & $node $vinext start --hostname 127.0.0.1 --port 3210 1>> $logPath 2>> $errorLogPath
        $exitCode = $LASTEXITCODE
    }
    catch {
        $_ | Out-String | Out-File -LiteralPath $errorLogPath -Append -Encoding utf8
        $exitCode = 1
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    "[$(Get-Date -Format o)] Web server exited with code $exitCode; restarting in $restartDelaySeconds seconds." |
        Out-File -LiteralPath $logPath -Append -Encoding utf8
    Start-Sleep -Seconds $restartDelaySeconds
}

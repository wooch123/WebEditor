$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$node = 'C:\Users\wooch\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$entry = Join-Path $PSScriptRoot 'start-editor.mjs'
$logDir = Join-Path $root 'logs'
$logPath = Join-Path $logDir 'web-server.log'
$errorLogPath = Join-Path $logDir 'web-server-error.log'
$restartDelaySeconds = 3

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

if (-not (Test-Path -LiteralPath $node)) {
    throw "Node.js executable was not found at $node"
}
if (-not (Test-Path -LiteralPath $entry)) {
    throw "Editor server entry was not found at $entry"
}
if (-not (Test-Path -LiteralPath (Join-Path $root 'dist\server\index.js'))) {
    throw "Production build is missing. Build the project before starting the service."
}

Set-Location $root
$env:NODE_ENV = 'production'
$env:HOST = '127.0.0.1'
$env:PORT = '5173'
while ($true) {
    "[$(Get-Date -Format o)] Starting Layout Lab on http://127.0.0.1:5173/editor/" |
        Out-File -LiteralPath $logPath -Append -Encoding utf8

    try {
        $previousErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & $node $entry 1>> $logPath 2>> $errorLogPath
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

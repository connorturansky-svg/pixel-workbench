# Registers the Pixel Workbench feature builder as a Windows scheduled task that runs every 5 minutes while
# you're signed in. Needs: gh signed in as J-Turansky, the Copilot CLI signed in, Node.js, and Python with Playwright.
# Usage: .\automation\Install-Builder.ps1            (install or update)
#        .\automation\Install-Builder.ps1 -Remove    (uninstall)
param([switch]$Remove, [int]$EveryMinutes = 5)
$ErrorActionPreference = 'Stop'
$name = 'PixelWorkbenchBuilder'
if ($Remove) {
    Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed $name."
    return
}
$repo = Split-Path $PSScriptRoot -Parent
$py = (Get-Command pythonw.exe -ErrorAction Stop).Source
foreach ($tool in 'gh', 'copilot', 'node', 'git') { Get-Command $tool -ErrorAction Stop | Out-Null }
gh auth token -u J-Turansky *> $null
if ($LASTEXITCODE) { throw 'gh is not signed in as J-Turansky. Run: gh auth login -h github.com -w' }
& (Get-Command python.exe).Source -c "import playwright" 2>$null
if ($LASTEXITCODE) { throw 'Python Playwright is missing. Run: pip install playwright; python -m playwright install chromium' }

$action = New-ScheduledTaskAction -Execute $py -Argument "`"$repo\automation\builder.py`" --once" -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 3)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
    -Description 'Builds Pixel Workbench [Feature] issues with the Copilot CLI and publishes them (automation\builder.py).' -Force | Out-Null
Write-Host "Installed $name: runs every $EveryMinutes minutes while you're signed in."
Write-Host "Logs: $env:LOCALAPPDATA\PixelWorkbenchBuilder\logs\builder.log"

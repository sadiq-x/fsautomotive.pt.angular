#Requires -Version 5.1

<#
.SYNOPSIS
    Publishes the FS Automotive site to GitHub Pages.

.DESCRIPTION
    Wraps `ng deploy` with the guards that matter for a publish:

      * runs from the repository root, whatever directory you invoke it from;
      * installs dependencies if node_modules is missing;
      * refuses to publish a dirty working tree (uncommitted work would ship
        without ever having been reviewed);
      * runs the verification gate first, so a broken build never reaches
        production;
      * asks for confirmation before the publish itself, and supports -WhatIf.

    The --base-href is required because the site is served from a subdirectory
    (https://<user>.github.io/fsautomotive.pt.angular/). angular-cli-ghpages
    also writes 404.html and .nojekyll, which is what makes deep links work.

.PARAMETER BaseHref
    Base path the site is served from. Keep the default for GitHub Pages; use
    '/' once the site moves to a custom domain.

.PARAMETER SkipVerify
    Skip format, tests and build. Only for re-publishing a commit already
    verified in this session.

.PARAMETER AllowDirty
    Publish even with uncommitted changes in the working tree.

.EXAMPLE
    ./scripts/deploy.ps1
    Verifies, then publishes to GitHub Pages after confirmation.

.EXAMPLE
    ./scripts/deploy.ps1 -WhatIf
    Shows what would happen without publishing anything.

.EXAMPLE
    ./scripts/deploy.ps1 -BaseHref '/' -SkipVerify
    Publishes for a custom domain, skipping the verification gate.
#>

[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter()]
    [ValidatePattern('^/([\w.\-]+/)*$')]
    [string]$BaseHref = '/fsautomotive.pt.angular/',

    [Parameter()]
    [switch]$SkipVerify,

    [Parameter()]
    [switch]$AllowDirty
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Repository root is the parent of scripts/, so the script works from anywhere.
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Write-Step {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Note {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "    $Message" -ForegroundColor DarkGray
}

# Runs a native command and turns a non-zero exit code into a terminating error.
# Without this, PowerShell would happily continue past a failed build.
function Invoke-Native {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter(Mandatory)][string]$FailureMessage
    )

    Write-Note "$FilePath $($Arguments -join ' ')"
    & $FilePath @Arguments

    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "$FailureMessage (exit code $exitCode)"
    }
}

Push-Location $RepoRoot
try {
    Write-Step "FS Automotive — deploy"
    Write-Note "repository : $RepoRoot"
    Write-Note "base href  : $BaseHref"

    # --- Tooling -----------------------------------------------------------
    foreach ($tool in 'npm', 'npx') {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            throw "'$tool' was not found on PATH. Install Node.js 20.19+, 22.12+ or 24+."
        }
    }

    # --- Working tree ------------------------------------------------------
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $status = @(& git status --porcelain 2>$null)
        if ($LASTEXITCODE -eq 0 -and $status.Count -gt 0) {
            if ($AllowDirty) {
                Write-Warning "Publishing with $($status.Count) uncommitted change(s) (-AllowDirty)."
            }
            else {
                $status | Select-Object -First 10 | ForEach-Object { Write-Note $_ }
                throw "Working tree is not clean. Commit your changes, or pass -AllowDirty."
            }
        }
    }
    else {
        Write-Warning "git not found; skipping the clean-working-tree check."
    }

    # --- Dependencies ------------------------------------------------------
    if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
        Write-Step "Installing dependencies"
        $install = if (Test-Path (Join-Path $RepoRoot 'package-lock.json')) { 'ci' } else { 'install' }
        Invoke-Native -FilePath 'npm' -Arguments @($install) -FailureMessage 'Dependency installation failed'
    }

    # --- Verification gate -------------------------------------------------
    if ($SkipVerify) {
        Write-Warning "Skipping format, tests and build (-SkipVerify)."
    }
    else {
        Write-Step "Verifying (format, tests, build)"
        Invoke-Native -FilePath 'npm' -Arguments @('run', 'verify') `
            -FailureMessage 'Verification failed — nothing was published'
    }

    # --- Publish -----------------------------------------------------------
    $target = "GitHub Pages (base href $BaseHref)"
    if (-not $PSCmdlet.ShouldProcess($target, 'Publish the site')) {
        Write-Note 'Publish cancelled.'
        return
    }

    # Two steps on purpose: `ng deploy` has no --define option, so the bundle
    # is built first (with .env values injected and the right base href) and
    # then published as-is with --no-build.
    Write-Step "Building for GitHub Pages"
    Invoke-Native -FilePath 'node' `
        -Arguments @('--env-file-if-exists=.env', '--env-file-if-exists=.env.local',
                     'scripts/ng-env.mjs', 'build', "--base-href=$BaseHref") `
        -FailureMessage 'Production build failed'

    Write-Step "Publishing to GitHub Pages"
    Invoke-Native -FilePath 'npx' -Arguments @('ng', 'deploy', '--no-build') `
        -FailureMessage 'ng deploy failed'

    Write-Host "`n[OK] Published with base href $BaseHref" -ForegroundColor Green
}
catch {
    Write-Host "`n[FAILED] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

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

.PARAMETER SkipPagesCheck
    Skip the GitHub Pages deployment checks. Without it the script refuses to
    publish while a previous deployment is still running (GitHub rejects that
    with an opaque 400), and afterwards waits for the new deployment to finish
    rather than reporting success the moment the push completes.

.PARAMETER DevAuthStub
    Publish a bundle with the development authentication stub ACTIVE, so
    /gestao/entrar accepts any password on the live site. Use it only to
    demonstrate the management area before an auth backend is deployed.

    The stub is gated twice on purpose: the build guard in
    scripts/lib/env.mjs, and isDevMode() in src/app/core/config/auth.config.ts.
    An optimised build strips ngDevMode, so the stub would be inert however the
    guard is set — the only bundle in which it actually runs is the
    'development' configuration. This switch therefore builds with
    --configuration development, which means the published site is
    unminified, carries source maps and runs Angular in development mode.

    Verification still runs format, unit tests and the script tests; only the
    production build check is skipped, because it exists to refuse this.

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
    [switch]$AllowDirty,

    [Parameter()]
    [switch]$SkipPagesCheck,

    [Parameter()]
    [switch]$DevAuthStub
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

<#
    GitHub Pages publishes asynchronously.

    `ng deploy` pushes a commit to `gh-pages` and exits 0 immediately; GitHub
    then runs its own "pages build and deployment" afterwards, and that is what
    can fail. Two consequences this script has to handle:

      * Pushing while a previous deployment is still running is rejected with an
        opaque 400 ("due to in progress deployment"), and every later attempt
        fails the same way until the first one clears.
      * Reporting success on a successful push is a lie — the publish may fail
        minutes later, leaving the live site on the previous build.

    Both are answered by reading the deployment state. Anonymous requests work
    for a public repository; set GITHUB_TOKEN for a private one or to avoid the
    60-requests-per-hour anonymous limit. Every call is best-effort: an API
    problem must never fail a deploy that is otherwise fine.
#>

function Get-RepoSlug {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return $null }

    $url = & git remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($url)) { return $null }

    # Matches both git@github.com:owner/repo.git and https://github.com/owner/repo
    if ($url -match '[:/]([^/:]+)/([^/]+?)(\.git)?\s*$') {
        return "$($Matches[1])/$($Matches[2])"
    }

    return $null
}

function Get-PagesDeployment {
    param([Parameter(Mandatory)][string]$Slug)

    $headers = @{
        'Accept'     = 'application/vnd.github+json'
        'User-Agent' = 'fsautomotive-deploy'
    }
    if ($env:GITHUB_TOKEN) { $headers['Authorization'] = "Bearer $env:GITHUB_TOKEN" }

    $base = "https://api.github.com/repos/$Slug"
    $deployments = @(Invoke-RestMethod -Uri "$base/deployments?environment=github-pages&per_page=1" `
        -Headers $headers -TimeoutSec 15)
    if ($deployments.Count -eq 0) { return $null }

    $deployment = $deployments[0]
    $statuses = @(Invoke-RestMethod -Uri "$base/deployments/$($deployment.id)/statuses?per_page=1" `
        -Headers $headers -TimeoutSec 15)

    return [pscustomobject]@{
        Id    = $deployment.id
        Sha   = "$($deployment.sha)".Substring(0, 8)
        State = if ($statuses.Count -gt 0) { $statuses[0].state } else { 'unknown' }
    }
}

# Refuses to push into a deployment that is still running, because GitHub would
# reject it and every subsequent attempt until it clears.
function Assert-PagesReady {
    param([Parameter(Mandatory)][string]$Slug)

    try { $current = Get-PagesDeployment -Slug $Slug }
    catch {
        Write-Note "could not read the Pages deployment state; continuing ($($_.Exception.Message))"
        return
    }

    if ($null -eq $current) { return }
    Write-Note "last Pages deployment: $($current.Sha) -> $($current.State)"

    if ($current.State -in @('in_progress', 'queued', 'waiting', 'pending')) {
        throw ("A GitHub Pages deployment for $($current.Sha) is still '$($current.State)'. " +
               "Publishing now would be rejected by GitHub. Wait for it to finish, or cancel it " +
               "under Actions > 'pages build and deployment'. Use -SkipPagesCheck to publish anyway.")
    }
}

# GitHub records the real reason on the workflow run's check annotations, not on
# the deployment. Without this the script can only say "rejected", when GitHub
# knows something far more useful — e.g. that a previous deployment is stuck and
# names the one to cancel.
function Get-PagesFailureReason {
    param([Parameter(Mandatory)][string]$Slug)

    $headers = @{
        'Accept'     = 'application/vnd.github+json'
        'User-Agent' = 'fsautomotive-deploy'
    }
    if ($env:GITHUB_TOKEN) { $headers['Authorization'] = "Bearer $env:GITHUB_TOKEN" }

    try {
        $base = "https://api.github.com/repos/$Slug"
        $runs = Invoke-RestMethod -Uri "$base/actions/runs?per_page=1" -Headers $headers -TimeoutSec 15
        if (-not $runs.workflow_runs -or $runs.workflow_runs.Count -eq 0) { return $null }

        $jobs = Invoke-RestMethod -Uri "$base/actions/runs/$($runs.workflow_runs[0].id)/jobs" `
            -Headers $headers -TimeoutSec 15
        $failed = @($jobs.jobs | Where-Object { $_.conclusion -eq 'failure' })
        if ($failed.Count -eq 0) { return $null }

        $annotations = @(Invoke-RestMethod -Uri "$($failed[0].check_run_url)/annotations" `
            -Headers $headers -TimeoutSec 15)
        $messages = @($annotations | ForEach-Object { $_.message } | Where-Object { $_ })
        if ($messages.Count -eq 0) { return $null }

        # The first line of the first annotation is the actionable sentence.
        return ($messages[0] -split "`n")[0]
    }
    catch { return $null }
}

# Waits for the deployment triggered by this publish. $true published,
# $false rejected, $null still unresolved when the timeout expired.
function Wait-PagesDeployment {
    param(
        [Parameter(Mandatory)][string]$Slug,
        [int]$TimeoutSeconds = 300
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastState = ''

    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 10

        try { $deployment = Get-PagesDeployment -Slug $Slug }
        catch { continue }

        if ($null -eq $deployment) { continue }

        if ($deployment.State -ne $lastState) {
            Write-Note "$($deployment.Sha): $($deployment.State)"
            $lastState = $deployment.State
        }

        if ($deployment.State -eq 'success') { return $true }
        if ($deployment.State -in @('failure', 'error')) { return $false }
    }

    return $null
}

Push-Location $RepoRoot
try {
    Write-Step "FS Automotive — deploy"
    Write-Note "repository : $RepoRoot"
    Write-Note "base href  : $BaseHref"
    if ($DevAuthStub) {
        Write-Warning ("Publishing with the development authentication stub ACTIVE: " +
                       "any password will be accepted at $BaseHref" + "gestao/entrar. " +
                       "The bundle is unoptimised because the stub only runs in a " +
                       "development build.")
    }

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
    #
    # Deliberately NOT `npm run verify`. That script ends in `npm run build`,
    # which has no --base-href and so emits a '/'-rooted bundle this script
    # immediately discards and rebuilds with the Pages base href — two full
    # production builds per publish, the first one wrong for the target.
    #
    # The gate is unchanged: the same three checks run here, and the build below
    # is still part of it. A failing build throws before anything is published,
    # and it is the build whose output actually ships.
    if ($SkipVerify) {
        Write-Warning "Skipping format, tests and build (-SkipVerify)."
    }
    else {
        Write-Step "Verifying (format, tests)"
        foreach ($script in 'format:check', 'test', 'test:scripts') {
            Invoke-Native -FilePath 'npm' -Arguments @('run', $script) `
                -FailureMessage "Verification failed at '$script' — nothing was published"
        }
    }

    # --- Publish -----------------------------------------------------------
    $slug = Get-RepoSlug
    if ($null -eq $slug) {
        Write-Note 'could not determine the GitHub repository; skipping the Pages checks'
    }
    elseif ($SkipPagesCheck) {
        Write-Warning 'Skipping the GitHub Pages deployment checks (-SkipPagesCheck).'
    }
    else {
        Write-Step "Checking GitHub Pages ($slug)"
        Assert-PagesReady -Slug $slug
    }

    $target = "GitHub Pages (base href $BaseHref)"
    if (-not $PSCmdlet.ShouldProcess($target, 'Publish the site')) {
        Write-Note 'Publish cancelled.'
        return
    }

    # Two steps on purpose: `ng deploy` has no --define option, so the bundle
    # is built first (with .env values injected and the right base href) and
    # then published as-is with --no-build.
    $buildArguments = @('--env-file-if-exists=.env', '--env-file-if-exists=.env.local',
                        'scripts/ng-env.mjs', 'build', "--base-href=$BaseHref")
    if ($DevAuthStub) {
        # The only configuration that keeps ngDevMode, and so the only one in
        # which the stub is more than dead code.
        $buildArguments += @('--configuration', 'development')
    }

    Write-Step $(if ($DevAuthStub) { "Building for GitHub Pages (development configuration, stub active)" }
                 else { "Building for GitHub Pages" })
    Invoke-Native -FilePath 'node' -Arguments $buildArguments `
        -FailureMessage 'Production build failed'

    Write-Step "Publishing to GitHub Pages"
    Invoke-Native -FilePath 'npx' -Arguments @('ng', 'deploy', '--no-build') `
        -FailureMessage 'ng deploy failed'

    # The push has landed on gh-pages; GitHub has not published it yet. Waiting
    # is what turns "[OK] Published" from a guess into a fact.
    if ($null -ne $slug -and -not $SkipPagesCheck) {
        Write-Step "Waiting for GitHub Pages to publish"
        $published = Wait-PagesDeployment -Slug $slug

        if ($published -eq $false) {
            $reason = Get-PagesFailureReason -Slug $slug
            $detail = if ($reason) { "`n           GitHub said: $reason" } else { '' }

            throw ('GitHub Pages rejected the deployment. The commit is on gh-pages but the ' +
                   'site was NOT updated.' + $detail + "`n           " +
                   'If it names a deployment to cancel and that one already shows as failed, ' +
                   'the Pages lock is stuck: delete the "github-pages" environment under ' +
                   'Settings > Environments (it is recreated automatically), then re-run.')
        }

        if ($null -eq $published) {
            Write-Warning ('Timed out waiting for GitHub Pages. The push succeeded; the publish ' +
                           'may still be running. Check Actions > "pages build and deployment".')
        }
    }

    if ($DevAuthStub) {
        Write-Host "`n[OK] Published with base href $BaseHref — WITH THE AUTH STUB ACTIVE." -ForegroundColor Yellow
        Write-Host "     Anyone can sign in at $BaseHref" -NoNewline -ForegroundColor Yellow
        Write-Host "gestao/entrar with any password." -ForegroundColor Yellow
    }
    else {
        Write-Host "`n[OK] Published with base href $BaseHref" -ForegroundColor Green
    }
}
catch {
    Write-Host "`n[FAILED] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

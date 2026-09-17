#Requires -Version 5.1

<#
.SYNOPSIS
    Builds the FS Automotive site and pushes the production bundle to
    `nf-pages`, the branch Netlify is configured to serve.

.DESCRIPTION
    A sibling of deploy.ps1 and deploy-github-pages-custom-domain.ps1, which
    remain the scripts for GitHub Pages. All three publish the same way — a
    production build, then `ng deploy --no-build` (angular-cli-ghpages) commits
    the built output onto a dedicated branch and force-pushes it. This one
    targets `nf-pages` instead of `gh-pages`, and drops everything in the other
    two that is GitHub-Pages-specific (no CNAME, no 404.html trick, no Pages
    deployment polling — Netlify has none of those mechanics).

    THE NETLIFY SIDE OF THIS
    ------------------------
    `nf-pages` holds a ready-to-serve static bundle, not source. Point the
    Netlify site at that branch with:

      Build command:      (leave empty)
      Publish directory:  /  (the branch root)

    Netlify then deploys on every push to `nf-pages` without running a build of
    its own, and needs none of this project's environment variables — they are
    already baked into the bundle by the time this script pushes it.

    WHY THIS RUNS FROM `main` ONLY
    -------------------------------
    A production publish decided from anywhere else is a production publish
    nobody can reconstruct afterwards. The script refuses to run from any other
    branch, and refuses to run when local `main` and `origin/main` disagree —
    in either direction — so what ships is always exactly what is on the
    remote, not a local commit nobody has seen yet or a stale checkout missing
    one nobody has pulled.

    WHY IT CHECKS WHETHER `nf-pages` ALREADY HAS THIS COMMIT
    -----------------------------------------------------------
    Every push here force-rewrites `nf-pages`. Before doing that, the script
    reads the last commit message already on `origin/nf-pages` (each publish
    stamps it with the `main` commit it was built from) and compares it to the
    current `main` HEAD. A match means nothing has changed since the last
    publish, and the script stops rather than forcing an identical rebuild and
    a pointless Netlify deploy. -Force skips this and republishes anyway.

    SECURITY GATE
    -------------
    Runs before the build, not after, so a problem is caught before minutes are
    spent building something that cannot ship:

      * `check:env-templates` — fails if a committed `.env.example` carries a
        real value (see docs/AUDIT.md §5.1 for why this exists: a credential
        was re-committed there once already).
      * Confirms `.env`, `.env.local` and `server/.env` are actually
        git-ignored, not merely absent from a `git status` right now.
      * `npm audit` on production dependencies, reported but non-blocking —
        this project's known advisories are dev-tooling-only and never reach
        the browser (see docs/AUDIT.md §6), so failing the deploy on them would
        train people to ignore this gate instead of reading it.

    After the build, the bundle itself is scanned for every value configured in
    `server/.env` — which must never be readable by a build that only ever
    touches the root workspace — the same direct-substring check docs/AUDIT.md
    used by hand, now automatic on every publish.

.PARAMETER SkipVerify
    Skip format, tests and script tests. The build and the post-build content
    and secret-leak gates still run — those are what protect what ships.

.PARAMETER AllowDirty
    Publish even with uncommitted changes in the working tree.

.PARAMETER Force
    Publish even if `nf-pages` already reflects the current `main` commit.

.PARAMETER BuildOnly
    Build and run every check, then stop. Publishes nothing.

.EXAMPLE
    ./scripts/deploy-netlify.ps1 -BuildOnly
    Builds for Netlify and runs every check, without publishing.

.EXAMPLE
    ./scripts/deploy-netlify.ps1
    Verifies, builds, checks, then publishes to nf-pages after confirmation.

.EXAMPLE
    ./scripts/deploy-netlify.ps1 -WhatIf
    Shows what would happen without publishing anything.
#>

[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter()]
    [switch]$SkipVerify,

    [Parameter()]
    [switch]$AllowDirty,

    [Parameter()]
    [switch]$Force,

    [Parameter()]
    [switch]$BuildOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Netlify serves the branch root directly, exactly like the custom domain: no
# GitHub-Pages-style subdirectory to account for.
$BaseHref = '/'
$MainBranch = 'main'
$DeployBranch = 'nf-pages'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$OutputRoot = Join-Path $RepoRoot 'dist/fsautomotive'
$PublishDir = Join-Path $OutputRoot 'browser'

function Write-Step {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Note {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "    $Message" -ForegroundColor DarkGray
}

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

# Refuses to run from anywhere but main. A production publish decided from a
# feature branch or a detached HEAD is not reconstructable afterwards.
function Assert-OnMainBranch {
    $current = (& git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not determine the current git branch.'
    }
    if ($current -ne $MainBranch) {
        throw "Must be run from '$MainBranch' (currently on '$current'). Checkout $MainBranch and re-run."
    }
}

# Fails in either direction: a local commit origin has not seen would publish
# something nobody has reviewed, and a local checkout missing a remote commit
# would publish something stale without saying so.
function Assert-MainInSyncWithOrigin {
    Invoke-Native -FilePath 'git' -Arguments @('fetch', 'origin', $MainBranch, '--quiet') `
        -FailureMessage "Could not fetch origin/$MainBranch"

    $local = (& git rev-parse $MainBranch 2>$null).Trim()
    $remote = (& git rev-parse "origin/$MainBranch" 2>$null).Trim()

    if ($local -ne $remote) {
        throw ("Local $MainBranch ($($local.Substring(0,8))) and origin/$MainBranch " +
               "($($remote.Substring(0,8))) disagree. Push or pull before publishing to " +
               'production, so what ships is exactly what is on the remote.')
    }

    return $local
}

# `nf-pages` is stamped with the main commit it was built from, so a repeat
# publish of the same commit can be recognised and skipped instead of forcing
# an identical rebuild for no reason.
function Test-AlreadyDeployed {
    param([Parameter(Mandatory)][string]$MainSha)

    & git fetch origin $DeployBranch --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { return $false }

    $message = (& git log FETCH_HEAD -1 --pretty=%B 2>$null) -join "`n"
    if ($LASTEXITCODE -ne 0) { return $false }

    return $message -match [regex]::Escape($MainSha)
}

# `check:env-templates` catches a real value committed to a template. This
# catches the other half: a file the templates describe as gitignored that
# somehow is not — the exact shape of the regression docs/AUDIT.md §5.1 records.
function Assert-EnvFilesIgnored {
    param([Parameter(Mandatory)][string[]]$Paths)

    foreach ($path in $Paths) {
        $fullPath = Join-Path $RepoRoot $path
        if (-not (Test-Path $fullPath)) { continue }

        & git check-ignore --quiet $path 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw ("'$path' exists and is NOT git-ignored. It must never be committed — " +
                   'check .gitignore before doing anything else.')
        }
    }

    Write-Note "$($Paths -join ', ') — ignored where present"
}

# The direct-substring check docs/AUDIT.md performed by hand against the
# GitHub Pages bundle, automated here against server/.env. The frontend build
# never reads that file, so a match on a genuinely secret value means
# something is seriously wrong, not just untidy.
#
# Checked by KEY NAME, not by a length threshold on every value: NODE_ENV,
# LOG_LEVEL and similar config values are short English words or common
# strings ("development", "info") that Angular's own framework code contains
# for unrelated reasons, and a length-only check flags those constantly. A
# name pattern targets what is actually sensitive and generalises to whatever
# gets added to server/.env later, the same way it would to today's file.
function Assert-NoServerSecretsInBundle {
    param(
        [Parameter(Mandatory)][string]$Directory,
        [Parameter(Mandatory)][string]$ServerEnvPath
    )

    if (-not (Test-Path $ServerEnvPath)) {
        Write-Note 'server/.env not present locally — nothing to cross-check.'
        return
    }

    $secretKeyPattern = 'PASSWORD|SECRET|_KEY|_KEYS|TOKEN|CREDENTIAL|USERNAME'
    $secrets = @()
    foreach ($line in Get-Content -Path $ServerEnvPath) {
        $trimmed = $line.Trim()
        if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }

        $separatorIndex = $trimmed.IndexOf('=')
        if ($separatorIndex -lt 0) { continue }

        $key = $trimmed.Substring(0, $separatorIndex).Trim()
        if ($key -notmatch $secretKeyPattern) { continue }

        $value = $trimmed.Substring($separatorIndex + 1).Trim().Trim('"').Trim("'")
        # A short value (e.g. an unset or placeholder secret) is too generic to
        # check meaningfully and would only produce noise.
        if ($value.Length -ge 8) { $secrets += $value }
    }

    if ($secrets.Count -eq 0) {
        Write-Note 'server/.env has no values worth cross-checking.'
        return
    }

    $bundleFiles = Get-ChildItem -Path $Directory -Recurse -File -Include '*.js', '*.html', '*.css'
    $leaked = @()

    foreach ($secret in ($secrets | Select-Object -Unique)) {
        foreach ($file in $bundleFiles) {
            if ((Get-Content -Path $file.FullName -Raw) -like "*$secret*") {
                $leaked += $file.FullName
                break
            }
        }
    }

    if ($leaked.Count -gt 0) {
        throw ("A value from server/.env was found in the built bundle " +
               "($($leaked -join ', ')). The frontend build must never read server/.env — " +
               'stop and find out how it got in before publishing anything.')
    }

    Write-Note "$($secrets.Count) server/.env value(s) checked — none appear in the bundle"
}

# Refuses to publish a bundle that would fail to render or route on Netlify.
function Assert-PublishableBundle {
    param([Parameter(Mandatory)][string]$Directory)

    $indexPath = Join-Path $Directory 'index.html'
    if (-not (Test-Path $indexPath)) {
        throw "No index.html in $Directory — the build did not produce a site."
    }

    $html = Get-Content -Path $indexPath -Raw

    if ($html -notmatch '<base\s+href="/"\s*/?>') {
        $found = if ($html -match '<base[^>]*>') { $Matches[0] } else { '(no <base> tag)' }
        throw "index.html must carry <base href=`"/`"> for a root-served site; found: $found"
    }

    if ($html -match '/fsautomotive\.pt\.angular/') {
        throw ('index.html references the GitHub Pages project-site path ' +
               '/fsautomotive.pt.angular/ — it was built with the wrong base href.')
    }

    # Netlify has no GitHub-Pages-style 404-to-200 fallback: without this,
    # reloading any deep link (e.g. /private/login) 404s instead of routing.
    # Shipped as `public/_redirects`, copied verbatim into every build by the
    # assets glob in angular.json — this only guards against it being removed
    # or edited there, not against ng-env.mjs at build time.
    $redirectsPath = Join-Path $Directory '_redirects'
    $expectedRedirect = '/*    /index.html   200'
    if (-not (Test-Path $redirectsPath)) {
        throw "No _redirects in $Directory — public/_redirects is missing or was not copied. " +
              'Deep links would 404 on Netlify instead of routing.'
    }
    $redirects = (Get-Content -Path $redirectsPath -Raw).Trim()
    if ($redirects -ne $expectedRedirect) {
        throw "_redirects contains '$redirects'; expected exactly '$expectedRedirect'."
    }

    $references = @()
    $references += ([regex]::Matches($html, '<script[^>]+src="([^"]+)"') |
                    ForEach-Object { $_.Groups[1].Value })
    $references += ([regex]::Matches($html, '<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"') |
                    ForEach-Object { $_.Groups[1].Value })
    $references += ([regex]::Matches($html, '<link[^>]+href="([^"]+)"[^>]*rel="stylesheet"') |
                    ForEach-Object { $_.Groups[1].Value })

    $local = $references | Where-Object { $_ -notmatch '^(https?:)?//' } | Select-Object -Unique
    if ($local.Count -eq 0) {
        throw 'index.html references no local script or stylesheet — that is not a built bundle.'
    }

    $missing = @()
    foreach ($reference in $local) {
        $relative = ($reference -replace '^/', '') -replace '[?#].*$', ''
        if (-not (Test-Path (Join-Path $Directory $relative))) {
            $missing += $reference
        }
    }

    if ($missing.Count -gt 0) {
        throw "index.html references files that were not emitted: $($missing -join ', ')"
    }

    Write-Note "base href / · _redirects present · $($local.Count) local asset(s), all present"
}

Push-Location $RepoRoot
try {
    Write-Step 'FS Automotive — publish to Netlify (nf-pages)'
    Write-Note "repository : $RepoRoot"
    Write-Note "base href  : $BaseHref"
    Write-Note "branch     : $DeployBranch"
    Write-Note "publish dir: $PublishDir"

    # --- Branch and sync guards ---------------------------------------------
    Write-Step 'Checking branch and sync state'
    Assert-OnMainBranch

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'git was not found on PATH.'
    }

    $status = @(& git status --porcelain 2>$null)
    if ($LASTEXITCODE -eq 0 -and $status.Count -gt 0) {
        if ($AllowDirty) {
            Write-Warning "Publishing with $($status.Count) uncommitted change(s) (-AllowDirty)."
        }
        else {
            $status | Select-Object -First 10 | ForEach-Object { Write-Note $_ }
            throw 'Working tree is not clean. Commit your changes, or pass -AllowDirty.'
        }
    }

    $mainSha = Assert-MainInSyncWithOrigin
    Write-Note "main is at $($mainSha.Substring(0,8)), matching origin/$MainBranch"

    if (-not $Force -and (Test-AlreadyDeployed -MainSha $mainSha)) {
        Write-Host "`n[OK] $DeployBranch already reflects $($mainSha.Substring(0,8)) — nothing to deploy." -ForegroundColor Green
        Write-Note 'Use -Force to publish again anyway.'
        return
    }

    # --- Dependencies --------------------------------------------------------
    if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
        Write-Step 'Installing dependencies'
        $install = if (Test-Path (Join-Path $RepoRoot 'package-lock.json')) { 'ci' } else { 'install' }
        Invoke-Native -FilePath 'npm' -Arguments @($install) -FailureMessage 'Dependency installation failed'
    }

    # --- Security gate ---------------------------------------------------------
    Write-Step 'Security checks'
    Invoke-Native -FilePath 'npm' -Arguments @('run', 'check:env-templates') `
        -FailureMessage 'A committed .env.example carries a real value — see docs/AUDIT.md §5.1'

    Assert-EnvFilesIgnored -Paths @('.env', '.env.local', 'server/.env', 'server/.env.local')

    Write-Note 'npm audit (production dependencies, informational — see docs/AUDIT.md §6)'
    & npm audit --omit=dev --audit-level=high 2>&1 | ForEach-Object { Write-Note $_ }
    if ($LASTEXITCODE -ne 0) {
        Write-Warning 'npm audit reported an issue in production dependencies. Review before publishing.'
    }

    # --- Verification gate ---------------------------------------------------
    #
    # Not `npm run verify`: that ends in a build with no --base-href, which
    # this script would immediately discard and rebuild with the right one.
    if ($SkipVerify) {
        Write-Warning 'Skipping format, tests and script tests (-SkipVerify).'
    }
    else {
        Write-Step 'Verifying (format, tests)'
        foreach ($script in 'format:check', 'test', 'test:scripts') {
            Invoke-Native -FilePath 'npm' -Arguments @('run', $script) `
                -FailureMessage "Verification failed at '$script' — nothing was published"
        }
    }

    # --- Clean previous output ------------------------------------------------
    if (Test-Path $OutputRoot) {
        Write-Step 'Cleaning previous build output'
        Write-Note $OutputRoot
        Remove-Item -Path $OutputRoot -Recurse -Force
    }

    # --- Build ----------------------------------------------------------------
    Write-Step "Building for Netlify (base href $BaseHref)"
    Invoke-Native -FilePath 'node' -Arguments @(
        '--env-file-if-exists=.env',
        '--env-file-if-exists=.env.local',
        'scripts/ng-env.mjs', 'build', "--base-href=$BaseHref"
    ) -FailureMessage 'Production build failed'

    # --- Gates -----------------------------------------------------------------
    Write-Step 'Checking the built bundle'
    Assert-PublishableBundle -Directory $PublishDir
    Assert-NoServerSecretsInBundle -Directory $PublishDir -ServerEnvPath (Join-Path $RepoRoot 'server/.env')

    if ($BuildOnly) {
        Write-Host "`n[OK] Built and verified for Netlify — nothing was published (-BuildOnly)." -ForegroundColor Green
        Write-Note "Output: $PublishDir"
        return
    }

    # --- Publish ---------------------------------------------------------------
    $target = "Netlify via $DeployBranch (base href $BaseHref)"
    if (-not $PSCmdlet.ShouldProcess($target, 'Publish the site')) {
        Write-Note 'Publish cancelled.'
        return
    }

    $commitMessage = "Deploy $($mainSha.Substring(0,8)) from $MainBranch ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"

    Write-Step "Publishing to $DeployBranch"
    Invoke-Native -FilePath 'npx' -Arguments @(
        'ng', 'deploy', '--no-build',
        "--dir=dist/fsautomotive/browser",
        "--branch=$DeployBranch",
        '--no-notfound', '--no-nojekyll',
        "--message=$commitMessage"
    ) -FailureMessage 'ng deploy failed'

    Write-Host "`n[OK] Pushed $($mainSha.Substring(0,8)) to $DeployBranch." -ForegroundColor Green
    Write-Note 'Netlify deploys on push to that branch — check the Netlify dashboard for the deploy result.'
}
catch {
    Write-Host "`n[FAILED] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

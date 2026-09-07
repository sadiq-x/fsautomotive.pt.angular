#Requires -Version 5.1

<#
.SYNOPSIS
    Publishes the FS Automotive site to GitHub Pages for the custom domain
    fsautomotive.pt (served from the root path).

.DESCRIPTION
    A sibling of scripts/deploy.ps1, which remains the script for the GitHub
    project site. Both publish the same way — a production build, then
    `ng deploy --no-build` (angular-cli-ghpages) onto gh-pages. They differ in
    where the site is served from, and that single difference is what breaks a
    build published to the wrong one:

      deploy.ps1                          this script
      ------------------------------      ---------------------------------
      base href /fsautomotive.pt.angular/ base href /
      https://<user>.github.io/<repo>/    https://fsautomotive.pt/
      no CNAME                            CNAME, written and verified

    A bundle built for one is broken on the other. index.html loads, every
    hashed chunk and stylesheet 404s, and the page renders blank — which is the
    symptom this script exists to prevent.

    WHAT IT ADDS OVER deploy.ps1

      * -Domain, validated as a bare host: no scheme, no path, no trailing
        slash, and not a www subdomain, because a CNAME file containing any of
        those is silently ignored by GitHub Pages.
      * A CNAME file written into the build output *and* passed to
        `ng deploy --cname`. Either alone would do; both means the published
        root has it whichever way angular-cli-ghpages resolves the directory.
      * An explicit clean of the build output before building, so a chunk from
        an earlier base href cannot survive into the publish.
      * An explicit --dir, so what is published is the built browser bundle and
        never the source tree.
      * A validation gate that runs after the build and BEFORE the publish, and
        refuses to publish a bundle that would render blank: it checks the base
        href, that no asset URL carries the project-site prefix, the exact
        CNAME contents, and that every script and stylesheet index.html
        references exists on disk.
      * -BuildOnly, which stops after that gate. It needs no credentials and
        touches nothing remote, so the whole build can be verified locally.

    Deliberately NOT carried over: deploy.ps1's -DevAuthStub. That switch
    publishes a development bundle in which any password is accepted. It exists
    to demo the management area on the project site; pointing it at the
    production domain is not a thing anyone should be one flag away from.

.PARAMETER Domain
    The custom domain, as a bare host. Written verbatim to CNAME.

.PARAMETER SkipVerify
    Skip format, tests and script tests. The build and the post-build gate
    still run — those are what protect the published site.

.PARAMETER AllowDirty
    Publish even with uncommitted changes in the working tree.

.PARAMETER BuildOnly
    Build and validate, then stop. Publishes nothing.

.EXAMPLE
    ./scripts/deploy-github-pages-custom-domain.ps1 -BuildOnly
    Builds for the custom domain and runs every check, without publishing.

.EXAMPLE
    ./scripts/deploy-github-pages-custom-domain.ps1
    Verifies, builds, checks, then publishes after confirmation.

.EXAMPLE
    ./scripts/deploy-github-pages-custom-domain.ps1 -WhatIf
    Shows what would happen without publishing anything.
#>

[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    # A bare host: letters, digits, hyphens and dots, at least one dot, and not
    # starting with 'www.'. GitHub Pages ignores a CNAME containing a scheme or
    # a path, and the failure is silent, so it is refused here instead.
    [Parameter()]
    [ValidatePattern('^(?!www\.)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$')]
    [string]$Domain = 'fsautomotive.pt',

    [Parameter()]
    [switch]$SkipVerify,

    [Parameter()]
    [switch]$AllowDirty,

    [Parameter()]
    [switch]$BuildOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# The custom domain serves the site from the root. This is the whole point of
# the script and is not a parameter: a custom-domain deploy on any other base
# href is the bug being fixed.
$BaseHref = '/'

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

<#
    Refuses to publish a bundle that would render blank.

    Every check here corresponds to a way this deployment has actually failed
    or could fail silently: the wrong base href, a stale chunk from a previous
    build, a CNAME that GitHub ignores, or an index.html referencing a file
    that was never emitted. A 404 on a hashed chunk is invisible until someone
    opens the site, so it is worth catching here.
#>
function Assert-PublishableBundle {
    param(
        [Parameter(Mandatory)][string]$Directory,
        [Parameter(Mandatory)][string]$ExpectedDomain
    )

    $indexPath = Join-Path $Directory 'index.html'
    if (-not (Test-Path $indexPath)) {
        throw "No index.html in $Directory — the build did not produce a site."
    }

    $html = Get-Content -Path $indexPath -Raw

    # 1. The base href the browser resolves every relative asset against.
    if ($html -notmatch '<base\s+href="/"\s*/?>') {
        $found = if ($html -match '<base[^>]*>') { $Matches[0] } else { '(no <base> tag)' }
        throw "index.html must carry <base href=`"/`"> for a root-served domain; found: $found"
    }

    # 2. The project-site prefix must appear nowhere in the emitted HTML. This
    #    is the exact failure being fixed: it is what makes the chunks 404.
    if ($html -match '/fsautomotive\.pt\.angular/') {
        throw ('index.html still references the project-site path ' +
               '/fsautomotive.pt.angular/ — it was built with the wrong base href.')
    }

    # 3. The CNAME, byte for byte. A scheme, a path or a trailing 'www' here is
    #    ignored by GitHub Pages without any error.
    $cnamePath = Join-Path $Directory 'CNAME'
    if (-not (Test-Path $cnamePath)) {
        throw "No CNAME in $Directory — the custom domain would be dropped on publish."
    }

    # `Get-Content -Raw` yields $null for a zero-byte file, so the trim has to
    # come after the null check — otherwise an empty CNAME, which is exactly the
    # kind of truncated write this gate is here to catch, fails with a null
    # reference instead of saying what is wrong.
    $cname = Get-Content -Path $cnamePath -Raw
    $cname = if ($null -eq $cname) { '' } else { $cname.Trim() }

    if ($cname -ne $ExpectedDomain) {
        throw "CNAME contains '$cname'; expected exactly '$ExpectedDomain'."
    }

    # 4. Every script and stylesheet index.html asks for must exist. A missing
    #    hashed chunk is the blank page, and it is cheap to catch here.
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

    Write-Note "base href / · CNAME $cname · $($local.Count) local asset(s), all present"
}

Push-Location $RepoRoot
try {
    Write-Step 'FS Automotive — publish to the custom domain'
    Write-Note "repository : $RepoRoot"
    Write-Note "domain     : https://$Domain/"
    Write-Note "base href  : $BaseHref"
    Write-Note "publish dir: $PublishDir"

    # --- Clean working tree ------------------------------------------------
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $status = @(& git status --porcelain 2>$null)
        if ($LASTEXITCODE -eq 0 -and $status.Count -gt 0) {
            if ($AllowDirty) {
                Write-Warning "Publishing with $($status.Count) uncommitted change(s) (-AllowDirty)."
            }
            elseif (-not $BuildOnly) {
                $status | Select-Object -First 10 | ForEach-Object { Write-Note $_ }
                throw 'Working tree is not clean. Commit your changes, or pass -AllowDirty.'
            }
        }
    }
    else {
        Write-Warning 'git not found; skipping the clean-working-tree check.'
    }

    # --- Dependencies ------------------------------------------------------
    if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
        Write-Step 'Installing dependencies'
        $install = if (Test-Path (Join-Path $RepoRoot 'package-lock.json')) { 'ci' } else { 'install' }
        Invoke-Native -FilePath 'npm' -Arguments @($install) -FailureMessage 'Dependency installation failed'
    }

    # --- Verification gate -------------------------------------------------
    #
    # As in deploy.ps1: not `npm run verify`, because that ends in a build with
    # no --base-href, which this script would immediately discard and redo.
    # The production build below is part of the gate and is the one that ships.
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

    # --- Clean the generated output ----------------------------------------
    #
    # The Angular builder clears its own output, but only the paths it is about
    # to write. Removing the directory outright is what guarantees no chunk
    # built against /fsautomotive.pt.angular/ survives into this publish.
    # Scoped to dist/ — it never touches src/, scripts/ or anything tracked.
    if (Test-Path $OutputRoot) {
        Write-Step 'Cleaning previous build output'
        Write-Note $OutputRoot
        Remove-Item -Path $OutputRoot -Recurse -Force
    }

    # --- Build -------------------------------------------------------------
    #
    # Two steps, as in deploy.ps1: `ng deploy` has no --define, so the bundle is
    # built here with the .env values injected and the right base href, then
    # published as-is with --no-build.
    Write-Step "Building for https://$Domain/"
    Invoke-Native -FilePath 'node' -Arguments @(
        '--env-file-if-exists=.env',
        '--env-file-if-exists=.env.local',
        'scripts/ng-env.mjs', 'build', "--base-href=$BaseHref"
    ) -FailureMessage 'Production build failed'

    # --- CNAME -------------------------------------------------------------
    #
    # Written into the build output as well as passed to `ng deploy --cname`,
    # so the file is present however angular-cli-ghpages resolves the publish
    # directory — and so -BuildOnly can verify it without publishing.
    #
    # No trailing newline and no BOM: GitHub tolerates a newline, but an ASCII
    # write keeps the file exactly the one byte-for-byte value that is valid.
    Write-Step 'Writing CNAME'
    $cnamePath = Join-Path $PublishDir 'CNAME'
    [System.IO.File]::WriteAllText($cnamePath, $Domain, [System.Text.UTF8Encoding]::new($false))
    Write-Note "$cnamePath -> $Domain"

    # --- Gate --------------------------------------------------------------
    Write-Step 'Checking the built bundle'
    Assert-PublishableBundle -Directory $PublishDir -ExpectedDomain $Domain

    if ($BuildOnly) {
        Write-Host "`n[OK] Built and verified for https://$Domain/ — nothing was published (-BuildOnly)." -ForegroundColor Green
        Write-Note "Output: $PublishDir"
        return
    }

    # --- Publish -----------------------------------------------------------
    $target = "GitHub Pages for https://$Domain/ (base href $BaseHref)"
    if (-not $PSCmdlet.ShouldProcess($target, 'Publish the site')) {
        Write-Note 'Publish cancelled.'
        return
    }

    Write-Step 'Publishing to GitHub Pages'
    Invoke-Native -FilePath 'npx' -Arguments @(
        'ng', 'deploy', '--no-build',
        "--dir=dist/fsautomotive/browser",
        "--cname=$Domain"
    ) -FailureMessage 'ng deploy failed'

    Write-Host "`n[OK] Published for https://$Domain/" -ForegroundColor Green
    Write-Note 'GitHub Pages still has to build the commit; check Actions > "pages build and deployment".'
    Write-Note 'Settings > Pages must list the custom domain, with DNS verified and HTTPS enforced.'
}
catch {
    Write-Host "`n[FAILED] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

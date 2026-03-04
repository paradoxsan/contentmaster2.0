@echo off
setlocal enabledelayedexpansion
title Content Master — Dev Startup

:: ─── Colors (via ANSI) ────────────────────────────────────────────────────────
:: Enable virtual terminal processing for ANSI color codes
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set CYAN=[96m
set BOLD=[1m
set RESET=[0m

:: ─── Header ───────────────────────────────────────────────────────────────────
echo.
echo %CYAN%%BOLD%  ██████╗ ██████╗ ███╗   ██╗████████╗███████╗███╗   ██╗████████╗%RESET%
echo %CYAN%%BOLD%  ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝████╗  ██║╚══██╔══╝%RESET%
echo %CYAN%%BOLD%  ██║     ██║   ██║██╔██╗ ██║   ██║   █████╗  ██╔██╗ ██║   ██║   %RESET%
echo %CYAN%%BOLD%  ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║╚██╗██║   ██║   %RESET%
echo %CYAN%%BOLD%  ╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██║ ╚████║   ██║   %RESET%
echo %CYAN%%BOLD%   ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝   ╚═╝   %RESET%
echo %CYAN%%BOLD%  ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ %RESET%
echo %CYAN%%BOLD%  ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗%RESET%
echo %CYAN%%BOLD%  ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝%RESET%
echo %CYAN%%BOLD%  ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗%RESET%
echo %CYAN%%BOLD%  ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║%RESET%
echo %CYAN%%BOLD%  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝%RESET%
echo.
echo %YELLOW%  Pre-flight checks starting...%RESET%
echo  ─────────────────────────────────────────────────────────
echo.

set ERRORS=0

:: ─── Check 1: Node.js ─────────────────────────────────────────────────────────
echo  [1/7] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  %RED%  FAIL  Node.js is not installed or not in PATH%RESET%
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
    echo  %GREEN%  PASS  Node.js !NODE_VER!%RESET%
)

:: ─── Check 2: npm ─────────────────────────────────────────────────────────────
echo  [2/7] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  %RED%  FAIL  npm is not installed or not in PATH%RESET%
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
    echo  %GREEN%  PASS  npm v!NPM_VER!%RESET%
)

:: ─── Check 3: node_modules ────────────────────────────────────────────────────
echo  [3/7] Checking dependencies...
if not exist "node_modules" (
    echo  %YELLOW%  WARN  node_modules not found — running npm install...%RESET%
    npm install
    if %errorlevel% neq 0 (
        echo  %RED%  FAIL  npm install failed%RESET%
        set /a ERRORS+=1
    ) else (
        echo  %GREEN%  PASS  Dependencies installed%RESET%
    )
) else (
    echo  %GREEN%  PASS  node_modules present%RESET%
)

:: ─── Functions: install, build ────────────────────────────────────────────────
echo  [+] Installing functions dependencies...
cd functions
npm install
if %errorlevel% neq 0 (
    echo  %RED%  FAIL  functions npm install failed%RESET%
    set /a ERRORS+=1
    pause
)
echo  %GREEN%  PASS  Functions dependencies installed%RESET%

echo  [+] Building functions...
npm run build
if %errorlevel% neq 0 (
    echo  %RED%  FAIL  functions build failed — see errors above%RESET%
    set /a ERRORS+=1
    pause
) else (
    echo  %GREEN%  PASS  Functions built%RESET%
)
cd ..

:: ─── Check 4: .env file ───────────────────────────────────────────────────────
echo  [4/7] Checking .env file...
if not exist ".env" (
    echo  %RED%  FAIL  .env file not found (copy .env.example and fill in values)%RESET%
    set /a ERRORS+=1
    goto :env_skip
)
echo  %GREEN%  PASS  .env file found%RESET%

:: Check required Firebase env vars
set ENV_MISSING=0
for %%K in (
    VITE_FIREBASE_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET
    VITE_FIREBASE_MESSAGING_SENDER_ID
    VITE_FIREBASE_APP_ID
) do (
    findstr /i "%%K=" .env | findstr /v "%%K=$" | findstr /v "%%K= $" >nul 2>&1
    if !errorlevel! neq 0 (
        echo  %YELLOW%         WARN  %%K is not set in .env%RESET%
        set ENV_MISSING=1
    )
)
if %ENV_MISSING% equ 1 (
    echo  %YELLOW%         Some Firebase env vars are empty — app may not connect to Firebase%RESET%
) else (
    echo  %GREEN%         Firebase env vars look populated%RESET%
)
:env_skip

:: ─── Check 5: Internet connectivity ──────────────────────────────────────────
echo  [5/7] Checking internet connectivity...
ping -n 1 -w 2000 8.8.8.8 >nul 2>&1
if %errorlevel% neq 0 (
    echo  %RED%  FAIL  No internet connection — API calls will fail%RESET%
    set /a ERRORS+=1
) else (
    echo  %GREEN%  PASS  Internet reachable%RESET%
)

:: ─── Check 6: Firebase (firestore.googleapis.com) ─────────────────────────────
echo  [6/7] Checking Firebase services...
curl -s -o nul -w "%%{http_code}" --max-time 5 ^
    "https://firestore.googleapis.com" >"%TEMP%\cm_firebase_check.txt" 2>nul
set /p FB_CODE=<"%TEMP%\cm_firebase_check.txt"
del "%TEMP%\cm_firebase_check.txt" >nul 2>&1

if "!FB_CODE!"=="200" (
    echo  %GREEN%  PASS  Firebase reachable (HTTP 200)%RESET%
) else if "!FB_CODE!"=="400" (
    echo  %GREEN%  PASS  Firebase reachable (HTTP 400 — unauthenticated, expected)%RESET%
) else if "!FB_CODE!"=="404" (
    echo  %GREEN%  PASS  Firebase reachable (HTTP 404 — expected without project ID)%RESET%
) else if "!FB_CODE!"=="" (
    echo  %RED%  FAIL  Firebase unreachable — check your internet or firewall%RESET%
    set /a ERRORS+=1
) else (
    echo  %YELLOW%  WARN  Firebase returned HTTP !FB_CODE! — may still work%RESET%
)

:: ─── Check 7: Meta Graph API ──────────────────────────────────────────────────
echo  [7/7] Checking Meta Graph API...
curl -s -o nul -w "%%{http_code}" --max-time 5 ^
    "https://graph.facebook.com/v21.0/" >"%TEMP%\cm_meta_check.txt" 2>nul
set /p META_CODE=<"%TEMP%\cm_meta_check.txt"
del "%TEMP%\cm_meta_check.txt" >nul 2>&1

if "!META_CODE!"=="200" (
    echo  %GREEN%  PASS  Meta Graph API reachable (HTTP 200)%RESET%
) else if "!META_CODE!"=="400" (
    echo  %GREEN%  PASS  Meta Graph API reachable (HTTP 400 — no token, expected)%RESET%
) else if "!META_CODE!"=="" (
    echo  %RED%  FAIL  Meta Graph API unreachable — publishing will not work%RESET%
    set /a ERRORS+=1
) else (
    echo  %YELLOW%  WARN  Meta Graph API returned HTTP !META_CODE!%RESET%
)

:: ─── Validate Meta token (from functions/.env) ────────────────────────────────
if exist "functions\.env" (
    for /f "tokens=2 delims==" %%T in ('findstr "META_PAGE_ACCESS_TOKEN=" "functions\.env"') do set META_TOKEN=%%T
    if defined META_TOKEN if not "!META_TOKEN!"=="" (
        echo.
        echo  %YELLOW%  Validating Meta access token...%RESET%
        curl -s --max-time 8 ^
            "https://graph.facebook.com/v21.0/me?access_token=!META_TOKEN!" ^
            >"%TEMP%\cm_token_check.txt" 2>nul

        findstr "\"id\"" "%TEMP%\cm_token_check.txt" >nul 2>&1
        if !errorlevel! equ 0 (
            for /f "tokens=2 delims=:," %%N in ('findstr "\"name\"" "%TEMP%\cm_token_check.txt"') do (
                set ACCT_NAME=%%N
            )
            echo  %GREEN%         Token valid — connected as: !ACCT_NAME!%RESET%
        ) else (
            findstr "error" "%TEMP%\cm_token_check.txt" >nul 2>&1
            if !errorlevel! equ 0 (
                echo  %RED%         Token INVALID or EXPIRED — publishing will fail%RESET%
                echo  %YELLOW%         Response: %RESET%
                type "%TEMP%\cm_token_check.txt"
                echo.
            ) else (
                echo  %YELLOW%         Token check inconclusive (no response)%RESET%
            )
        )
        del "%TEMP%\cm_token_check.txt" >nul 2>&1
    )
)

:: ─── Summary ──────────────────────────────────────────────────────────────────
echo.
echo  ─────────────────────────────────────────────────────────
if %ERRORS% gtr 0 (
    echo  %RED%%BOLD%  %ERRORS% check(s) failed.%RESET%
    echo.
    choice /c YN /m "  Start dev server anyway? (Y/N)"
    if errorlevel 2 (
        echo.
        echo  %YELLOW%  Aborted. Fix the issues above and try again.%RESET%
        echo.
        pause
        exit /b 1
    )
) else (
    echo  %GREEN%%BOLD%  All checks passed!%RESET%
)

:: ─── Launch Dev Server ────────────────────────────────────────────────────────
echo.
echo  %CYAN%  Starting Content Master dev server...%RESET%
echo  %CYAN%  http://localhost:5173%RESET%
echo.
npm run dev

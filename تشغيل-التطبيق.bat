@echo off
chcp 65001 >nul
title Finance Flow - خادم محلي
cd /d "%~dp0"

set PORT=8765
echo.
echo  ========================================
echo   Finance Flow - تشغيل الخادم
echo  ========================================
echo.

:: 1) تجربة py (مثبّت مع Python على ويندوز)
py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] تم العثور على Python عبر py
    echo.
    echo  افتح في Chrome أو Edge:
    echo    http://localhost:%PORT%
    echo.
    echo  أوقف الخادم بـ: Ctrl+C
    echo  ========================================
    py -m http.server %PORT%
    goto :end
)

:: 2) تجربة python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] تم العثور على Python
    echo.
    echo  افتح في Chrome أو Edge:
    echo    http://localhost:%PORT%
    echo.
    echo  أوقف الخادم بـ: Ctrl+C
    echo  ========================================
    python -m http.server %PORT%
    goto :end
)

:: 3) تجربة Node
where npx >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] تم العثور على Node
    echo.
    echo  افتح في Chrome أو Edge:
    echo    http://localhost:%PORT%
    echo.
    npx -y serve -p %PORT%
    goto :end
)

echo  [خطأ] لم يتم العثور على Python ولا Node.
echo.
echo  ثبّت Python من: https://www.python.org/downloads/
echo  أثناء التثبيت اختر: Add Python to PATH
echo.
:end
pause

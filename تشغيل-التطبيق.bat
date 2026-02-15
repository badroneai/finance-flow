@echo off
chcp 65001 >nul
title Finance Flow - خادم التطوير
cd /d "%~dp0"

echo.
echo  ========================================
echo   Finance Flow - تشغيل خادم Vite
echo  ========================================
echo.

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [خطأ] لم يتم العثور على npm. ثبّت Node.js من https://nodejs.org
    goto :end
)

echo  [OK] تشغيل خادم التطوير...
echo.
echo  بعد ظهور "Local: http://localhost:5173/" افتح في المتصفح:
echo    http://localhost:5173/finance-flow.html
echo  أو: http://localhost:5173/
echo.
echo  أوقف الخادم بـ: Ctrl+C
echo  ========================================
echo.

npm run dev

:end
pause

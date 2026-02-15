@echo off
chcp 65001 >nul
title Finance Flow
cd /d "%~dp0"

:: فتح التطبيق في المتصفح (يجب أن يكون خادم Vite يعمل أولاً — تشغيل-التطبيق.bat)
start "" "http://localhost:5173/finance-flow.html"

echo  تم فتح الرابط في المتصفح.
echo  إن ظهر "لا يمكن الوصول": شغّل الخادم أولاً بتشغيل "تشغيل-التطبيق.bat"
timeout /t 3 >nul

@echo off
chcp 65001 >nul
title Finance Flow
cd /d "%~dp0"

:: فتح التطبيق مباشرة في المتصفح الافتراضي (بدون خادم)
start "" "%~dp0finance-flow.html"

echo  تم فتح Finance Flow في المتصفح.
echo  إن لم يفتح، انسخ الملف finance-flow.html وافتحه من Chrome أو Edge.
timeout /t 3 >nul

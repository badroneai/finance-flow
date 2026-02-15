# تشغيل Finance Flow محلياً (خادم Vite مطلوب لتطبيق React)
# Run: .\start-server.ps1
# مهم: افتح الرابط في Chrome أو Edge — http://localhost:5173/finance-flow.html

$root = $PSScriptRoot
Set-Location $root

Write-Host "Finance Flow - تشغيل خادم التطوير (Vite)..." -ForegroundColor Cyan
Write-Host "بعد التشغيل افتح في المتصفح:" -ForegroundColor Yellow
Write-Host "  http://localhost:5173/finance-flow.html" -ForegroundColor Green
Write-Host "أو: http://localhost:5173/" -ForegroundColor Green
Write-Host ""
Write-Host "لإيقاف الخادم: Ctrl+C" -ForegroundColor Gray
Write-Host ""

npm run dev

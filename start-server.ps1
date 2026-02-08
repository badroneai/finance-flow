# تشغيل Finance Flow محلياً
# Run: .\start-server.ps1
# مهم: افتح الرابط في Chrome أو Edge وليس في متصفح Cursor (يسبب خطأ -102)

$port = 8765
$root = $PSScriptRoot
Write-Host "Finance Flow - جاري التشغيل على http://localhost:$port" -ForegroundColor Cyan
Write-Host "افتح هذا الرابط في Chrome أو Edge (متصفح Cursor يعطي خطأ -102):" -ForegroundColor Yellow
Write-Host "http://localhost:$port" -ForegroundColor Green
Write-Host ""
Set-Location $root
python -m http.server $port

# PowerShell Script untuk Setup Bypass Authentication
# Jalankan sebagai Administrator jika perlu

Write-Host "🔓 Setting up Bypass Authentication for Development..." -ForegroundColor Green

# Set environment variables untuk bypass auth
$env:BYPASS_AUTH = "true"
$env:HARDCODED_USER_ID = "1"
$env:HARDCODED_USER_EMAIL = "test@example.com"
$env:HARDCODED_USER_ROLE = "user"
$env:HARDCODED_ALLERGENS = "gluten,lactose,nuts,shellfish,eggs"
$env:BYPASS_AI = "false"

Write-Host "✅ Environment variables set:" -ForegroundColor Green
Write-Host "   BYPASS_AUTH: $env:BYPASS_AUTH" -ForegroundColor Yellow
Write-Host "   HARDCODED_USER_ID: $env:HARDCODED_USER_ID" -ForegroundColor Yellow
Write-Host "   HARDCODED_USER_EMAIL: $env:HARDCODED_USER_EMAIL" -ForegroundColor Yellow
Write-Host "   HARDCODED_USER_ROLE: $env:HARDCODED_USER_ROLE" -ForegroundColor Yellow
Write-Host "   HARDCODED_ALLERGENS: $env:HARDCODED_ALLERGENS" -ForegroundColor Yellow
Write-Host "   BYPASS_AI: $env:BYPASS_AI" -ForegroundColor Yellow

Write-Host "`n🚀 Sekarang Anda bisa menjalankan aplikasi tanpa authentication!" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Cyan

Write-Host "`n⚠️  PERINGATAN: Jangan gunakan bypass auth di production!" -ForegroundColor Red
Write-Host "   Environment variables ini hanya berlaku untuk session PowerShell ini." -ForegroundColor Yellow
Write-Host "   Untuk permanent, tambahkan ke .env file atau system environment variables." -ForegroundColor Yellow

# Test apakah environment variables sudah set
Write-Host "`n🧪 Testing environment variables..." -ForegroundColor Blue
if ($env:BYPASS_AUTH -eq "true") {
    Write-Host "✅ BYPASS_AUTH berhasil di-set!" -ForegroundColor Green
} else {
    Write-Host "❌ BYPASS_AUTH gagal di-set!" -ForegroundColor Red
}

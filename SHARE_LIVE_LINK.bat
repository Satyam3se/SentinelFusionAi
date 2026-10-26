@echo off
title SentinelFusion AI - Official Cloudflare Public Live Link
echo =====================================================================
echo    SENTINELFUSION AI -- ENTERPRISE CLOUDFLARE PUBLIC HTTPS TUNNEL
echo =====================================================================
echo.
echo Make sure START_SYSTEM.bat is running first so port 8000 is active.
echo.
echo Launching rock-solid Cloudflare secure tunnel for judges / evaluators...
echo Look for the 'https://....trycloudflare.com' link below to share!
echo.
cloudflared tunnel --url http://127.0.0.1:8000
pause

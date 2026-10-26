@echo off
title SentinelFusion AI - Instant Public Live Link
echo =====================================================================
echo    SENTINELFUSION AI -- INSTANT ENCRYPTED PUBLIC HTTPS TUNNEL
echo =====================================================================
echo.
echo Make sure START_SYSTEM.bat is running first so port 8000 is active.
echo.
echo Launching secure public tunnel for judges / evaluators...
echo Look for the 'https://....lhr.life' link below to share!
echo.
ssh -o StrictHostKeyChecking=no -R 80:127.0.0.1:8000 nokey@localhost.run
pause

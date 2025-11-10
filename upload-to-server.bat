@echo off
echo ========================================
echo AHC Watch Platform - Upload Script
echo ========================================
echo.

echo This script will help you upload files to your server.
echo Please choose your upload method:
echo.
echo 1. Manual Upload (using FileZilla, WinSCP, etc.)
echo 2. SCP Command Line
echo 3. FTP Command Line
echo 4. Show file locations only
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto manual
if "%choice%"=="2" goto scp
if "%choice%"=="3" goto ftp
if "%choice%"=="4" goto showfiles
goto invalid

:manual
echo.
echo ========================================
echo MANUAL UPLOAD INSTRUCTIONS
echo ========================================
echo.
echo Frontend Files to Upload:
echo Source: %cd%\dist\lslplatform\browser\
echo Destination: https://ahcwatch.awjholding.com/
echo.
echo Backend Files to Upload:
echo Source: %cd%\backend\
echo Destination: https://ahcwatch.awjholding.com/backend/
echo.
echo Use FileZilla, WinSCP, or your preferred FTP client.
echo Upload ALL files from the source directories to the destinations.
echo.
pause
goto end

:scp
echo.
echo ========================================
echo SCP UPLOAD COMMANDS
echo ========================================
echo.
set /p server="Enter your server address (e.g., user@ahcwatch.awjholding.com): "
set /p path="Enter remote path (e.g., /var/www/html/): "
echo.
echo Frontend upload command:
echo scp -r "%cd%\dist\lslplatform\browser\*" %server%:%path%
echo.
echo Backend upload command:
echo scp -r "%cd%\backend" %server%:%path%
echo.
echo Run these commands in your terminal.
pause
goto end

:ftp
echo.
echo ========================================
echo FTP UPLOAD COMMANDS
echo ========================================
echo.
set /p server="Enter your FTP server address: "
set /p username="Enter your FTP username: "
echo.
echo Frontend upload commands:
echo ftp %server%
echo user %username%
echo cd /
echo lcd "%cd%\dist\lslplatform\browser"
echo mput *
echo.
echo Backend upload commands:
echo ftp %server%
echo user %username%
echo cd /backend
echo lcd "%cd%\backend"
echo mput *
echo.
echo Run these commands in your terminal.
pause
goto end

:showfiles
echo.
echo ========================================
echo FILE LOCATIONS
echo ========================================
echo.
echo Frontend Files (Built):
echo %cd%\dist\lslplatform\browser\
echo.
echo Backend Files:
echo %cd%\backend\
echo.
echo Total Frontend Files:
dir /s /b "%cd%\dist\lslplatform\browser" | find /c /v ""
echo.
echo Total Backend Files:
dir /s /b "%cd%\backend" | find /c /v ""
echo.
pause
goto end

:invalid
echo Invalid choice. Please run the script again.
pause
goto end

:end
echo.
echo ========================================
echo NEXT STEPS AFTER UPLOAD
echo ========================================
echo.
echo 1. Install backend dependencies:
echo    cd /path/to/backend
echo    npm install
echo.
echo 2. Configure environment variables in backend/.env
echo.
echo 3. Start backend server:
echo    node server.js
echo.
echo 4. Test the application at https://ahcwatch.awjholding.com
echo.
echo 5. Set up Azure AD for Microsoft login (see DEPLOYMENT_GUIDE.md)
echo.
echo Upload completed! Check DEPLOYMENT_GUIDE.md for detailed instructions.
echo.
pause

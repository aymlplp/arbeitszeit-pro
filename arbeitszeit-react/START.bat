@echo off
echo ============================
echo   Arbeitszeit Pro - React
echo ============================
echo.
where node >nul 2>&1
IF ERRORLEVEL 1 (
  echo ERROR: Node.js not found!
  echo Download from: https://nodejs.org
  pause & exit
)
IF NOT EXIST node_modules (
  echo Installing packages...
  npm install
)
echo.
echo Starting dev server...
echo Open: http://localhost:5173
echo.
npm run dev
pause

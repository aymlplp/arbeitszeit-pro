#!/bin/bash
echo "=============================="
echo "  Arbeitszeit Pro - React"
echo "=============================="
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not installed"
  echo "Download from: https://nodejs.org"
  exit 1
fi
[ ! -d node_modules ] && npm install
echo "Starting dev server → http://localhost:5173"
npm run dev

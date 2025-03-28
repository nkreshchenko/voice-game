#!/bin/bash

echo "Running pre-commit check for app code only..."

# Try to compile the app directory only with JSX support
npx tsc --noEmit --skipLibCheck --jsx react-jsx app/page.tsx

if [ $? -eq 0 ]; then
  echo "✅ Code check passed. Ready to commit!"
  exit 0
else
  echo "❌ Code check failed. Please fix the issues before committing."
  exit 1
fi 

#!/bin/bash

echo "📦 Exporting production database data..."
echo ""
echo "⚠️  IMPORTANT: This will export from the database URL you provide!"
echo ""
echo "Current DATABASE_URL: ${DATABASE_URL:0:30}..."
echo ""
read -p "Do you want to use a different database URL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    read -p "Enter production database URL: " PROD_URL
    export EXPORT_DATABASE_URL="$PROD_URL"
fi

echo ""
read -p "Continue with export? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    tsx server/export-production-data.ts
fi

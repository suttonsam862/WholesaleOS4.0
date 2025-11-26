
#!/bin/bash

echo "📥 Importing production data to development database..."
echo ""
echo "⚠️  Make sure DATABASE_URL is set to your DEVELOPMENT database!"
echo "⚠️  This will DELETE all existing data in the development database!"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    tsx server/import-production-data.ts
fi

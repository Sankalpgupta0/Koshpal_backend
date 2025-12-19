#!/bin/bash

# ==============================================================================
# Migration Application Script
# ==============================================================================
# Purpose: Apply the transaction accountId optional migration
# Usage: ./apply-migration.sh
# ==============================================================================

set -e  # Exit on error

echo "🔍 Checking database connectivity..."

# Test database connection
if ! npx prisma db execute --stdin < /dev/null 2>/dev/null; then
  echo "❌ Cannot reach database server"
  echo "Please check:"
  echo "  1. Supabase service is running"
  echo "  2. Network connectivity"
  echo "  3. DATABASE_URL in .env is correct"
  exit 1
fi

echo "✅ Database is reachable"
echo ""

echo "📋 Current migration status:"
npx prisma migrate status
echo ""

read -p "🚀 Apply migration now? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled"
  exit 0
fi

echo "🔄 Applying migration..."
npx prisma migrate dev --name make_transaction_accountid_optional

echo ""
echo "✅ Migration applied successfully!"
echo ""

echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client regenerated"
echo ""

echo "🧪 Running verification queries..."

# Verify schema changes
npx prisma db execute --stdin <<SQL
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN "accountId" IS NOT NULL THEN 1 END) as with_account,
  COUNT(CASE WHEN "accountId" IS NULL THEN 1 END) as without_account
FROM "Transaction";
SQL

echo ""
echo "✅ All steps completed!"
echo ""
echo "Next steps:"
echo "  1. Run tests: npm run test transactions.service.spec"
echo "  2. Restart backend: npm run start:dev"
echo "  3. Test API with Postman/curl"
echo ""
echo "📄 See TRANSACTION_SYSTEM_FIX.md for detailed documentation"

#!/bin/bash

# ==============================================================================
# Post-Migration Test Script
# ==============================================================================
# Purpose: Verify the transaction system works correctly after migration
# Usage: ./test-migration.sh
# Prerequisites: Backend must be running on localhost:3000
# ==============================================================================

set -e

BASE_URL="http://localhost:3000/api/v1"
TOKEN="${AUTH_TOKEN:-}"  # Set AUTH_TOKEN env variable with valid JWT

if [ -z "$TOKEN" ]; then
  echo "⚠️  Warning: AUTH_TOKEN not set. You'll need to manually add Authorization header."
  echo "   Export it: export AUTH_TOKEN='your-jwt-token'"
  echo ""
fi

AUTH_HEADER=""
if [ -n "$TOKEN" ]; then
  AUTH_HEADER="-H 'Authorization: Bearer $TOKEN'"
fi

echo "🧪 Testing Transaction System - Zero Account Scenarios"
echo "========================================================"
echo ""

# Test 1: Create transaction without account
echo "Test 1: Transaction without account or metadata"
echo "------------------------------------------------"
curl -X POST "$BASE_URL/finance/transactions" \
  $AUTH_HEADER \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "type": "DEBIT",
    "category": "FOOD",
    "description": "Test: Cash payment (no account)",
    "transactionDate": "2023-12-15T10:00:00Z",
    "source": "MANUAL"
  }' | jq '.'

echo ""
echo "Expected: Transaction created with accountId: null"
echo ""
read -p "Press enter to continue..."
echo ""

# Test 2: Create transaction with metadata (should auto-create account)
echo "Test 2: Transaction with metadata (auto-create account)"
echo "--------------------------------------------------------"
curl -X POST "$BASE_URL/finance/transactions" \
  $AUTH_HEADER \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "type": "DEBIT",
    "category": "SHOPPING",
    "description": "Test: Card payment (auto-create account)",
    "transactionDate": "2023-12-15T11:00:00Z",
    "source": "MOBILE",
    "bank": "TEST_BANK",
    "maskedAccountNo": "XXXX9999",
    "provider": "BANK"
  }' | jq '.'

echo ""
echo "Expected: Transaction created with accountId set to new account"
echo ""
read -p "Press enter to continue..."
echo ""

# Test 3: Create second transaction with same metadata (should match existing)
echo "Test 3: Second transaction with same metadata (match existing)"
echo "--------------------------------------------------------------"
curl -X POST "$BASE_URL/finance/transactions" \
  $AUTH_HEADER \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300,
    "type": "DEBIT",
    "category": "TRANSPORT",
    "description": "Test: Another card payment (match existing)",
    "transactionDate": "2023-12-15T12:00:00Z",
    "source": "MOBILE",
    "bank": "TEST_BANK",
    "maskedAccountNo": "XXXX9999",
    "provider": "BANK"
  }' | jq '.'

echo ""
echo "Expected: Transaction created with accountId matching previous account"
echo ""
read -p "Press enter to continue..."
echo ""

# Test 4: Bulk create with mixed scenarios
echo "Test 4: Bulk create with mixed scenarios"
echo "-----------------------------------------"
curl -X POST "$BASE_URL/finance/transactions/bulk" \
  $AUTH_HEADER \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "amount": 50,
        "type": "DEBIT",
        "category": "FOOD",
        "description": "Bulk test 1: No account",
        "transactionDate": "2023-12-15T13:00:00Z"
      },
      {
        "amount": 150,
        "type": "DEBIT",
        "category": "SHOPPING",
        "description": "Bulk test 2: With metadata",
        "transactionDate": "2023-12-15T14:00:00Z",
        "bank": "BULK_BANK",
        "maskedAccountNo": "XXXX7777",
        "provider": "BANK"
      },
      {
        "amount": 250,
        "type": "CREDIT",
        "category": "SALARY",
        "description": "Bulk test 3: Another without account",
        "transactionDate": "2023-12-15T15:00:00Z"
      }
    ]
  }' | jq '.'

echo ""
echo "Expected: 3 transactions created, mixed accountId values"
echo ""
read -p "Press enter to continue..."
echo ""

# Test 5: Get transactions (should include those with NULL accountId)
echo "Test 5: Fetch all transactions"
echo "-------------------------------"
curl -X GET "$BASE_URL/finance/transactions?limit=20" \
  $AUTH_HEADER | jq '.'

echo ""
echo "Expected: List includes transactions with and without accountId"
echo ""
read -p "Press enter to continue..."
echo ""

# Test 6: Get insights (should work with NULL accountId)
echo "Test 6: Get monthly insights"
echo "-----------------------------"
curl -X GET "$BASE_URL/finance/insights/monthly/latest" \
  $AUTH_HEADER | jq '.'

echo ""
echo "Expected: Insights calculated correctly including all transactions"
echo ""

echo ""
echo "✅ All tests completed!"
echo ""
echo "Manual verification steps:"
echo "  1. Check database: SELECT COUNT(*) FROM \"Transaction\" WHERE \"accountId\" IS NULL;"
echo "  2. Check accounts: SELECT * FROM \"Account\" WHERE \"maskedAccountNo\" IS NOT NULL;"
echo "  3. Check insights: Verify totals match all transactions"
echo ""

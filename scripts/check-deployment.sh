#!/bin/bash

# Deployment Diagnostic Script for Financial Literacy Assessment Platform
# This script checks the deployment status and provides diagnostic information

set -e

echo "=========================================="
echo "Deployment Diagnostic Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check DNS resolution
echo "1. Checking DNS Resolution..."
DNS_RESULT=$(dig +short financial-literacy.qualiaai.fr A 2>/dev/null || echo "")
if [ "$DNS_RESULT" = "82.25.112.7" ]; then
    echo -e "${GREEN}✓ DNS is correctly configured: $DNS_RESULT${NC}"
else
    echo -e "${RED}✗ DNS resolution issue: $DNS_RESULT${NC}"
fi
echo ""

# Check HTTPS accessibility
echo "2. Checking HTTPS Accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://financial-literacy.qualiaai.fr 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Website is accessible (HTTP $HTTP_STATUS)${NC}"
elif [ "$HTTP_STATUS" = "404" ]; then
    echo -e "${YELLOW}⚠ Website returns 404 - Container may not be running or Traefik not routing${NC}"
else
    echo -e "${RED}✗ Website not accessible (HTTP $HTTP_STATUS)${NC}"
fi
echo ""

# Check API endpoint
echo "3. Checking API Endpoint..."
API_RESPONSE=$(curl -s https://financial-literacy.qualiaai.fr/api/test 2>/dev/null || echo "ERROR")
if echo "$API_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ API endpoint is responding${NC}"
    echo "Response: $API_RESPONSE"
else
    echo -e "${RED}✗ API endpoint not responding${NC}"
    echo "Response: $API_RESPONSE"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If DNS is correct but website returns 404:"
echo "  1. Check Dokploy dashboard: https://dokploy.qualiaai.fr"
echo "  2. Verify container is running in Deployments tab"
echo "  3. Check domain is configured in Domains tab"
echo "  4. Review container logs for errors"
echo ""
echo "Next steps:"
echo "  - Access Dokploy dashboard to verify deployment status"
echo "  - Ensure domain 'financial-literacy.qualiaai.fr' is configured"
echo "  - Check that container is running (not just built)"
echo ""


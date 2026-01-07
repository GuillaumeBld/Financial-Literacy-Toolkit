#!/usr/bin/env node

/**
 * DNS Setup Script for Financial Literacy Assessment Platform
 * 
 * This script configures DNS records for financial-literacy.qualiaai.fr
 * pointing to the VPS at 82.25.112.7
 * 
 * Prerequisites:
 * - Hostinger API authentication must be configured
 * - Domain qualiaai.fr must be managed by Hostinger
 * 
 * Usage:
 *   node migration/setup-dns.js
 */

// Configuration
const DOMAIN = 'qualiaai.fr';
const SUBDOMAIN = 'financial-literacy';
const VPS_IPV4 = '82.25.112.7';
const VPS_IPV6 = '2a02:4780:28:a7c0::1';

console.log('DNS Setup Script for Financial Literacy Assessment Platform');
console.log('============================================================\n');
console.log(`Domain: ${SUBDOMAIN}.${DOMAIN}`);
console.log(`Target IP (IPv4): ${VPS_IPV4}`);
console.log(`Target IP (IPv6): ${VPS_IPV6}\n`);

// Note: This script requires Hostinger API authentication
// The actual implementation would use the Hostinger MCP tools

console.log('Steps to configure DNS:');
console.log('1. Authenticate with Hostinger API');
console.log('2. Get current DNS records for qualiaai.fr');
console.log('3. Check if financial-literacy A record exists');
console.log('4. Add or update A record: financial-literacy -> 82.25.112.7');
console.log('5. Add or update AAAA record: financial-literacy -> 2a02:4780:28:a7c0::1');
console.log('6. Verify DNS propagation\n');

console.log('To configure DNS manually:');
console.log('- Log in to hPanel: https://hpanel.hostinger.com/');
console.log('- Navigate to Domains -> qualiaai.fr -> DNS / Name Servers');
console.log('- Add A record: financial-literacy -> 82.25.112.7');
console.log('- Add AAAA record: financial-literacy -> 2a02:4780:28:a7c0::1\n');

console.log('After DNS is configured:');
console.log('1. Wait for DNS propagation (can take up to 48 hours)');
console.log('2. Verify with: dig financial-literacy.qualiaai.fr A');
console.log('3. Traefik will automatically request SSL certificate');
console.log('4. Access application at: https://financial-literacy.qualiaai.fr\n');

// TODO: Implement actual DNS configuration using Hostinger API
// This would require:
// 1. Authentication setup
// 2. Using mcp_hostinger-api_DNS_getDNSRecordsV1 to get current records
// 3. Using mcp_hostinger-api_DNS_updateDNSRecordsV1 to add/update records

console.log('Note: Automated DNS configuration requires Hostinger API authentication.');
console.log('See migration/DNS_SETUP.md for manual configuration steps.');




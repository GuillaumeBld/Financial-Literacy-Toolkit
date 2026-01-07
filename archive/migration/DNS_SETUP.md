# DNS Configuration for Financial Literacy Assessment Platform

## Domain Setup

**Target Domain**: `financial-literacy.qualiaai.fr`  
**VPS IP Address**: `82.25.112.7` (IPv4)  
**VPS IPv6**: `2a02:4780:28:a7c0::1` (if needed)

## Required DNS Records

### A Record (IPv4)
```
Type: A
Name: financial-literacy
Value: 82.25.112.7
TTL: 3600 (or default)
```

### AAAA Record (IPv6 - Optional)
```
Type: AAAA
Name: financial-literacy
Value: 2a02:4780:28:a7c0::1
TTL: 3600 (or default)
```

## DNS Configuration Steps

### Option 1: Using Hostinger API (Once Authenticated)

Once the Hostinger API is authenticated, you can use the DNS management endpoints:

1. **Check existing DNS records**:
   ```bash
   # This will show current DNS configuration
   ```

2. **Add A record for financial-literacy subdomain**:
   - Name: `financial-literacy`
   - Type: `A`
   - Value: `82.25.112.7`
   - TTL: `3600`

3. **Add AAAA record (if IPv6 is needed)**:
   - Name: `financial-literacy`
   - Type: `AAAA`
   - Value: `2a02:4780:28:a7c0::1`
   - TTL: `3600`

### Option 2: Using Hostinger hPanel (Manual)

1. Log in to [hPanel](https://hpanel.hostinger.com/)
2. Navigate to **Domains** → **qualiaai.fr**
3. Click on **DNS / Name Servers**
4. Add the following records:
   - **A Record**: `financial-literacy` → `82.25.112.7`
   - **AAAA Record** (optional): `financial-literacy` → `2a02:4780:28:a7c0::1`

### Option 3: Using Hostinger API Script

Once authentication is configured, run:

```bash
# The script will be created to automate DNS setup
node migration/setup-dns.js
```

## Verification

After DNS records are added, verify with:

```bash
# Check A record
dig financial-literacy.qualiaai.fr A

# Check AAAA record (if configured)
dig financial-literacy.qualiaai.fr AAAA

# Or use nslookup
nslookup financial-literacy.qualiaai.fr
```

Expected output should show:
- A record pointing to `82.25.112.7`
- AAAA record pointing to `2a02:4780:28:a7c0::1` (if configured)

## SSL Certificate

Once DNS is configured and the domain points to your VPS:

1. **Traefik will automatically**:
   - Detect the domain
   - Request Let's Encrypt certificate
   - Configure HTTPS

2. **Verify SSL**:
   ```bash
   curl -I https://financial-literacy.qualiaai.fr
   ```

## Traefik Configuration

Ensure Traefik is configured to:
- Listen on port 80 (HTTP) and 443 (HTTPS)
- Use Let's Encrypt for SSL certificates
- Route `financial-literacy.qualiaai.fr` to the Next.js application (port 3000)

## Troubleshooting

### DNS Not Propagating
- DNS changes can take 24-48 hours to propagate globally
- Use `dig` or `nslookup` to check propagation
- Clear local DNS cache if needed

### SSL Certificate Issues
- Ensure DNS is fully propagated before requesting certificate
- Check Traefik logs for Let's Encrypt errors
- Verify port 80 is accessible (required for ACME challenge)

### Domain Not Resolving
- Verify DNS records are correctly set
- Check if domain is using Hostinger nameservers
- Ensure subdomain name is correct (no typos)




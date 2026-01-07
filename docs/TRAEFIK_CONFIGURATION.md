# Traefik Configuration for Financial Literacy Assessment

## Overview

The application is deployed using Docker Swarm and uses Traefik as a reverse proxy for SSL termination and routing.

## Traefik Setup

- **Mode:** Standard Docker (not Swarm mode)
- **Configuration:** `--providers.docker.exposedbydefault=false`
- **Certificate Resolver:** `le` (Let's Encrypt)
- **Entrypoint:** `websecure` (HTTPS)

## Required Traefik Labels

For the Docker Swarm service to be discovered and routed by Traefik, the following labels must be set on the service:

```bash
docker service update \
  --container-label-add "traefik.enable=true" \
  --container-label-add "traefik.http.routers.financial-literacy-web.rule=Host(\`financial-literacy.qualiaai.fr\`)" \
  --container-label-add "traefik.http.routers.financial-literacy-web.entrypoints=websecure" \
  --container-label-add "traefik.http.routers.financial-literacy-web.tls.certresolver=le" \
  --container-label-add "traefik.http.services.financial-literacy-web.loadbalancer.server.port=3000" \
  app-compress-digital-panel-bbswn2
```

### Label Breakdown

1. **`traefik.enable=true`**
   - Required because Traefik has `exposedbydefault=false`
   - Explicitly enables Traefik discovery for this service

2. **`traefik.http.routers.financial-literacy-web.rule=Host(\`financial-literacy.qualiaai.fr\`)`**
   - Defines the hostname rule for routing
   - Matches requests to `financial-literacy.qualiaai.fr`

3. **`traefik.http.routers.financial-literacy-web.entrypoints=websecure`**
   - Routes traffic through the HTTPS entrypoint
   - Ensures SSL/TLS encryption

4. **`traefik.http.routers.financial-literacy-web.tls.certresolver=le`**
   - Uses the `le` certificate resolver (Let's Encrypt)
   - Automatically provisions and renews SSL certificates

5. **`traefik.http.services.financial-literacy-web.loadbalancer.server.port=3000`**
   - Tells Traefik to forward traffic to port 3000
   - This is the port the Next.js app listens on

## Service Information

- **Service Name:** `app-compress-digital-panel-bbswn2`
- **Application Port:** 3000
- **Domain:** `financial-literacy.qualiaai.fr`
- **Protocol:** HTTPS

## Verification

After applying labels, verify the configuration:

```bash
# Check service labels
docker service inspect app-compress-digital-panel-bbswn2 --format '{{json .Spec.TaskTemplate.ContainerSpec.Labels}}' | jq

# Test HTTPS connection
curl -I https://financial-literacy.qualiaai.fr

# Check Traefik dashboard (if accessible)
# Should show the router and service
```

## Troubleshooting

### Service Not Discovered by Traefik

1. **Check labels are applied:**
   ```bash
   docker service inspect app-compress-digital-panel-bbswn2 --format '{{json .Spec.TaskTemplate.ContainerSpec.Labels}}'
   ```

2. **Verify Traefik is running:**
   ```bash
   docker ps | grep traefik
   ```

3. **Check Traefik logs:**
   ```bash
   docker logs root-traefik-1
   ```

### SSL Certificate Issues

1. **Verify certificate resolver name:**
   - Check Traefik configuration for resolver name
   - Use correct name in labels (e.g., `le` not `letsencrypt`)

2. **Check DNS:**
   - Ensure `financial-literacy.qualiaai.fr` points to the server
   - DNS must resolve before certificate can be issued

### 404 Errors

1. **Check routing rule:**
   - Verify hostname in label matches actual domain
   - Check for typos in domain name

2. **Verify service is running:**
   ```bash
   docker service ps app-compress-digital-panel-bbswn2
   ```

3. **Check application logs:**
   ```bash
   docker service logs app-compress-digital-panel-bbswn2
   ```

## Best Practices

1. **Use Container Labels (not service labels):**
   - In Docker Swarm, use `--container-label-add` not `--label-add`
   - Container labels are applied to actual containers

2. **Certificate Resolver:**
   - Always verify the resolver name matches Traefik configuration
   - Common names: `le`, `letsencrypt`, `cloudflare`

3. **Port Configuration:**
   - Ensure the port in the label matches the application's listening port
   - Next.js default is 3000

4. **Domain Configuration:**
   - Use backticks in Host rule: `Host(\`domain.com\`)`
   - This is required for proper parsing

## Related Documentation

- [DEPLOYMENT_FIX_CHECKLIST.md](./DEPLOYMENT_FIX_CHECKLIST.md) - General deployment troubleshooting
- [DOKPLOY_DATABASE_SETUP.md](./DOKPLOY_DATABASE_SETUP.md) - Database configuration
- [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md) - Test credentials setup


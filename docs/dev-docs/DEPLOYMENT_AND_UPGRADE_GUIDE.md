# Deployment & Upgrade Guide

## ⚠️ Critical Architecture Warning for AI Agents
**READ THIS FIRST:** This project runs on a **hybrid setup**. 
- **Code Repository:** Hosted on GitHub (`https://github.com/GuillaumeBld/Financial-Literacy-Toolkit`).
- **Runtime:** Hosted on a VPS (`srv850639`) using **Docker Compose** directly.
- **Orchestration:** While Dokploy is present on the server, the **Financial Literacy App** and **PostgreSQL Database** currently run as a **standalone Docker Compose project** (`/root/Financial-Literacy-Toolkit/docker-compose.yml`), **NOT** as a Dokploy-managed service.

**DO NOT** attempt to deploy or manage this application via the Dokploy dashboard unless explicitly instructed to migrate it. All operations must be performed via the CLI on the VPS.

---

## 1. System Components
- **Frontend/Backend:** Next.js application (container: `financial_literacy_app`)
- **Database:** PostgreSQL 15 (container: `financial_literacy_postgres`)
- **Reverse Proxy:** Traefik (manages SSL and routing)

## 2. GitHub Workflow (Version Control)
We use GitHub for version control and backup, but **pushing to GitHub does NOT trigger a deployment**.
- **Remote:** `origin` -> `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit.git`
- **Branch:** `main`

**Workflow for saving changes:**
```bash
# 1. Make changes to files on the VPS
# 2. Stage and commit
git add .
git commit -m "feat: description of changes"
# 3. Push to GitHub (for backup/history only)
git push origin main
```

---

## 3. Application Upgrade Process
To update the application (React/Next.js code):

1.  **Modify Code:** Edit files in `/root/Financial-Literacy-Toolkit/apps/web/...`
2.  **Rebuild Container:** You must rebuild the Docker image to apply changes.
    ```bash
    cd /root/Financial-Literacy-Toolkit
    docker compose up -d --build app
    ```
3.  **Verify:** Check health and logs.
    ```bash
    docker compose ps
    docker compose logs -f app
    ```

---

## 4. Database Management & Migrations
The database lives in a Docker container with a persistent volume (`financial_literacy_postgres_data`).

**To apply schema changes (Migrations):**
1.  Create a SQL migration file in `infra/` (e.g., `infra/migration-new-feature.sql`).
2.  Execute it against the running container:
    ```bash
    docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/migration-new-feature.sql
    ```
3.  **Important:** Update the master `infra/schema.sql` file to reflect the change for future reference.

**To inspect the database:**
```bash
docker exec -it financial_literacy_postgres psql -U finlit_user -d financial_literacy
# Common commands: \dt (list tables), \d table_name (schema), select * from ...
```

---

## 5. Troubleshooting & Safety
- **Logs:** `docker compose logs --tail=100 -f app`
- **Restarting:** `docker compose restart app`
- **Backup:** The database volume is persistent. Do not run `docker compose down -v` unless you intend to delete all data.

**Anti-Cheating Implementation Note:**
The `attempts` table now has a `metadata` JSONB column. The frontend sends `tabSwitches` and `isFullscreen` data in the submission payload.

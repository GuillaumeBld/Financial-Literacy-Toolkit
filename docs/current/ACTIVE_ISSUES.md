# Active Issues

**Status:** ✅ ACTIVE
**Last Updated:** 2026-01-13
**Maintained By:** Operations Team

---

## Current Status

✅ **No Active Issues**

All systems operational as of 2026-01-13 14:25 UTC.

---

## Recently Resolved

### 2026-01-13: Instructor Login Failures
- **Issue:** Instructors unable to log in (password mismatch)
- **Cause:** Database had bcrypt hashes, application was using SHA256
- **Resolution:** Upgraded application to bcrypt authentication
- **Status:** ✅ Resolved
- **Documentation:** [../security/BCRYPT_UPGRADE_2026-01-13.md](../security/BCRYPT_UPGRADE_2026-01-13.md)

### 2026-01-13: Website Not Displaying
- **Issue:** Website showed 504 Gateway Timeout via Traefik
- **Cause:** Container needed restart after configuration changes
- **Resolution:** Restarted financial_literacy_app container
- **Status:** ✅ Resolved

---

## Monitoring

### How to Report Issues
1. Check this document first
2. Check [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)
3. Check [../operations/TROUBLESHOOTING.md](../operations/TROUBLESHOOTING.md)
4. If issue persists, create incident report

### Issue Template
```markdown
## Issue Title

**Discovered:** YYYY-MM-DD HH:MM UTC
**Severity:** Critical | High | Medium | Low
**Impact:** [What's affected]
**Workaround:** [If available]

### Symptoms
- [What users see]
- [Error messages]

### Investigation
- [Steps taken to diagnose]
- [Findings]

### Resolution Plan
- [ ] Step 1
- [ ] Step 2
```

---

## Known Limitations (Not Issues)

### Traefik Connection Delays
- **Behavior:** First request after container restart may take 10-30s
- **Cause:** Traefik needs to discover and register new container
- **Mitigation:** Wait 30s after restarts before testing
- **Status:** Expected behavior

### Session Token Expiry
- **Behavior:** Instructors need to re-login after 24 hours
- **Cause:** Session tokens expire for security
- **Mitigation:** None needed (by design)
- **Status:** Working as intended

---

**Last Review:** 2026-01-13 14:25 UTC

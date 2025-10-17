# Release playbook

1. Tag release and run CI.
2. Apply migrations.
3. Deploy worker, then web.
4. Run smoke tests.
5. Monitor for 30 minutes.

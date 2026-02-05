#!/bin/bash
# update-docs-data.sh
# Updates documentation data files with latest statistics from the database
# Run via cron every 6 hours until Monday Feb 10, 2026

set -euo pipefail

LOG_FILE="/var/log/finlit-docs.log"
WRITING_DIR="/root/Financial-Literacy-Toolkit/docs/data"
DB_CONN="postgresql://finlit_user:FinLit2025SecurePassword@localhost:6432/financial_literacy"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting documentation data update..."

# Ensure writing directory exists
mkdir -p "$WRITING_DIR"

# Update collection-summary.csv
log "Updating collection-summary.csv..."
docker run --rm --network host postgres:15-alpine psql "$DB_CONN" -t -A -F',' -c "
WITH daily_stats AS (
    SELECT
        DATE(u.created_at) as date,
        COUNT(DISTINCT u.user_id) as new_enrollments,
        COUNT(DISTINCT a.attempt_id) FILTER (WHERE a.submitted_at IS NOT NULL) as completed_assessments
    FROM users u
    LEFT JOIN attempts a ON u.user_id = a.user_id
    WHERE u.created_at >= '2026-02-02'
    GROUP BY DATE(u.created_at)
    ORDER BY date
),
cumulative AS (
    SELECT
        date,
        new_enrollments,
        completed_assessments,
        SUM(new_enrollments) OVER (ORDER BY date) as cumulative_enrollments,
        SUM(completed_assessments) OVER (ORDER BY date) as cumulative_completed
    FROM daily_stats
)
SELECT date, new_enrollments, completed_assessments, cumulative_enrollments, cumulative_completed
FROM cumulative;
" > /tmp/collection-summary-data.csv

# Add header and write file
echo "date,new_enrollments,completed_assessments,cumulative_enrollments,cumulative_completed" > "$WRITING_DIR/collection-summary.csv"
cat /tmp/collection-summary-data.csv >> "$WRITING_DIR/collection-summary.csv"
rm /tmp/collection-summary-data.csv

log "collection-summary.csv updated"

# Update score distribution
log "Updating domain-score-distribution.csv..."
docker run --rm --network host postgres:15-alpine psql "$DB_CONN" -t -A -F',' -c "
WITH ranges AS (
    SELECT
        CASE
            WHEN overall >= 100 THEN '100'
            ELSE CONCAT(FLOOR(overall::numeric/10)*10, '-', FLOOR(overall::numeric/10)*10+9)
        END as score_range,
        FLOOR(overall::numeric/10)*10 as sort_order,
        COUNT(*) as count
    FROM scores
    GROUP BY
        CASE
            WHEN overall >= 100 THEN '100'
            ELSE CONCAT(FLOOR(overall::numeric/10)*10, '-', FLOOR(overall::numeric/10)*10+9)
        END,
        FLOOR(overall::numeric/10)*10
    ORDER BY sort_order
)
SELECT score_range, count, ROUND(count * 100.0 / SUM(count) OVER (), 2) as percentage
FROM ranges;
" > /tmp/score-dist-data.csv

echo "score_range,count,percentage" > "$WRITING_DIR/domain-score-distribution.csv"
cat /tmp/score-dist-data.csv >> "$WRITING_DIR/domain-score-distribution.csv"
rm /tmp/score-dist-data.csv

log "domain-score-distribution.csv updated"

# Update submission timeline
log "Updating submission-timeline.csv..."
docker run --rm --network host postgres:15-alpine psql "$DB_CONN" -t -A -F',' -c "
WITH hourly AS (
    SELECT
        EXTRACT(HOUR FROM submitted_at)::int as hour_utc,
        COUNT(*) as submissions
    FROM attempts
    WHERE submitted_at IS NOT NULL
    GROUP BY EXTRACT(HOUR FROM submitted_at)
    ORDER BY hour_utc
)
SELECT hour_utc, submissions, ROUND(submissions * 100.0 / SUM(submissions) OVER (), 2) as percentage
FROM hourly;
" > /tmp/timeline-data.csv

echo "hour_utc,submissions,percentage" > "$WRITING_DIR/submission-timeline.csv"
cat /tmp/timeline-data.csv >> "$WRITING_DIR/submission-timeline.csv"
rm /tmp/timeline-data.csv

log "submission-timeline.csv updated"

# Get summary statistics for logging
TOTAL_USERS=$(docker run --rm --network host postgres:15-alpine psql "$DB_CONN" -t -A -c "SELECT COUNT(*) FROM users;")
TOTAL_COMPLETED=$(docker run --rm --network host postgres:15-alpine psql "$DB_CONN" -t -A -c "SELECT COUNT(*) FROM attempts WHERE submitted_at IS NOT NULL;")
AVG_SCORE=$(docker run --rm --network host postgres:15-alpine psql "$DB_CONN" -t -A -c "SELECT ROUND(AVG(overall::numeric), 2) FROM scores;")

log "Summary: Users=$TOTAL_USERS, Completed=$TOTAL_COMPLETED, AvgScore=$AVG_SCORE%"
log "Documentation data update complete."

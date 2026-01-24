const https = require('https');

const PROJECT_REF = 'fzjirysmzvhsetmcmfqg';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6amlyeXNtenZoc2V0bWNtZnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1OTI0NywiZXhwIjoyMDc2OTM1MjQ3fQ.skc9HtPFT56NbpS5KkeCF_3-GWU3WK9mKb5tDpQ1WOM';

function getTableCount(tableName) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: `/rest/v1/${tableName}?select=*&limit=1`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    };

    const req = https.request(options, (res) => {
      // The count is returned in the 'content-range' header: "0-0/15" means rows 0-0 returned, total 15.
      // If table is empty: "*/0"
      const contentRange = res.headers['content-range'];
      resolve({ tableName, contentRange, statusCode: res.statusCode });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function check() {
    try {
        console.log("Checking 'users' table...");
        const users = await getTableCount('users');
        console.log(`Status: ${users.statusCode}`);
        console.log(`Content-Range: ${users.contentRange}`);
        if (users.contentRange) {
             const total = users.contentRange.split('/')[1];
             console.log(`Total users: ${total}`);
        }

        console.log("\nChecking 'attempts' table...");
        const attempts = await getTableCount('attempts');
        console.log(`Status: ${attempts.statusCode}`);
        console.log(`Content-Range: ${attempts.contentRange}`);
         if (attempts.contentRange) {
             const total = attempts.contentRange.split('/')[1];
             console.log(`Total attempts: ${total}`);
        }
    } catch (e) {
        console.error(e);
    }
}

check();

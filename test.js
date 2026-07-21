const fs = require('fs');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim().replace(/^['"]|['"]$/g, '')))
);

const headers = {
  apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

async function test() {
  console.log("=== USERS ===");
  const r1 = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/users?role=in.(TEKNISI,ADMINISTRATOR,PIMPINAN)&select=id,name,role,department_id,departments!users_department_id_fkey(name)', { headers });
  console.log(await r1.json());

  console.log("\n=== TEAMS ===");
  const r2 = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/teams?select=id,name,users!teams_team_lead_id_fkey(name),user_teams(count)', { headers });
  console.log(await r2.json());

  console.log("\n=== DEPARTMENTS ===");
  const r3 = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/departments?select=id,name,users!departments_manager_id_fkey(name),agents:users!users_department_id_fkey(count)', { headers });
  console.log(await r3.json());
}

test();

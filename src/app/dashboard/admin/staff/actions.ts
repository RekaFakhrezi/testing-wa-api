'use server';

import { createClient } from '@/src/lib/supabase/server';

export async function getAgents() {
  const supabase = await createClient();
  
  // Fetch users that are likely staff (TEKNISI, ADMINISTRATOR, PIMPINAN)
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      username,
      email,
      phone_number,
      role,
      is_active,
      is_locked,
      created_at,
      last_login_at,
      department_id,
      departments!users_department_id_fkey(name)
    `)
    .in('role', ['TEKNISI', 'ADMINISTRATOR', 'PIMPINAN'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }

  // Format to match UI expectations
  return users.map((u: any) => ({
    id: u.id,
    name: u.name,
    username: u.username || u.email?.split('@')[0] || '-',
    status: u.is_active && !u.is_locked ? 'Active' : 'Disabled',
    department: u.departments?.name || 'Unassigned',
    created: new Date(u.created_at).toLocaleDateString('id-ID'),
    lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('id-ID') : 'Never',
    email: u.email,
    phone: u.phone_number,
    role: u.role
  }));
}

export async function getTeams() {
  const supabase = await createClient();
  
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      status,
      created_at,
      updated_at,
      users!team_lead_id(name),
      user_teams(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }

  return teams.map((t: any) => ({
    id: t.id,
    name: t.name,
    status: t.status ? 'Active' : 'Disabled',
    members: t.user_teams?.[0]?.count || 0,
    teamLead: t.users?.name || 'None',
    created: new Date(t.created_at).toLocaleDateString('id-ID'),
    lastUpdated: new Date(t.updated_at).toLocaleDateString('id-ID')
  }));
}

export async function getDepartments() {
  const supabase = await createClient();
  
  const { data: depts, error } = await supabase
    .from('departments')
    .select(`
      id,
      name,
      status,
      type,
      email_address,
      users!departments_manager_id_fkey(name),
      agents:users!users_department_id_fkey(count)
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }

  return depts.map((d: any) => ({
    id: d.id,
    name: d.name,
    status: d.status ? 'Active' : 'Disabled',
    type: d.type || 'Public',
    agents: d.agents?.[0]?.count || 0,
    emailAddress: d.email_address || 'None',
    manager: d.users?.name || 'None'
  }));
}

export async function getAgentDetail(agentId: string) {
  const supabase = await createClient();
  
  // Fetch basic details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', agentId)
    .single();

  if (userError || !user) {
    return null;
  }

  // Fetch assigned teams
  const { data: userTeams } = await supabase
    .from('user_teams')
    .select('alerts_enabled, teams(id, name)')
    .eq('user_id', agentId);

  const formattedTeams = userTeams?.map((ut: any) => ({
    id: ut.teams?.id,
    name: ut.teams?.name,
    alerts: ut.alerts_enabled
  })) || [];

  return {
    ...user,
    teams: formattedTeams
  };
}

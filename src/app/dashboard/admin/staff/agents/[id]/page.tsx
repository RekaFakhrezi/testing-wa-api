'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAgentDetail, getTeams } from '../../actions';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('account');
  const [assignedTeams, setAssignedTeams] = useState<any[]>([]);

  React.useEffect(() => {
    if (agentId !== 'new') {
      getAgentDetail(agentId).then(data => {
        if (data) {
          setAgent(data);
          setAssignedTeams(data.teams || []);
        }
      });
    }
    getTeams().then(data => setAllTeams(data));
  }, [agentId]);

  if (!agent) {
    return <div className="p-10 text-center text-slate-500">Loading agent data...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2">
          <Link href="/dashboard/admin/staff/agents" className="hover:text-slate-800 transition-colors">Agents</Link>
          <span>/</span>
          <span className="text-slate-800">Manage Agent</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Manage Agent <span className="text-slate-400 font-normal">—</span> <span className="text-blue-600">{agent.name}</span>
        </h2>
      </div>

      {/* Tabs Nav */}
      <div className="flex items-center gap-1 border-b border-slate-200 px-6 pt-4 bg-slate-50/30 overflow-x-auto scrollbar-hide">
        {['Account', 'Access', 'Permissions', 'Teams'].map(tab => {
          const isTabActive = activeTab === tab.toLowerCase();
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-5 py-2.5 text-sm font-bold whitespace-nowrap rounded-t-lg border border-b-0 transition-colors ${
                isTabActive 
                  ? 'bg-white border-slate-200 text-slate-800' 
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              style={isTabActive ? { marginBottom: '-1px' } : {}}
            >
              {tab === 'Account' ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {tab}
                </div>
              ) : (
                tab
              )}
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="p-6 md:p-8 flex flex-col bg-white min-h-[400px]">
        
        {/* =========================================================================
            TAB 1: ACCOUNT 
            ========================================================================= */}
        {activeTab === 'account' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 flex flex-col items-center gap-3 pt-2">
                <div className="w-28 h-28 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm overflow-hidden">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avatar</span>
              </div>
              
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Name</label>
                  <div className="flex gap-3">
                    <input type="text" defaultValue={agent.name.split(' ')[0]} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" />
                    <input type="text" defaultValue={agent.name.split(' ').slice(1).join(' ')} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input type="email" defaultValue={agent.email} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Phone Number</label>
                  <div className="flex gap-2">
                    <input type="text" defaultValue={agent.phone} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" />
                    <input type="text" placeholder="Ext" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                  <input type="text" defaultValue={agent.mobile} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" />
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-base text-slate-800">Authentication</h4>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex flex-col gap-1.5 w-full sm:max-w-xs">
                  <label className="text-sm font-bold text-slate-700">Username <span className="text-red-500">*</span></label>
                  <input type="text" defaultValue={agent.username} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" />
                </div>
                <button className="bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Set Password
                </button>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-base text-slate-800">Status and Settings</h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group w-max">
                  <input type="checkbox" defaultChecked={agent.is_locked} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-slate-700 font-medium select-none group-hover:text-slate-900 transition-colors">Locked</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group w-max">
                  <input type="checkbox" defaultChecked={agent.is_admin || agent.role === 'ADMINISTRATOR'} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-slate-700 font-medium select-none group-hover:text-slate-900 transition-colors">Administrator</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group w-max">
                  <input type="checkbox" defaultChecked={agent.limit_ticket_access !== false} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-slate-700 font-medium select-none group-hover:text-slate-900 transition-colors">Limit ticket access to ONLY assigned tickets</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group w-max">
                  <input type="checkbox" defaultChecked={agent.vacation_mode} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-slate-700 font-medium select-none group-hover:text-slate-900 transition-colors">Vacation Mode</span>
                </label>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-sm text-slate-800">Internal Notes: Be liberal, they're internal</h4>
              <textarea 
                rows={5}
                defaultValue={agent.internal_notes || ''}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              ></textarea>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 4: TEAMS 
            ========================================================================= */}
        {activeTab === 'teams' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col gap-1 border-b border-slate-200 pb-3">
              <h4 className="font-bold text-base text-slate-800">Assigned Teams</h4>
              <p className="text-sm text-slate-500">Agent will have access to tickets assigned to a team they belong to regardless of the ticket's department. Alerts can be enabled for each associated team.</p>
            </div>

            <div className="flex flex-col">
              {assignedTeams.map(team => (
                <div key={team.id} className="flex items-center justify-between py-3 border-b border-slate-100 group">
                  <span className="text-sm font-semibold text-slate-800">{team.name}</span>
                  <div className="flex items-center gap-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={team.alerts} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-bold text-slate-700">Alerts</span>
                    </label>
                    <button className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-lg">+</div>
              <select className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
                <option>— Select Team —</option>
                {allTeams.filter(t => !assignedTeams.find(a => a.id === t.id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className="bg-slate-100 border border-slate-300 px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200">
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="bg-slate-50/50 border-t border-slate-200 p-5 md:p-6 flex flex-wrap items-center justify-center gap-3">
        <button className="bg-slate-800 text-white px-7 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 transition-all active:scale-95">
          Save Changes
        </button>
        <button className="bg-white border border-slate-300 text-slate-600 px-7 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors active:scale-95">
          Reset
        </button>
        <button className="bg-white border border-slate-300 text-slate-600 px-7 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors active:scale-95">
          Cancel
        </button>
      </div>

    </div>
  );
}

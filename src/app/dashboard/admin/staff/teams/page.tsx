'use client';
import React, { useState } from 'react';
import { getTeams } from '../actions';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);

  React.useEffect(() => {
    getTeams().then(data => setTeams(data));
  }, []);

  const handleSelect = (id: number) => {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTeams(teams.map(t => t.id));
    } else {
      setSelectedTeams([]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Action Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        
        {/* Left: Title or Info (Optional) */}
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            Teams
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </h3>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors w-full sm:w-auto justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add New Team
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              More
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-10">
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Enable</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> Disable</button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"><svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selectedTeams.length === teams.length && teams.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Team Name <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Status <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Members <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Team Lead <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Created <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Last Updated <SortIcon /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => handleSelect(team.id)}
                  />
                </td>
                <td className="px-5 py-3.5 font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                  {team.name}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    team.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {team.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-blue-600">{team.members}</td>
                <td className="px-5 py-3.5 text-slate-500">{team.teamLead}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{team.created}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{team.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 text-xs font-semibold text-slate-500 flex items-center gap-2">
          <span>Select:</span>
          <button onClick={() => setSelectedTeams(teams.map(t => t.id))} className="text-blue-600 hover:underline">All</button>
          <button onClick={() => setSelectedTeams([])} className="text-blue-600 hover:underline">None</button>
          <button onClick={() => {
            const allIds = teams.map(t => t.id);
            setSelectedTeams(allIds.filter(id => !selectedTeams.includes(id)));
          }} className="text-blue-600 hover:underline">Toggle</button>
        </div>
      </div>
    </div>
  );
}

function SortIcon() {
  return (
    <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
      <svg className="w-2.5 h-2.5 -mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8l4 4H8z"/></svg>
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16l-4-4h8z"/></svg>
    </div>
  );
}

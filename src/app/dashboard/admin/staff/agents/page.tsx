'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { getAgents } from '../actions';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

  React.useEffect(() => {
    getAgents().then(data => setAgents(data));
  }, []);

  // Toggle single checkbox
  const handleSelect = (id: number) => {
    setSelectedAgents(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Toggle all checkboxes
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAgents(agents.map(a => a.id));
    } else {
      setSelectedAgents([]);
    }
  };

  // Filter logic
  const filteredAgents = agents.filter(agent => {
    const matchSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        agent.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter ? agent.department === deptFilter : true;
    return matchSearch && matchDept;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Action Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        
        {/* Left: Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari agent..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow w-full sm:w-64"
            />
          </div>
          
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">Semua Departemen</option>
            <option value="Sistem Informasi">Sistem Informasi</option>
            <option value="Unit Layanan Terpadu">Unit Layanan Terpadu</option>
          </select>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors w-full sm:w-auto justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add New Agent
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              More
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-10">
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Enable</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> Disable</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Reset Permissions</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> Change Department</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export Agents</button>
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
                  checked={selectedAgents.length === agents.length && agents.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Name <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Username <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Status <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Department <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Created <SortIcon /></div>
              </th>
              <th className="px-5 py-3 cursor-pointer group">
                <div className="flex items-center gap-1">Last Login <SortIcon /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAgents.map((agent) => (
              <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedAgents.includes(agent.id)}
                    onChange={() => handleSelect(agent.id)}
                  />
                </td>
                <td className="px-5 py-3.5 font-bold">
                  <Link href={`/dashboard/admin/staff/agents/${agent.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {agent.name}
                  </Link>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-700">{agent.username}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    agent.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {agent.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-blue-600 hover:underline cursor-pointer">{agent.department}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{agent.created}</td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{agent.lastLogin}</td>
              </tr>
            ))}
            {filteredAgents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                  Tidak ada agen yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

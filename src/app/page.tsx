import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* Header */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-bold text-xl tracking-tight text-slate-900">
            HaloDesk IT
          </div>
          <div className="flex gap-4">
            <Link
              href="/simulator"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Simulasi WhatsApp
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Login Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
          Landing Page Kosongan
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
          Landing page
        </p>
      </main>
    </div>
  );
}

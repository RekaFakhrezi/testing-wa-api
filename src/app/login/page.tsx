import React from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8 bg-blue-600 text-white text-center">
                    <h1 className="text-2xl font-bold">Portal Petugas</h1>
                    <p className="text-blue-100 mt-2">Login dengan kredensial Anda</p>
                </div>
                <div className="p-6">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
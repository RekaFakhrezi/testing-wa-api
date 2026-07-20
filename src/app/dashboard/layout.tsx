import { createClient } from '@/src/lib/supabase/server';
import React from 'react';
import DashboardLayoutWrapper from '@/src/components/DashboardLayoutWrapper';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        redirect('/login');
    }

    const { data: dbUser } = await supabase
        .from('users')
        .select('name, role')
        .eq('auth_id', authUser.id)
        .maybeSingle();

    if (!dbUser) {
        // Fallback for demo simulator
        if (process.env.NEXT_PUBLIC_USE_SIMULATOR === 'true') {
            return (
                <DashboardLayoutWrapper user={{ name: 'Demo User', role: 'ADMIN' }}>
                    {children}
                </DashboardLayoutWrapper>
            );
        }
        redirect('/login');
    }

    return (
        <DashboardLayoutWrapper user={dbUser as any}>
            {children}
        </DashboardLayoutWrapper>
    );
}

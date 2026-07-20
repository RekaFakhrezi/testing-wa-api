'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAs(userId: string, role: string) {
    const cookieStore = await cookies();
    cookieStore.set('auth_user_id', userId, { path: '/' });
    cookieStore.set('auth_role', role, { path: '/' });
    
    if (role === 'TEKNISI') redirect('/dashboard/teknisi');
    if (role === 'OPERATOR_HELPDESK') redirect('/dashboard/operator');
    redirect('/dashboard/admin/categories'); // Default fallback
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('auth_user_id');
    cookieStore.delete('auth_role');
    redirect('/login');
}

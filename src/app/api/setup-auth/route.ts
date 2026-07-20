import { NextResponse } from 'next/server';
import { supabaseService } from '@/src/lib/supabase/service';

export async function GET() {
    try {
        const password = 'HaloDesk123!';

        // Definition of the 6 agents (including Admin)
        const agents = [
            {
                email: 'admin@halodesk.com',
                phone: '080000000000',
                name: 'System Administrator',
                identity: 'ADMIN-01',
                faculty: 'Helpdesk Center',
                role: 'ADMINISTRATOR',
                departmentName: null
            },
            {
                email: 'operator@halodesk.com',
                phone: '089900000000',
                name: 'Admin Operator Utama',
                identity: 'OP-001',
                faculty: 'Helpdesk Center',
                role: 'OPERATOR_HELPDESK',
                departmentName: null
            },
            {
                email: 'agent.software@halodesk.com',
                phone: '082100000001',
                name: 'Andi Software',
                identity: 'TKN-SW-01',
                faculty: 'DSTI',
                role: 'TEKNISI',
                departmentName: 'Unit Software & Aplikasi'
            },
            {
                email: 'agent.hardware@halodesk.com',
                phone: '082100000002',
                name: 'Budi Hardware',
                identity: 'TKN-HW-01',
                faculty: 'DSTI',
                role: 'TEKNISI',
                departmentName: 'Unit Hardware & Perangkat'
            },
            {
                email: 'agent.jaringan@halodesk.com',
                phone: '082100000003',
                name: 'Citra Jaringan',
                identity: 'TKN-NW-01',
                faculty: 'DSTI',
                role: 'TEKNISI',
                departmentName: 'Unit Jaringan & Infrastruktur'
            },
            {
                email: 'agent.keamanan@halodesk.com',
                phone: '082100000004',
                name: 'Deni Keamanan',
                identity: 'TKN-SEC-01',
                faculty: 'DSTI',
                role: 'TEKNISI',
                departmentName: 'Unit Keamanan Siber'
            }
        ];

        const results = [];

        for (const agent of agents) {
            // 1. Create user in Supabase Auth
            let authUserId = null;
            const { data: authUser, error: authError } = await supabaseService.auth.admin.createUser({
                email: agent.email,
                password: password,
                email_confirm: true, // auto confirm
            });

            if (authError) {
                // If user already exists, try to fetch them
                const { data: listData, error: listError } = await supabaseService.auth.admin.listUsers();
                const existingUser = listData?.users.find(u => u.email === agent.email);
                
                if (existingUser) {
                    authUserId = existingUser.id;
                    // Force update password just in case
                    await supabaseService.auth.admin.updateUserById(authUserId, { password: password });
                } else {
                    results.push({ email: agent.email, status: 'Failed Auth Creation', error: authError.message });
                    continue;
                }
            } else {
                authUserId = authUser.user.id;
            }

            // 2. Find department_id if applicable
            let deptId = null;
            if (agent.departmentName) {
                const { data: dept } = await supabaseService.from('departments').select('id').eq('name', agent.departmentName).single();
                if (dept) deptId = dept.id;
            }

            // 3. Insert or Update into public.users
            const { error: dbError } = await supabaseService.from('users').upsert({
                auth_id: authUserId, // Linking the auth user
                email: agent.email,
                phone_number: agent.phone,
                name: agent.name,
                identity_number: agent.identity,
                faculty_unit: agent.faculty,
                role: agent.role,
                department_id: deptId
            }, { onConflict: 'email' });

            if (dbError) {
                results.push({ email: agent.email, status: 'Failed DB Insertion', error: dbError.message });
            } else {
                results.push({ email: agent.email, status: 'Success' });
            }
        }

        return NextResponse.json({
            message: 'Setup Auth Complete',
            results
        });

    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

'use server';

import { createClient } from '@/src/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createDepartment(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) return { error: 'Nama departemen harus diisi' };

    const { error } = await supabase
        .from('departments')
        .insert({ name, description });

    if (error) {
        console.error('Create department error:', error);
        return { error: 'Gagal menambahkan departemen' };
    }

    revalidatePath('/dashboard/admin/technicians');
    return { success: true };
}

export async function updateDepartment(formData: FormData) {
    const supabase = await createClient();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!id || !name) return { error: 'Data tidak lengkap' };

    const { error } = await supabase
        .from('departments')
        .update({ name, description })
        .eq('id', id);

    if (error) {
        console.error('Update department error:', error);
        return { error: 'Gagal memperbarui departemen' };
    }

    revalidatePath('/dashboard/admin/technicians');
    return { success: true };
}

export async function deleteDepartment(formData: FormData) {
    const supabase = await createClient();
    const id = formData.get('id') as string;

    if (!id) return { error: 'ID Departemen tidak ditemukan' };

    // Check if there are users in this department
    const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id);

    if (countError) {
        console.error('Check department users error:', countError);
        return { error: 'Gagal mengecek data departemen' };
    }

    if (count && count > 0) {
        return { error: `Tidak dapat menghapus departemen ini karena masih ada ${count} teknisi yang terdaftar di dalamnya. Kosongkan atau pindahkan teknisi terlebih dahulu.` };
    }

    const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete department error:', error);
        return { error: 'Gagal menghapus departemen' };
    }

    revalidatePath('/dashboard/admin/technicians');
    return { success: true };
}

export async function createTechnician(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const phone_number = formData.get('phone_number') as string;
    const department_id = formData.get('department_id') as string;
    const identity_number = formData.get('identity_number') as string;

    if (!name || !phone_number || !department_id) {
        return { error: 'Nama, Nomor WA, dan Departemen wajib diisi' };
    }

    // Insert as TEKNISI role
    const { error } = await supabase
        .from('users')
        .upsert({ 
            phone_number, 
            name, 
            identity_number: identity_number || null,
            role: 'TEKNISI',
            department_id: department_id || null,
            is_active: true
        }, { onConflict: 'phone_number' });

    if (error) {
        console.error('Create technician error:', error);
        return { error: 'Gagal mendaftarkan teknisi (mungkin nomor WA sudah terdaftar sebagai pengguna lain)' };
    }

    revalidatePath('/dashboard/admin/technicians');
    return { success: true };
}

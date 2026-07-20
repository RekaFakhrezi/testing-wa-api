export async function sendTicketNotification(ticketNumber: string, status: string, pelaporPhone: string) {
    let waMsg = '';

    switch (status) {
        case 'Open':
            waMsg = `Ticket Anda berhasil dibuat.\nNomor Ticket\n${ticketNumber}`;
            break;
        case 'Diproses':
            waMsg = `Ticket Anda telah ditugaskan kepada Teknisi dan sedang dikerjakan.\nNomor Ticket\n${ticketNumber}`;
            break;
        case 'Selesai/Close':
            waMsg = `Masalah telah diselesaikan.\nSilakan lakukan konfirmasi melalui WhatsApp.\nNomor Ticket\n${ticketNumber}\n\n--------------------------------\nApakah masalah sudah benar-benar teratasi?\n1. Ya\n2. Belum`;
            break;
        case 'Ditolak/Dibatalkan':
            waMsg = `Mohon maaf, tiket Anda telah ditolak atau dibatalkan.\nNomor Ticket\n${ticketNumber}`;
            break;
        case 'Dibuka Kembali/Reopen':
            waMsg = `Tiket Anda diaktifkan kembali karena kendala belum terselesaikan.\nNomor Ticket\n${ticketNumber}`;
            break;
    }

    if (waMsg && pelaporPhone) {
        if (process.env.NEXT_PUBLIC_USE_SIMULATOR === 'true') {
            const { supabaseService } = await import('@/src/lib/supabase/service');
            await supabaseService.from('mock_wa_messages').insert({
                phone_number: pelaporPhone,
                message: waMsg,
                direction: 'out'
            });
            return;
        }

        const url = 'https://www.wasenderapi.com/api/send-message';
        const token = process.env.WASENDER_BEARER_TOKEN;

        if (token) {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ to: pelaporPhone, text: waMsg }),
            }).catch(console.error);
        } else {
            console.warn('WASENDER_BEARER_TOKEN is not defined');
        }
    }
}

export function calculateIsOverdue(ticket: any, slaConfigs: any[]): boolean {
    if (!ticket || !ticket.created_at) return false;
    // Jika tiket sudah selesai, tidak dihitung overdue lagi secara real-time
    // (Bisa juga dihitung berdasarkan resolved_at, tapi untuk tampilan realtime badge, 
    // jika sudah selesai anggap aman atau bandingkan dengan target)
    if (ticket.status === 'Selesai/Close' || ticket.status === 'Selesai' || ticket.status === 'Ditolak') {
        return false;
    }

    const priority = ticket.priority || 'Rendah'; // Default Rendah jika belum diset
    const sla = slaConfigs?.find(s => s.priority_level === priority);
    
    // Default 24 jam jika tidak ada config
    const targetMinutes = sla ? sla.resolution_time_minutes : (24 * 60);

    const createdTime = new Date(ticket.created_at).getTime();
    const now = new Date().getTime();
    
    const elapsedMinutes = (now - createdTime) / 60000;

    return elapsedMinutes > targetMinutes;
}

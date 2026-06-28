const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3001';

export async function sendWhatsAppMessage(number: string, message: string) {
    try {
        console.log(`\n[WhatsApp] 🚀 Triggering notification...`);
        console.log(`[WhatsApp] 📍 Endpoint: ${WHATSAPP_BOT_URL}/send-message`);
        console.log(`[WhatsApp] 📱 Target Number: ${number}`);
        console.log(`[WhatsApp] 💬 Message Length: ${message.length} chars`);
        
        const response = await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number, message }),
        });

        const data = await response.json();
        console.log(`[WhatsApp] 📥 Bot Response:`, data);
        
        if (!response.ok) {
            console.error(`[WhatsApp] ❌ Bot returned error:`, data.error);
            return { success: false, error: data.error };
        }

        console.log(`[WhatsApp] ✅ Message successfully handed over to bot.`);
        return { success: true, data };
    } catch (error: any) {
        console.error('[WhatsApp] ❌ Network/Fetch Error:', error.message);
        return { success: false, error: error.message };
    }
}

export function formatBookingMessage(params: {
    name: string;
    bookingCode: string;
    courtName: string;
    date: string;
    time: string;
}) {
    return `Booking Confirmed ✅

Halo *${params.name}*,

booking kamu telah berhasil dikonfirmasi.

*Kode Booking:*
${params.bookingCode}

*Lapangan:*
${params.courtName}

*Jadwal:*
${params.date}

*Jam:*
${params.time}

*Status:*
CONFIRMED

Sampai jumpa di PADELGO 🔥`;
}

export function formatMembershipMessage(params: {
    name: string;
    expiresAt: string;
}) {
    return `Elite Membership Activated! 💎

Halo *${params.name}*,

Selamat! Membership Elite kamu telah aktif.
Sekarang kamu bisa menikmati:
- H-14 Priority Booking Window
- Member Exclusive Rates
- Premium Privileges

*Berlaku hingga:*
${params.expiresAt}

Terima kasih telah bergabung dengan komunitas Elite PADELGO! 🎾🚀`;
}

async function testWA() {
    const number = "6285156683525"; // User can change this
    const message = "Test message from PADELGO Debugger 🔥";
    
    console.log(`[Test] Sending to ${number}...`);
    
    try {
        const response = await fetch('http://localhost:3001/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number, message }),
        });

        const data = await response.json();
        console.log(`[Test] Response:`, data);
        
        if (response.ok) {
            console.log("✅ SUCCESS! Check your WhatsApp.");
        } else {
            console.log("❌ FAILED. Check bot terminal.");
        }
    } catch (error) {
        console.error("❌ ERROR:", error.message);
    }
}

testWA();

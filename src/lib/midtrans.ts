import { Buffer } from "buffer";

interface CustomerDetails {
  name: string;
  phone: string;
  email?: string;
}

export async function createSnapTransaction(
  orderId: string,
  grossAmount: number,
  customer: CustomerDetails
) {
  // Step 3 — Verify Environment Variables dynamically at runtime
  console.log("[Midtrans] SERVER KEY:", !!process.env.MIDTRANS_SERVER_KEY);
  console.log("[Midtrans] CLIENT KEY:", !!process.env.MIDTRANS_CLIENT_KEY);
  console.log("[Midtrans] IS PROD:", process.env.MIDTRANS_IS_PRODUCTION);

  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  console.log("SERVER KEY RAW:", serverKey);
  console.log("CLIENT KEY RAW:", clientKey);

  const SNAP_API_URL = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  // Step 4 — Verify createSnapTransaction Is Actually Called
  console.log("[Midtrans] Creating transaction");
  console.log("[Midtrans] Order ID:", orderId);
  console.log("[Midtrans] Amount:", grossAmount);

  if (!serverKey) {
    throw new Error("Missing MIDTRANS_SERVER_KEY in environment variables.");
  }

  const base64Auth = Buffer.from(`${serverKey}:`).toString("base64");
  const authHeader = `Basic ${base64Auth}`;

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(grossAmount),
    },
    customer_details: {
      first_name: customer.name,
      phone: customer.phone,
      email: customer.email || `${customer.name.toLowerCase().replace(/\s+/g, "")}@example.com`,
    },
    credit_card: {
      secure: true,
    },
  };

  console.log(`[Midtrans] Generating Snap Token for Order ID: ${orderId}, Amount: ${grossAmount}`);

  const response = await fetch(SNAP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Midtrans] Error from API: ${response.status} - ${errorBody}`);
    throw new Error(`Midtrans transaction creation failed: ${response.statusText} (${errorBody})`);
  }

  // Step 5 — Log Full Midtrans Response
  const data = await response.json();
  console.log("[Midtrans] Response:", data);

  return {
    token: data.token as string,
    redirectUrl: data.redirect_url as string,
    clientKey,
    isProduction,
  };
}

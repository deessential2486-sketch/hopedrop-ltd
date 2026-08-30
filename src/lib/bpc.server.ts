import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "costomerservice5420@gmail.com";
const CONTACT_CENTER_EMAIL = "binaceolivia@gmail.com";

export async function notifyBpcSubmission(
  userId: string,
  submissionId: string,
  origin: string,
): Promise<{ success: true } | { error: string }> {
  const { data: submission, error } = await supabaseAdmin
    .from("bpc_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !submission) {
    console.error("Submission lookup failed:", error?.message);
    return { error: "Submission not found" };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", submission.user_id)
    .maybeSingle();

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(submission.user_id);
  const userEmail = authUser?.user?.email || "Unknown";
  const userName = profile?.full_name || "Unknown";
  const userPhone = profile?.phone || "Unknown";

  const base = `${origin}/api/public/bpc-admin`;
  const approveUrl = `${base}?action=approve&id=${submissionId}&token=${submission.admin_token}`;
  const declineUrl = `${base}?action=decline&id=${submissionId}&token=${submission.admin_token}`;

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1e40af">🔔 New HD CODE Activation Request</h2>
      <p>A user has submitted proof of payment for HD CODE activation:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${userName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${userEmail}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${userPhone}</td></tr>
      </table>
      <p><strong>Proof of Payment:</strong></p>
      <p><a href="${submission.proof_url}" style="color:#1e40af">View Payment Proof</a></p>
      <div style="margin:24px 0">
        <a href="${approveUrl}" style="display:inline-block;padding:12px 32px;background:#16a34a;color:white;text-decoration:none;border-radius:8px;margin-right:12px;font-weight:bold">✅ Approve</a>
        <a href="${declineUrl}" style="display:inline-block;padding:12px 32px;background:#dc2626;color:white;text-decoration:none;border-radius:8px;font-weight:bold">❌ Decline</a>
      </div>
      <p style="color:#666;font-size:12px">This email was sent from the Hope Drop HD CODE System.</p>
    </div>
  `;

  const RESEND_API_KEY = process.env["RESEND_API_KEY"];

  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set. Email notification skipped.");
    return { success: true };
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Hope Drop <onboarding@resend.dev>",
      to: [ADMIN_EMAIL, CONTACT_CENTER_EMAIL],
      subject: `🔔 HD CODE Activation Request from ${userName}`,
      html: emailHtml,
    }),
  });

  if (!emailRes.ok) {
    console.error("Email send failed:", await emailRes.text());
    return { error: "Could not send the notification email." };
  }

  return { success: true };
}

const page = (body: string, status = 200) =>
  new Response(
    `<html><body style="font-family:sans-serif;text-align:center;padding:60px">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

export async function handleAdminDecision(
  action: string,
  submissionId: string,
  token: string,
): Promise<Response> {
  const { data: submission, error } = await supabaseAdmin
    .from("bpc_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("admin_token", token)
    .maybeSingle();

  if (error || !submission) {
    return page(
      `<h2>❌ Invalid or expired link</h2><p>This approval link is no longer valid.</p>`,
      400,
    );
  }

  if (submission.status !== "pending") {
    return page(
      `<h2>ℹ️ Already processed</h2><p>This submission has already been ${submission.status}.</p>`,
    );
  }

  const newStatus = action === "approve" ? "approved" : "declined";
  await supabaseAdmin
    .from("bpc_submissions")
    .update({ status: newStatus })
    .eq("id", submissionId);

  const emoji = newStatus === "approved" ? "✅" : "❌";
  return page(
    `<h2>${emoji} HD CODE Submission ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</h2>
     <p>The user's HD CODE has been ${newStatus}.</p>`,
  );
}

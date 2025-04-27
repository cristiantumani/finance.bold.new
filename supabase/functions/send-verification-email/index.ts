import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { email, verifyUrl } = await req.json();

    if (!email || !verifyUrl) {
      return new Response(
        JSON.stringify({ error: "Email and verification URL are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { data, error: emailError } = await resend.emails.send({
      from: "noreply@yourdomain.com",
      to: email,
      subject: "Verify your email address",
      html: `
        <h2>Welcome!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email Address</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    return new Response(
      JSON.stringify({ message: "Verification email sent successfully" }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in send-verification-email function:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to send verification email",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  invite_id?: string
  email?: string
  token?: string
  permission_level?: string
  expires_at?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get unprocessed notifications
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notification_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) throw fetchError

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to process' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Process each notification
    for (const notification of notifications) {
      try {
        const payload = notification.payload as NotificationPayload

        if (notification.type === 'collaboration_invite') {
          const verifyUrl = `${Deno.env.get('PUBLIC_SITE_URL')}/verify-invite?token=${payload.token}`
          
          // Send email using Resend
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Opsia Finance <notifications@opsia.app>',
              to: payload.email,
              subject: 'Invitation to Collaborate',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #4F46E5; margin-bottom: 24px;">You've Been Invited to Collaborate</h2>
                  
                  <p style="color: #374151; margin-bottom: 16px;">
                    You've been invited to collaborate with access level: 
                    <strong>${payload.permission_level === 'full_access' ? 'Full Access' : 'View Only'}</strong>
                  </p>
                  
                  <p style="color: #374151; margin-bottom: 24px;">
                    This invitation will expire on ${new Date(payload.expires_at || '').toLocaleString()}
                  </p>
                  
                  <a href="${verifyUrl}" 
                     style="display: inline-block; background-color: #4F46E5; color: white; 
                            padding: 12px 24px; text-decoration: none; border-radius: 6px;
                            margin-bottom: 24px;">
                    Accept Invitation
                  </a>
                  
                  <p style="color: #6B7280; font-size: 14px;">
                    If you don't want to accept this invitation, you can ignore this email.
                  </p>
                </div>
              `
            })
          })

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text()
            console.error('Resend API error:', errorText)
            throw new Error(`Failed to send email: ${errorText}`)
          }

          // Mark notification as processed
          const { error: updateError } = await supabaseClient
            .from('notification_queue')
            .update({
              processed: true,
              processed_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          if (updateError) throw updateError

          console.log(`Successfully processed notification ${notification.id}`)
        }
      } catch (error) {
        console.error('Error processing notification:', error)
        
        // Mark notification as failed
        await supabaseClient
          .from('notification_queue')
          .update({
            error: error.message,
            processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Notifications processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
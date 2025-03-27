import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  // Feedback notification payload
  feedback_id?: string
  user_id?: string
  user_email?: string
  type?: string
  satisfaction?: string
  message?: string
  url?: string
  user_agent?: string
  created_at?: string
  notification_email?: string

  // Collaboration invite payload
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
      .in('type', ['feedback_notification', 'collaboration_invite'])
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
      const payload = notification.payload as NotificationPayload

      try {
        let emailContent: { subject: string; html: string }

        // Generate email content based on notification type
        if (notification.type === 'feedback_notification') {
          emailContent = {
            subject: `New Feedback Received: ${payload.type?.charAt(0).toUpperCase()}${payload.type?.slice(1)}`,
            html: `
              <h2>New Feedback Received</h2>
              <p><strong>Type:</strong> ${payload.type?.charAt(0).toUpperCase()}${payload.type?.slice(1)}</p>
              <p><strong>Satisfaction:</strong> ${payload.satisfaction}</p>
              <p><strong>Message:</strong> ${payload.message}</p>
              <p><strong>URL:</strong> ${payload.url}</p>
              <p><strong>User Email:</strong> ${payload.user_email}</p>
              <p><strong>User Agent:</strong> ${payload.user_agent}</p>
              <p><strong>Submitted At:</strong> ${new Date(payload.created_at || '').toLocaleString()}</p>
            `
          }
        } else if (notification.type === 'collaboration_invite') {
          const verifyUrl = `${Deno.env.get('PUBLIC_SITE_URL')}/verify-invite?token=${payload.token}`
          emailContent = {
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
          }
        } else {
          throw new Error(`Unknown notification type: ${notification.type}`)
        }

        // Send email using Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Opsia Finance <notifications@opsia.app>',
            to: notification.type === 'feedback_notification' 
              ? payload.notification_email 
              : payload.email,
            subject: emailContent.subject,
            html: emailContent.html
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
      } catch (error) {
        console.error('Error processing notification:', error)
        
        // Mark notification as failed
        await supabaseClient
          .from('notification_queue')
          .update({
            error: error.message,
            processed: true, // Mark as processed to prevent infinite retries
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
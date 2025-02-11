import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  feedback_id: string
  user_id: string
  user_email: string
  type: string
  satisfaction: string
  message: string
  url: string
  user_agent: string
  created_at: string
  notification_email: string
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
      .eq('type', 'feedback_notification')
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
        // Send email using Resend
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Financial App <notifications@yourdomain.com>',
            to: payload.notification_email,
            subject: `New Feedback Received: ${payload.type.charAt(0).toUpperCase() + payload.type.slice(1)}`,
            html: `
              <h2>New Feedback Received</h2>
              <p><strong>Type:</strong> ${payload.type.charAt(0).toUpperCase() + payload.type.slice(1)}</p>
              <p><strong>Satisfaction:</strong> ${payload.satisfaction}</p>
              <p><strong>Message:</strong> ${payload.message}</p>
              <p><strong>URL:</strong> ${payload.url}</p>
              <p><strong>User Email:</strong> ${payload.user_email}</p>
              <p><strong>User Agent:</strong> ${payload.user_agent}</p>
              <p><strong>Submitted At:</strong> ${new Date(payload.created_at).toLocaleString()}</p>
            `,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send email: ${await response.text()}`)
        }

        // Mark notification as processed
        const { error: updateError } = await supabaseClient
          .from('notification_queue')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', notification.id)

        if (updateError) throw updateError
      } catch (error) {
        // Mark notification as failed
        await supabaseClient
          .from('notification_queue')
          .update({
            error: error.message,
          })
          .eq('id', notification.id)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Notifications processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
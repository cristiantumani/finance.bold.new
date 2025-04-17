import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Configuration, PlaidApi, PlaidEnvironments } from 'npm:plaid@18.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments.sandbox, // Change to development or production as needed
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': Deno.env.get('PLAID_CLIENT_ID') ?? '',
        'PLAID-SECRET': Deno.env.get('PLAID_SECRET') ?? '',
      },
    },
  })
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhook = await req.json()

    // Verify webhook
    if (webhook.webhook_type === 'TRANSACTIONS') {
      const { item_id } = webhook

      // Get the Plaid item from our database
      const { data: plaidItem, error: itemError } = await supabaseClient
        .from('plaid_items')
        .select('access_token, user_id')
        .eq('item_id', item_id)
        .single()

      if (itemError) throw itemError

      // Get new transactions from Plaid
      const response = await plaidClient.transactionsSync({
        access_token: plaidItem.access_token
      })

      const { added, modified, removed } = response.data

      // Process added transactions
      if (added.length > 0) {
        const transactionsToAdd = added.map(transaction => ({
          user_id: plaidItem.user_id,
          amount: Math.abs(transaction.amount),
          type: transaction.amount < 0 ? 'income' : 'expense',
          description: transaction.name,
          date: transaction.date,
          plaid_transaction_id: transaction.transaction_id
        }))

        const { error: insertError } = await supabaseClient
          .from('transactions')
          .upsert(transactionsToAdd, {
            onConflict: 'plaid_transaction_id',
            ignoreDuplicates: true
          })

        if (insertError) throw insertError
      }

      // Process modified transactions
      if (modified.length > 0) {
        for (const transaction of modified) {
          const { error: updateError } = await supabaseClient
            .from('transactions')
            .update({
              amount: Math.abs(transaction.amount),
              type: transaction.amount < 0 ? 'income' : 'expense',
              description: transaction.name,
              date: transaction.date
            })
            .eq('plaid_transaction_id', transaction.transaction_id)

          if (updateError) throw updateError
        }
      }

      // Process removed transactions
      if (removed.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from('transactions')
          .delete()
          .in('plaid_transaction_id', removed.map(t => t.transaction_id))

        if (deleteError) throw deleteError
      }
    }

    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
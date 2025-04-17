import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { supabase } from './supabase';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Change to 'development' or 'production' as needed
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': import.meta.env.VITE_PLAID_CLIENT_ID,
      'PLAID-SECRET': import.meta.env.VITE_PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Function to create a link token
export async function createLinkToken() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Opsia Finance',
      products: ['transactions'],
      country_codes: ['US', 'GB', 'ES', 'NL', 'FR', 'IE', 'CA'],
      language: 'en',
      webhook: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plaid-webhook`
    });

    return response.data;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

// Function to exchange public token for access token
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Store the access token securely in your database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('plaid_items')
      .insert([{
        user_id: user.id,
        item_id: itemId,
        access_token: accessToken,
        status: 'active'
      }]);

    if (error) throw error;

    return { itemId };
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

// Function to fetch transactions
export async function fetchPlaidTransactions(startDate: string, endDate: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get all active Plaid items for the user
    const { data: plaidItems, error: itemsError } = await supabase
      .from('plaid_items')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (itemsError) throw itemsError;

    const allTransactions = [];

    // Fetch transactions for each connected account
    for (const item of plaidItems || []) {
      const response = await plaidClient.transactionsGet({
        access_token: item.access_token,
        start_date: startDate,
        end_date: endDate,
        options: {
          include_personal_finance_category: true
        }
      });

      allTransactions.push(...response.data.transactions);
    }

    return allTransactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// Function to sync transactions to our database
export async function syncPlaidTransactions(transactions: any[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get or create categories based on Plaid categories
    const categories = new Map();
    for (const transaction of transactions) {
      const categoryName = transaction.personal_finance_category?.detailed;
      if (!categoryName) continue;

      if (!categories.has(categoryName)) {
        // Check if category exists
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', categoryName)
          .single();

        if (existingCategory) {
          categories.set(categoryName, existingCategory.id);
        } else {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              user_id: user.id,
              name: categoryName,
              expense_type: 'variable', // Default to variable, can be updated later
              income_category: transaction.amount < 0 // Negative amounts are typically income
            })
            .select('id')
            .single();

          if (categoryError) throw categoryError;
          categories.set(categoryName, newCategory.id);
        }
      }
    }

    // Insert transactions
    const transactionsToInsert = transactions.map(transaction => ({
      user_id: user.id,
      amount: Math.abs(transaction.amount),
      type: transaction.amount < 0 ? 'income' : 'expense',
      category_id: categories.get(transaction.personal_finance_category?.detailed),
      description: transaction.name,
      date: transaction.date,
      plaid_transaction_id: transaction.transaction_id
    }));

    const { error: transactionError } = await supabase
      .from('transactions')
      .upsert(transactionsToInsert, {
        onConflict: 'plaid_transaction_id',
        ignoreDuplicates: true
      });

    if (transactionError) throw transactionError;

    return true;
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw error;
  }
}
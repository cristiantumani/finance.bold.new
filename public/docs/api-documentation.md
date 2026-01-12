# API Documentation

## Overview

Our Financial Management Application provides a secure API for managing financial data. The application uses Supabase as the backend with Plaid integration for bank account connectivity.

## Authentication

### Supabase Authentication
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);
```

## Core Endpoints

### Transactions

#### Get Transactions
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select(`
    *,
    categories (
      name
    )
  `)
  .eq('user_id', user.id)
  .order('date', { ascending: false });
```

#### Add Transaction
```typescript
const { error } = await supabase
  .from('transactions')
  .insert([{
    user_id: user.id,
    amount: number,
    type: 'income' | 'expense',
    category_id: string,
    description: string,
    date: string,
    plaid_transaction_id?: string  // Optional: Set when synced from Plaid
  }]);
```

#### Transaction Schema
```typescript
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  description: string;
  date: string;
  created_at: string;
  plaid_transaction_id?: string;  // Present for Plaid-synced transactions
}
```

### Categories

#### Get Categories
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', user.id)
  .order('name');
```

#### Create Category
```typescript
const { error } = await supabase
  .from('categories')
  .insert([{
    user_id: user.id,
    name: string,
    expense_type: 'fixed' | 'variable' | 'controllable_fixed',
    income_category: boolean
  }]);
```

### Budgets

#### Get Budgets
```typescript
const { data, error } = await supabase
  .from('budgets')
  .select(`
    *,
    categories (
      name
    )
  `)
  .eq('user_id', user.id);
```

#### Create Budget
```typescript
const { error } = await supabase
  .from('budgets')
  .insert([{
    user_id: user.id,
    category_id: string,
    budget_limit: number,
    period: 'monthly' | 'weekly' | 'yearly',
    month?: string  // Optional: For monthly period tracking (format: 'YYYY-MM')
  }]);
```

#### Budget Schema
```typescript
interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  budget_limit: number;
  spent: number;           // Tracked spending against budget
  period: 'monthly' | 'weekly' | 'yearly';
  month: string | null;    // For monthly budget tracking
  created_at: string;
}
```

## Plaid Integration

The application integrates with Plaid for bank account connectivity and automatic transaction syncing.

### Create Link Token
Initiates the Plaid Link flow for connecting bank accounts.
```typescript
import { createLinkToken } from './lib/plaid';

const linkToken = await createLinkToken();
// Use linkToken.link_token with Plaid Link component
```

### Exchange Public Token
Exchanges the Plaid public token for an access token after successful bank connection.
```typescript
import { exchangePublicToken } from './lib/plaid';

const { itemId } = await exchangePublicToken(publicToken);
```

### Fetch Plaid Transactions
Retrieves transactions from connected bank accounts.
```typescript
import { fetchPlaidTransactions } from './lib/plaid';

const transactions = await fetchPlaidTransactions('2024-01-01', '2024-12-31');
```

### Sync Plaid Transactions
Syncs Plaid transactions to the application database with automatic category creation.
```typescript
import { syncPlaidTransactions } from './lib/plaid';

await syncPlaidTransactions(transactions);
```

### Plaid Items Table
```typescript
interface PlaidItem {
  id: string;
  user_id: string;
  item_id: string;
  access_token: string;
  status: 'active' | 'inactive';
  created_at: string;
}
```

## Edge Functions

### Plaid Webhook
Receives webhook notifications from Plaid about transaction changes.

**Endpoint:** `POST /functions/v1/plaid-webhook`

Handles:
- `TRANSACTIONS` webhook type
- Syncs added, modified, and removed transactions
- Automatic category assignment based on Plaid categories

### Process Notifications
Processes pending email notifications from the queue.

**Endpoint:** `POST /functions/v1/process-notifications`

Operations:
- Fetches unprocessed notifications from `notification_queue` table
- Sends collaboration invite emails via Resend API
- Updates notification status to processed

### Send Verification Email
Sends email verification for new user signups.

**Endpoint:** `POST /functions/v1/send-verification-email`

**Request Body:**
```typescript
{
  email: string;
  verifyUrl: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message?: string;
}
```

## Analytics

### Event Types
```typescript
type EventName =
  | 'sign_up'
  | 'sign_in'
  | 'profile_created'
  | 'transaction_created'
  | 'transaction_updated'
  | 'transaction_deleted'
  | 'budget_created'
  | 'budget_updated'
  | 'category_created'
  | 'category_updated'
  | 'import_started'
  | 'import_completed'
  | 'page_view';
```

### Track Events
```typescript
import { trackEvent } from './lib/analytics';

await trackEvent('transaction_created', {
  amount: 100,
  category: 'Groceries'
});
```

### Analytics Event Schema
```typescript
interface AnalyticsEvent {
  event_name: string;
  properties: object;
  session_id: string;
  user_id: string;
  url: string;           // Current page path
  referrer: string;      // Referring URL
  user_agent: string;    // Browser user agent
}
```

**Note:** Analytics tracking is automatically skipped in demo mode.

## Data Management

### Export User Data
```typescript
const { data, error } = await Promise.all([
  supabase.from('user_profiles').select('*').eq('user_id', user.id),
  supabase.from('transactions').select('*').eq('user_id', user.id),
  supabase.from('categories').select('*').eq('user_id', user.id),
  supabase.from('budgets').select('*').eq('user_id', user.id)
]);
```

### Privacy Management

#### Get User Consents
```typescript
const { data, error } = await supabase
  .from('user_consents')
  .select('*')
  .eq('user_id', user.id);
```

#### Update Consent
```typescript
const { error } = await supabase
  .from('user_consents')
  .upsert({
    user_id: user.id,
    consent_type: string,
    consented: boolean
  });
```

## Error Handling

All endpoints return an error object when unsuccessful:
```typescript
interface PostgrestError {
  message: string;
  details: string;
  hint: string;
  code: string;
}
```

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user
- 10000 requests per day per user

## Security

- All requests must be authenticated
- Data is encrypted in transit
- Row Level Security enforced
- Regular security audits

## Environment Variables

Required environment variables for the application:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PLAID_CLIENT_ID=your_plaid_client_id
VITE_PLAID_SECRET=your_plaid_secret
```

# API Documentation

## Overview

Our Financial Management Application provides a secure API for managing financial data.

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
    date: string
  }]);
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
    period: 'monthly' | 'weekly' | 'yearly'
  }]);
```

## Analytics

### Track Events
```typescript
const { error } = await supabase
  .from('analytics_events')
  .insert([{
    event_name: string,
    properties: object,
    session_id: string,
    user_id: string
  }]);
```

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
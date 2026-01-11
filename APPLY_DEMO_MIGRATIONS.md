# How to Apply Demo User Migrations

The demo account isn't showing transactions because the database migrations haven't been applied yet.

## Method 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20260108000002_create_demo_user.sql`
6. Paste and click **Run**
7. Create another new query
8. Copy the entire contents of `supabase/migrations/20260108000003_demo_user_rls.sql`
9. Paste and click **Run**

## Method 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## What This Does

The migrations will:
- Create a demo user profile for user ID `00000000-0000-0000-0000-000000000001`
- Create realistic expense categories (Rent, Groceries, Entertainment, etc.)
- Create budgets for each category
- Generate 12 months of realistic transaction data (~50-80 transactions per month)
- Set up RLS policies so the demo user data is publicly readable

## After Running

Refresh your app and navigate to the demo account. You should now see:
- Dashboard with spending charts
- Transactions list with various expense types
- Budget tracking with realistic data
- Categories organized by type (Fixed, Variable, Controllable Fixed, Income)

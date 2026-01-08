/*
  # Create Demo User and Seed Data

  1. Changes
    - Create demo user profile
    - Seed categories (fixed, variable, controllable_fixed, income)
    - Seed budgets with realistic limits
    - Generate 12 months of realistic transaction data

  2. Security
    - Demo user ID is a known UUID for easy identification
    - Demo data is isolated through RLS policies
    - Read-only in application layer (not database)

  Note: The demo user must be created manually in Supabase dashboard
  with email: demo@financeapp.com and ID: 00000000-0000-0000-0000-000000000001
*/

DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';

  -- Category IDs
  rent_id UUID;
  loan_id UUID;
  insurance_id UUID;
  groceries_id UUID;
  entertainment_id UUID;
  dining_id UUID;
  shopping_id UUID;
  healthcare_id UUID;
  travel_id UUID;
  utilities_id UUID;
  phone_id UUID;
  transport_id UUID;
  gym_id UUID;
  subscriptions_id UUID;
  salary_id UUID;
  freelance_id UUID;
  investment_id UUID;

  month_offset INT;
  target_year INT;
  target_month INT;
  month_str TEXT;
  start_date DATE;
  end_date DATE;
  days_in_month INT;
  i INT;
BEGIN
  -- Create user profile for demo user
  INSERT INTO user_profiles (user_id, first_name, last_name, location, app_goal)
  VALUES (
    demo_user_id,
    'Demo',
    'User',
    'San Francisco, CA',
    'Track personal expenses, manage budgets, and achieve my savings goals'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    location = EXCLUDED.location,
    app_goal = EXCLUDED.app_goal;

  -- Create categories (Fixed Expenses)
  INSERT INTO categories (user_id, name, expense_type, income_category)
  VALUES
    (demo_user_id, 'Rent/Mortgage', 'fixed', false),
    (demo_user_id, 'Loan Payments', 'fixed', false),
    (demo_user_id, 'Insurance', 'fixed', false)
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO rent_id;

  SELECT id INTO rent_id FROM categories WHERE user_id = demo_user_id AND name = 'Rent/Mortgage';
  SELECT id INTO loan_id FROM categories WHERE user_id = demo_user_id AND name = 'Loan Payments';
  SELECT id INTO insurance_id FROM categories WHERE user_id = demo_user_id AND name = 'Insurance';

  -- Create categories (Variable Expenses)
  INSERT INTO categories (user_id, name, expense_type, income_category)
  VALUES
    (demo_user_id, 'Groceries', 'variable', false),
    (demo_user_id, 'Entertainment', 'variable', false),
    (demo_user_id, 'Dining Out', 'variable', false),
    (demo_user_id, 'Shopping', 'variable', false),
    (demo_user_id, 'Healthcare', 'variable', false),
    (demo_user_id, 'Travel', 'variable', false)
  ON CONFLICT (user_id, name) DO NOTHING;

  SELECT id INTO groceries_id FROM categories WHERE user_id = demo_user_id AND name = 'Groceries';
  SELECT id INTO entertainment_id FROM categories WHERE user_id = demo_user_id AND name = 'Entertainment';
  SELECT id INTO dining_id FROM categories WHERE user_id = demo_user_id AND name = 'Dining Out';
  SELECT id INTO shopping_id FROM categories WHERE user_id = demo_user_id AND name = 'Shopping';
  SELECT id INTO healthcare_id FROM categories WHERE user_id = demo_user_id AND name = 'Healthcare';
  SELECT id INTO travel_id FROM categories WHERE user_id = demo_user_id AND name = 'Travel';

  -- Create categories (Controllable Fixed)
  INSERT INTO categories (user_id, name, expense_type, income_category)
  VALUES
    (demo_user_id, 'Utilities', 'controllable_fixed', false),
    (demo_user_id, 'Phone Plan', 'controllable_fixed', false),
    (demo_user_id, 'Transportation', 'controllable_fixed', false),
    (demo_user_id, 'Gym Membership', 'controllable_fixed', false),
    (demo_user_id, 'Subscriptions', 'controllable_fixed', false)
  ON CONFLICT (user_id, name) DO NOTHING;

  SELECT id INTO utilities_id FROM categories WHERE user_id = demo_user_id AND name = 'Utilities';
  SELECT id INTO phone_id FROM categories WHERE user_id = demo_user_id AND name = 'Phone Plan';
  SELECT id INTO transport_id FROM categories WHERE user_id = demo_user_id AND name = 'Transportation';
  SELECT id INTO gym_id FROM categories WHERE user_id = demo_user_id AND name = 'Gym Membership';
  SELECT id INTO subscriptions_id FROM categories WHERE user_id = demo_user_id AND name = 'Subscriptions';

  -- Create categories (Income)
  INSERT INTO categories (user_id, name, expense_type, income_category)
  VALUES
    (demo_user_id, 'Salary', 'variable', true),
    (demo_user_id, 'Freelance', 'variable', true),
    (demo_user_id, 'Investment Income', 'variable', true)
  ON CONFLICT (user_id, name) DO NOTHING;

  SELECT id INTO salary_id FROM categories WHERE user_id = demo_user_id AND name = 'Salary';
  SELECT id INTO freelance_id FROM categories WHERE user_id = demo_user_id AND name = 'Freelance';
  SELECT id INTO investment_id FROM categories WHERE user_id = demo_user_id AND name = 'Investment Income';

  -- Create budgets for expense categories
  INSERT INTO budgets (user_id, category_id, budget_limit, spent, period, month)
  VALUES
    (demo_user_id, rent_id, 2500, 0, 'monthly', NULL),
    (demo_user_id, loan_id, 500, 0, 'monthly', NULL),
    (demo_user_id, insurance_id, 300, 0, 'monthly', NULL),
    (demo_user_id, groceries_id, 600, 0, 'monthly', NULL),
    (demo_user_id, entertainment_id, 300, 0, 'monthly', NULL),
    (demo_user_id, dining_id, 400, 0, 'monthly', NULL),
    (demo_user_id, shopping_id, 250, 0, 'monthly', NULL),
    (demo_user_id, healthcare_id, 200, 0, 'monthly', NULL),
    (demo_user_id, travel_id, 500, 0, 'monthly', NULL),
    (demo_user_id, utilities_id, 150, 0, 'monthly', NULL),
    (demo_user_id, phone_id, 80, 0, 'monthly', NULL),
    (demo_user_id, transport_id, 200, 0, 'monthly', NULL),
    (demo_user_id, gym_id, 60, 0, 'monthly', NULL),
    (demo_user_id, subscriptions_id, 50, 0, 'monthly', NULL)
  ON CONFLICT (user_id, category_id, period, COALESCE(month, '')) DO NOTHING;

  -- Generate transactions for the last 12 months
  FOR month_offset IN 0..11 LOOP
    target_year := EXTRACT(YEAR FROM CURRENT_DATE - (month_offset || ' months')::INTERVAL);
    target_month := EXTRACT(MONTH FROM CURRENT_DATE - (month_offset || ' months')::INTERVAL);
    month_str := LPAD(target_month::TEXT, 2, '0');
    start_date := (target_year || '-' || month_str || '-01')::DATE;
    end_date := (start_date + INTERVAL '1 month - 1 day')::DATE;
    days_in_month := EXTRACT(DAY FROM end_date);

    -- Monthly salary (1st of month)
    INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
    VALUES (
      demo_user_id,
      6500.00,
      'income',
      salary_id,
      'Monthly Salary Deposit',
      start_date,
      NULL
    )
    ON CONFLICT DO NOTHING;

    -- Random freelance income (50% chance each month)
    IF random() > 0.5 THEN
      INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
      VALUES (
        demo_user_id,
        (500 + random() * 1500)::NUMERIC(10,2),
        'income',
        freelance_id,
        CASE (random() * 4)::INT
          WHEN 0 THEN 'Web Development Project'
          WHEN 1 THEN 'Consulting Work'
          WHEN 2 THEN 'Design Project'
          ELSE 'Freelance Gig'
        END,
        start_date + (random() * 15)::INT,
        NULL
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Monthly rent (1st-3rd of month)
    INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
    VALUES (
      demo_user_id,
      2500.00,
      'expense',
      rent_id,
      'Monthly Rent Payment',
      start_date + (random() * 2)::INT,
      'fixed'
    )
    ON CONFLICT DO NOTHING;

    -- Loan payment (15th of month)
    INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
    VALUES (
      demo_user_id,
      500.00,
      'expense',
      loan_id,
      'Auto Loan Payment',
      start_date + 14,
      'fixed'
    )
    ON CONFLICT DO NOTHING;

    -- Insurance (1st of month)
    INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
    VALUES (
      demo_user_id,
      300.00,
      'expense',
      insurance_id,
      'Health Insurance Premium',
      start_date,
      'fixed'
    )
    ON CONFLICT DO NOTHING;

    -- Utilities (random day)
    INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
    VALUES (
      demo_user_id,
      (100 + random() * 100)::NUMERIC(10,2),
      'expense',
      utilities_id,
      'Electric & Water Bill',
      start_date + (random() * days_in_month)::INT,
      'controllable_fixed'
    )
    ON CONFLICT DO NOTHING;

    -- Phone (5th of month)
    INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
    VALUES (
      demo_user_id,
      80.00,
      'expense',
      phone_id,
      'Phone Bill',
      start_date + 4,
      'controllable_fixed'
    )
    ON CONFLICT DO NOTHING;

    -- Gym (1st of month)
    INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
    VALUES (
      demo_user_id,
      60.00,
      'expense',
      gym_id,
      'Gym Membership',
      start_date,
      'controllable_fixed'
    )
    ON CONFLICT DO NOTHING;

    -- Subscriptions (various days)
    FOR i IN 1..3 LOOP
      INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
      VALUES (
        demo_user_id,
        (9.99 + random() * 20)::NUMERIC(10,2),
        'expense',
        subscriptions_id,
        CASE (random() * 5)::INT
          WHEN 0 THEN 'Netflix'
          WHEN 1 THEN 'Spotify Premium'
          WHEN 2 THEN 'Cloud Storage'
          WHEN 3 THEN 'News Subscription'
          ELSE 'Software Subscription'
        END,
        start_date + (random() * days_in_month)::INT,
        'controllable_fixed'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Groceries (weekly, ~4-5 times per month)
    FOR i IN 1..5 LOOP
      INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
      VALUES (
        demo_user_id,
        (50 + random() * 150)::NUMERIC(10,2),
        'expense',
        groceries_id,
        CASE (random() * 4)::INT
          WHEN 0 THEN 'Whole Foods'
          WHEN 1 THEN 'Trader Joes'
          WHEN 2 THEN 'Safeway'
          ELSE 'Farmers Market'
        END,
        start_date + ((i - 1) * 6 + (random() * 4)::INT),
        'variable'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Dining out (~8-10 times per month)
    FOR i IN 1..10 LOOP
      IF random() > 0.2 THEN
        INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
        VALUES (
          demo_user_id,
          (15 + random() * 85)::NUMERIC(10,2),
          'expense',
          dining_id,
          CASE (random() * 4)::INT
            WHEN 0 THEN 'Restaurant Dinner'
            WHEN 1 THEN 'Lunch with Friends'
            WHEN 2 THEN 'Coffee Shop'
            ELSE 'Food Delivery'
          END,
          start_date + (random() * days_in_month)::INT,
          'variable'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Entertainment (~3-5 times per month)
    FOR i IN 1..5 LOOP
      IF random() > 0.3 THEN
        INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
        VALUES (
          demo_user_id,
          (20 + random() * 80)::NUMERIC(10,2),
          'expense',
          entertainment_id,
          CASE (random() * 5)::INT
            WHEN 0 THEN 'Movie Tickets'
            WHEN 1 THEN 'Concert'
            WHEN 2 THEN 'Museum Visit'
            WHEN 3 THEN 'Sports Event'
            ELSE 'Entertainment Event'
          END,
          start_date + (random() * days_in_month)::INT,
          'variable'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Transportation (~6-8 times per month)
    FOR i IN 1..8 LOOP
      IF random() > 0.2 THEN
        INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
        VALUES (
          demo_user_id,
          (15 + random() * 55)::NUMERIC(10,2),
          'expense',
          transport_id,
          CASE (random() * 4)::INT
            WHEN 0 THEN 'Gas Station'
            WHEN 1 THEN 'Uber Ride'
            WHEN 2 THEN 'Parking Fee'
            ELSE 'Public Transit'
          END,
          start_date + (random() * days_in_month)::INT,
          'controllable_fixed'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Shopping (~2-4 times per month)
    FOR i IN 1..4 LOOP
      IF random() > 0.4 THEN
        INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
        VALUES (
          demo_user_id,
          (30 + random() * 170)::NUMERIC(10,2),
          'expense',
          shopping_id,
          CASE (random() * 4)::INT
            WHEN 0 THEN 'Clothing Store'
            WHEN 1 THEN 'Online Shopping'
            WHEN 2 THEN 'Electronics Store'
            ELSE 'Home Goods'
          END,
          start_date + (random() * days_in_month)::INT,
          'variable'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Healthcare (1-2 times per month, not every month)
    IF random() > 0.5 THEN
      INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
      VALUES (
        demo_user_id,
        (50 + random() * 150)::NUMERIC(10,2),
        'expense',
        healthcare_id,
        CASE (random() * 3)::INT
          WHEN 0 THEN 'Pharmacy'
          WHEN 1 THEN 'Doctor Visit'
          ELSE 'Medical Supplies'
        END,
        start_date + (random() * days_in_month)::INT,
        'variable'
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Travel (occasional, maybe 2-3 times in 12 months)
    IF random() > 0.75 THEN
      FOR i IN 1..2 LOOP
        INSERT INTO transactions (user_id, amount, type, category_id, description, date, expense_type)
        VALUES (
          demo_user_id,
          (200 + random() * 800)::NUMERIC(10,2),
          'expense',
          travel_id,
          CASE (random() * 4)::INT
            WHEN 0 THEN 'Flight Ticket'
            WHEN 1 THEN 'Hotel Booking'
            WHEN 2 THEN 'Vacation Rental'
            ELSE 'Travel Expense'
          END,
          start_date + (random() * days_in_month)::INT,
          'variable'
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

  END LOOP;

  RAISE NOTICE 'Demo user data created successfully';
END $$;

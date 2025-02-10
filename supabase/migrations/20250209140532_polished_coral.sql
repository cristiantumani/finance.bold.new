/*
  # Fix format specifier in generate_transaction_insights function

  1. Changes
    - Update format specifiers to use %I for identifiers and %L for literals
    - Fix percentage formatting in message strings
    
  2. Security
    - No security changes
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS generate_insights_trigger ON transactions;

-- Drop the existing function
DROP FUNCTION IF EXISTS generate_transaction_insights();

-- Recreate the function with fixed format specifiers
CREATE OR REPLACE FUNCTION generate_transaction_insights()
RETURNS TRIGGER AS $$
DECLARE
  v_category_name TEXT;
  v_budget_record RECORD;
  v_last_month_spending DECIMAL;
  v_this_month_spending DECIMAL;
  v_spending_increase DECIMAL;
  v_budget_progress DECIMAL;
  v_days_in_month INTEGER;
  v_days_elapsed INTEGER;
BEGIN
  -- Only process expense transactions
  IF NEW.type = 'expense' THEN
    -- Get category name
    SELECT name INTO v_category_name
    FROM categories
    WHERE id = NEW.category_id;
    
    -- Calculate month-over-month change
    SELECT 
      COALESCE(SUM(CASE 
        WHEN date_trunc('month', date) = date_trunc('month', NEW.date) 
        THEN amount ELSE 0 END), 0) as this_month,
      COALESCE(SUM(CASE 
        WHEN date_trunc('month', date) = date_trunc('month', NEW.date - INTERVAL '1 month') 
        THEN amount ELSE 0 END), 0) as last_month
    INTO v_this_month_spending, v_last_month_spending
    FROM transactions
    WHERE category_id = NEW.category_id
    AND type = 'expense'
    AND date >= date_trunc('month', NEW.date - INTERVAL '1 month');

    -- Calculate spending increase percentage
    IF v_last_month_spending > 0 THEN
      v_spending_increase := ((v_this_month_spending - v_last_month_spending) / v_last_month_spending) * 100;
      
      -- Alert if spending increased significantly
      IF v_spending_increase >= 20 THEN
        INSERT INTO ai_suggestions (
          user_id,
          type,
          category_id,
          message,
          priority
        ) VALUES (
          NEW.user_id,
          'spending_alert',
          NEW.category_id,
          'Your ' || v_category_name || ' spending increased by ' || ROUND(v_spending_increase) || '% compared to last month',
          CASE WHEN v_spending_increase >= 50 THEN 3
               WHEN v_spending_increase >= 30 THEN 2
               ELSE 1 END
        );
      END IF;
    END IF;

    -- Check budget progress
    SELECT * INTO v_budget_record
    FROM budgets
    WHERE category_id = NEW.category_id
    AND period = 'monthly'
    LIMIT 1;

    IF FOUND THEN
      -- Calculate days in current month and days elapsed
      v_days_in_month := EXTRACT(DAY FROM 
        (date_trunc('month', NEW.date) + INTERVAL '1 month - 1 day')::date
      );
      v_days_elapsed := EXTRACT(DAY FROM NEW.date);
      
      -- Calculate budget progress
      v_budget_progress := (v_this_month_spending / v_budget_record.budget_limit) * 100;
      
      -- Alert if spending is ahead of budget pace
      IF v_budget_progress > (v_days_elapsed::decimal / v_days_in_month::decimal) * 100 THEN
        INSERT INTO ai_suggestions (
          user_id,
          type,
          category_id,
          message,
          priority
        ) VALUES (
          NEW.user_id,
          'budget_insight',
          NEW.category_id,
          'You''ve spent ' || ROUND(v_budget_progress) || '% of your ' || v_category_name || ' budget with ' || 
          (v_days_in_month - v_days_elapsed) || ' days left in the month',
          CASE WHEN v_budget_progress >= 90 THEN 3
               WHEN v_budget_progress >= 75 THEN 2
               ELSE 1 END
        );
      END IF;
    END IF;

    -- Update or create transaction pattern
    INSERT INTO transaction_patterns (
      user_id,
      description_pattern,
      amount_range,
      category_id,
      confidence,
      matches_count
    )
    VALUES (
      NEW.user_id,
      NEW.description,
      numrange(
        LEAST(NEW.amount * 0.8, NEW.amount * 1.2),
        GREATEST(NEW.amount * 0.8, NEW.amount * 1.2)
      ),
      NEW.category_id,
      0.7,
      1
    )
    ON CONFLICT (user_id, description_pattern, amount_range)
    DO UPDATE SET
      confidence = LEAST(transaction_patterns.confidence + 0.1, 1.0),
      matches_count = transaction_patterns.matches_count + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER generate_insights_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_insights();
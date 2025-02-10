-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_budget_spent_trigger ON transactions;
DROP TRIGGER IF EXISTS generate_insights_trigger ON transactions;

-- Drop the existing functions
DROP FUNCTION IF EXISTS update_budget_spent();
DROP FUNCTION IF EXISTS generate_transaction_insights();

-- Create function to update budget spent amounts
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  period_start DATE;
  period_end DATE;
BEGIN
  -- For INSERT or UPDATE
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
    -- Only process expense transactions
    IF NEW.type = 'expense' THEN
      -- For each budget with this category
      FOR budget_record IN 
        SELECT * FROM budgets WHERE category_id = NEW.category_id
      LOOP
        -- Calculate period dates based on budget period
        CASE budget_record.period
          WHEN 'monthly' THEN
            period_start := date_trunc('month', NEW.date)::date;
            period_end := (date_trunc('month', NEW.date) + INTERVAL '1 month')::date;
          WHEN 'weekly' THEN
            period_start := date_trunc('week', NEW.date)::date;
            period_end := (date_trunc('week', NEW.date) + INTERVAL '1 week')::date;
          WHEN 'yearly' THEN
            period_start := date_trunc('year', NEW.date)::date;
            period_end := (date_trunc('year', NEW.date) + INTERVAL '1 year')::date;
        END CASE;

        -- Calculate total spent for this period
        UPDATE budgets
        SET spent = (
          SELECT COALESCE(SUM(amount), 0)
          FROM transactions
          WHERE type = 'expense'
          AND category_id = NEW.category_id
          AND date >= period_start
          AND date < period_end
        )
        WHERE id = budget_record.id;
      END LOOP;
    END IF;
  END IF;

  -- For DELETE
  IF (TG_OP = 'DELETE') THEN
    -- Only process expense transactions
    IF OLD.type = 'expense' THEN
      -- For each budget with this category
      FOR budget_record IN 
        SELECT * FROM budgets WHERE category_id = OLD.category_id
      LOOP
        -- Calculate period dates based on budget period
        CASE budget_record.period
          WHEN 'monthly' THEN
            period_start := date_trunc('month', OLD.date)::date;
            period_end := (date_trunc('month', OLD.date) + INTERVAL '1 month')::date;
          WHEN 'weekly' THEN
            period_start := date_trunc('week', OLD.date)::date;
            period_end := (date_trunc('week', OLD.date) + INTERVAL '1 week')::date;
          WHEN 'yearly' THEN
            period_start := date_trunc('year', OLD.date)::date;
            period_end := (date_trunc('year', OLD.date) + INTERVAL '1 year')::date;
        END CASE;

        -- Calculate total spent for this period
        UPDATE budgets
        SET spent = (
          SELECT COALESCE(SUM(amount), 0)
          FROM transactions
          WHERE type = 'expense'
          AND category_id = OLD.category_id
          AND date >= period_start
          AND date < period_end
        )
        WHERE id = budget_record.id;
      END LOOP;
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for budget spent updates
CREATE TRIGGER update_budget_spent_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_spent();

-- Recreate insights function
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate insights trigger
CREATE TRIGGER generate_insights_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_insights();

-- Update all existing budget spent amounts
DO $$
DECLARE
  budget_record RECORD;
  period_start DATE;
  period_end DATE;
BEGIN
  FOR budget_record IN SELECT * FROM budgets LOOP
    -- Calculate period dates based on budget period
    CASE budget_record.period
      WHEN 'monthly' THEN
        period_start := date_trunc('month', CURRENT_DATE)::date;
        period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date;
      WHEN 'weekly' THEN
        period_start := date_trunc('week', CURRENT_DATE)::date;
        period_end := (date_trunc('week', CURRENT_DATE) + INTERVAL '1 week')::date;
      WHEN 'yearly' THEN
        period_start := date_trunc('year', CURRENT_DATE)::date;
        period_end := (date_trunc('year', CURRENT_DATE) + INTERVAL '1 year')::date;
    END CASE;

    -- Update the budget's spent amount
    UPDATE budgets
    SET spent = (
      SELECT COALESCE(SUM(amount), 0)
      FROM transactions
      WHERE type = 'expense'
      AND category_id = budget_record.category_id
      AND date >= period_start
      AND date < period_end
    )
    WHERE id = budget_record.id;
  END LOOP;
END $$;
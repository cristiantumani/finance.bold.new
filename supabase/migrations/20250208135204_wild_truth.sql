/*
  # Add budget tracking trigger

  This migration adds a trigger to automatically update budget spent amounts
  when transactions are modified.

  1. Changes:
    - Add function to calculate budget spent amount
    - Add triggers for transaction changes
    - Update existing budget spent amounts

  2. Security:
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Function to update budget spent amount
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  total_spent DECIMAL;
  period_start DATE;
BEGIN
  -- For INSERT or UPDATE
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
    -- Only process expense transactions
    IF NEW.type = 'expense' THEN
      -- For each budget with this category
      FOR budget_record IN 
        SELECT * FROM budgets WHERE category_id = NEW.category_id
      LOOP
        -- Calculate period start date
        period_start := date_trunc(
          CASE 
            WHEN budget_record.period = 'monthly' THEN 'month'
            WHEN budget_record.period = 'weekly' THEN 'week'
            WHEN budget_record.period = 'yearly' THEN 'year'
          END,
          CURRENT_DATE
        );

        -- Calculate total spent for this period
        SELECT COALESCE(SUM(amount), 0) INTO total_spent
        FROM transactions
        WHERE type = 'expense'
        AND category_id = NEW.category_id
        AND date >= period_start;

        -- Update the budget's spent amount
        UPDATE budgets
        SET spent = total_spent
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
        -- Calculate period start date
        period_start := date_trunc(
          CASE 
            WHEN budget_record.period = 'monthly' THEN 'month'
            WHEN budget_record.period = 'weekly' THEN 'week'
            WHEN budget_record.period = 'yearly' THEN 'year'
          END,
          CURRENT_DATE
        );

        -- Calculate total spent for this period
        SELECT COALESCE(SUM(amount), 0) INTO total_spent
        FROM transactions
        WHERE type = 'expense'
        AND category_id = OLD.category_id
        AND date >= period_start;

        -- Update the budget's spent amount
        UPDATE budgets
        SET spent = total_spent
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

-- Create triggers for transaction changes
DROP TRIGGER IF EXISTS update_budget_spent_trigger ON transactions;
CREATE TRIGGER update_budget_spent_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_spent();

-- Update all existing budget spent amounts
DO $$
DECLARE
  budget_record RECORD;
  total_spent DECIMAL;
  period_start DATE;
BEGIN
  FOR budget_record IN SELECT * FROM budgets LOOP
    -- Calculate period start date
    period_start := date_trunc(
      CASE 
        WHEN budget_record.period = 'monthly' THEN 'month'
        WHEN budget_record.period = 'weekly' THEN 'week'
        WHEN budget_record.period = 'yearly' THEN 'year'
      END,
      CURRENT_DATE
    );

    -- Calculate total spent for this period
    SELECT COALESCE(SUM(amount), 0) INTO total_spent
    FROM transactions
    WHERE type = 'expense'
    AND category_id = budget_record.category_id
    AND date >= period_start;

    -- Update the budget's spent amount
    UPDATE budgets
    SET spent = total_spent
    WHERE id = budget_record.id;
  END LOOP;
END $$;
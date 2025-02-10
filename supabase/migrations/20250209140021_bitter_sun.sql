/*
  # Add AI Categorization Support

  1. New Tables
    - `transaction_patterns`
      - Stores learned patterns from user transactions
    - `ai_suggestions`
      - Stores AI-generated insights and suggestions
    
  2. Functions
    - `generate_transaction_insights()`
      - Analyzes spending patterns and generates insights
    - `suggest_transaction_category()`
      - Suggests categories based on transaction description and amount
*/

-- Create transaction patterns table
CREATE TABLE IF NOT EXISTS transaction_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  description_pattern TEXT NOT NULL,
  amount_range numrange,
  category_id UUID REFERENCES categories(id),
  confidence DECIMAL(5,4) NOT NULL DEFAULT 0,
  matches_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, description_pattern, amount_range)
);

-- Create AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('spending_alert', 'budget_insight', 'pattern_detected')),
  category_id UUID REFERENCES categories(id),
  message TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transaction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own patterns"
  ON transaction_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to suggest category based on description and amount
CREATE OR REPLACE FUNCTION suggest_transaction_category(
  p_user_id UUID,
  p_description TEXT,
  p_amount DECIMAL,
  p_type TEXT
)
RETURNS TABLE (
  category_id UUID,
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH pattern_matches AS (
    SELECT 
      tp.category_id,
      tp.confidence * (
        -- Boost confidence based on amount_range match
        CASE WHEN p_amount <@ tp.amount_range THEN 1.2 ELSE 0.8 END
      ) as match_confidence
    FROM transaction_patterns tp
    WHERE tp.user_id = p_user_id
    AND p_description ILIKE '%' || tp.description_pattern || '%'
    -- Only match with categories of the correct type (income/expense)
    AND EXISTS (
      SELECT 1 FROM categories c 
      WHERE c.id = tp.category_id 
      AND c.income_category = (p_type = 'income')
    )
  )
  SELECT 
    pm.category_id,
    MAX(pm.match_confidence) as confidence
  FROM pattern_matches pm
  GROUP BY pm.category_id
  ORDER BY confidence DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to generate insights based on spending patterns
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
          format('Your %s spending increased by %.0f%% compared to last month', v_category_name, v_spending_increase),
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
          format(
            'You''ve spent %.0f%% of your %s budget with %s days left in the month',
            v_budget_progress,
            v_category_name,
            v_days_in_month - v_days_elapsed
          ),
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

-- Create trigger for insights generation
CREATE TRIGGER generate_insights_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_insights();

-- Create indexes
CREATE INDEX idx_transaction_patterns_user_description 
  ON transaction_patterns(user_id, description_pattern);
CREATE INDEX idx_ai_suggestions_user_unread 
  ON ai_suggestions(user_id) 
  WHERE NOT is_read;
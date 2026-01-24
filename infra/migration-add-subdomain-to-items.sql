-- Migration: Add subdomain column to items table
-- The subdomain (subcategory) is used for SDM-10 selection algorithm
-- SDM questions are selected based on Need ranking at subcategory level

-- Add subdomain column if it doesn't exist
ALTER TABLE items ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Update subdomain values based on domain for anchor questions
-- These mappings are based on the source of truth document
UPDATE items SET subdomain = CASE
    -- Q1 - Compound Interest
    WHEN external_item_id = '1' THEN 'Compound Interest'
    -- Q2 - Borrowing/Mortgages
    WHEN external_item_id = '2' THEN 'Borrowing/Mortgages'
    -- Q3, Q6, Q7 - Inflation
    WHEN external_item_id IN ('3', '6', '7') THEN 'Inflation'
    -- Q4 - Borrowing/Interest
    WHEN external_item_id = '4' THEN 'Borrowing/Interest'
    -- Q5 - Emergency Fund/Saving
    WHEN external_item_id = '5' THEN 'Saving'
    -- Q8 - Auto Loans/Borrowing
    WHEN external_item_id = '8' THEN 'Borrowing'
    -- Q9 - Budgeting/Earning
    WHEN external_item_id = '9' THEN 'Earning'
    -- Q10 - Credit Reports/Borrowing/Credit
    WHEN external_item_id = '10' THEN 'Borrowing/Credit'
    -- Q11, Q14 - Risk Diversification
    WHEN external_item_id IN ('11', '14') THEN 'Risk Diversification'
    -- Q12, Q13 - Insurance
    WHEN external_item_id IN ('12', '13') THEN 'Insurance'
    -- Q15-Q28 are preference items (not scored, no SDM)
    WHEN external_item_id IN ('15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28') THEN NULL
    -- Q29-Q32 - Investing
    WHEN external_item_id IN ('29', '30', '31', '32') THEN 'Investing'
    -- Q33 - Basic Probability
    WHEN external_item_id = '33' THEN 'Basic Probability'
    -- Q34 - Diversification Effect
    WHEN external_item_id = '34' THEN 'Diversification Effect'
    -- Q35 - Risk-Return Relationship
    WHEN external_item_id = '35' THEN 'Risk-Return Relationship'
    -- Q36 - Diversification Principle
    WHEN external_item_id = '36' THEN 'Diversification Principle'
    -- Q37 - Insurance Types
    WHEN external_item_id = '37' THEN 'Insurance Types'
    -- Q38 - Inflation Protection
    WHEN external_item_id = '38' THEN 'Inflation Protection'
    -- Q39 - Asset Class Risk (Stocks vs Bonds)
    WHEN external_item_id = '39' THEN 'Asset Class Risk'
    -- Q40 - Crisis/Systemic Risk
    WHEN external_item_id = '40' THEN 'Crisis/Systemic Risk'
    ELSE subdomain
END
WHERE is_anchor = true AND subdomain IS NULL;

-- For SDM items, copy subdomain from their anchor question
UPDATE items sdm
SET subdomain = anchor.subdomain
FROM items anchor
WHERE sdm.is_sdm = true
  AND sdm.anchor_item_id = anchor.item_id
  AND sdm.subdomain IS NULL;

-- Verify the update
SELECT
    external_item_id,
    domain,
    subdomain,
    is_anchor,
    is_sdm,
    COUNT(*) as count
FROM items
WHERE is_anchor = true OR is_sdm = true
GROUP BY external_item_id, domain, subdomain, is_anchor, is_sdm
ORDER BY
    CASE WHEN is_anchor THEN 0 ELSE 1 END,
    CAST(NULLIF(external_item_id, '') AS INTEGER) NULLS LAST;

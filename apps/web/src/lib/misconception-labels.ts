/**
 * Human-readable labels for misconception tags identified by AI scoring.
 * Tags come from ai_flags.layer2_tag in Open_Diagnose responses.
 */

export const TAG_LABELS: Record<string, string> = {
  // ── Knowledge Gaps ──
  'KG-blank': 'Knowledge gap (blank response)',
  'KG-idk': 'Knowledge gap',
  'KG-unfamiliar': 'Knowledge gap (unfamiliar topic)',
  'KG-vague': 'Knowledge gap (vague response)',
  'unfamiliar_with_mutual_fund': 'Unfamiliar with mutual funds',

  // ── Selection Errors ──
  'SE-selfcorrect': 'Selection error (self-corrected)',
  'SE-reversal': 'Selection error (reversal)',
  'SE-misread': 'Selection error (misread)',
  'misread_question': 'Misread the question',
  'correct_reasoning_wrong_answer': 'Correct reasoning, wrong answer',

  // ── Borrowing & Credit Misconceptions ──
  'interest_as_fee': 'Interest as a fee to the saver',
  'simple_interest_only': 'No compounding awareness',
  'principal_is_interest': 'Confuses principal with interest',
  'monthly_vs_total_confusion': 'Monthly vs total payment confusion',
  'shorter_means_higher_rate': 'Shorter term = higher rate',
  'time_irrelevant': 'Loan term irrelevant to cost',
  'down_payment_only': 'Only down payment is negotiable',
  'interest_rate_only': 'Only interest rate is negotiable',
  'interest_rate_fixed_by_fed': 'Fed sets rates, not negotiable',
  'credit_score_confusion': 'Credit report vs score confusion',
  'employer_use_confusion': "Employers can't check credit",

  // ── Inflation Misconceptions ──
  'lower_inflation_means_lower_prices': 'Lower inflation = falling prices',
  'deflation_confusion': 'Confuses lower inflation with deflation',
  'inflation_not_prices': 'Inflation unrelated to prices',
  'inflation_drives_all_up': 'Inflation raises all prices equally',
  'inflation_is_gradual_not_rapid': 'Inflation is always gradual',
  'employment_link': 'Links inflation to employment changes',
  'fixed_income_misunderstood': 'Fixed income misunderstood',
  'cd_benefits_from_inflation': 'CDs benefit from inflation',

  // ── Emergency Fund & Budgeting ──
  'one_month_sufficient': 'One month emergency fund sufficient',
  'fixed_dollar_amount': 'Fixed dollar amount (not expense-based)',
  'income_based_not_expense_based': 'Income-based, not expense-based',

  // ── Risk & Diversification ──
  'single_stock_safer_belief': 'Single stock is safer',
  'all_places_can_fail': 'All places can fail simultaneously',
  'more_assets_more_risk': 'More assets = more risk',
  'more_complexity_more_risk': 'More complexity = more risk',
  'more_exposure_more_risk': 'More exposure = more risk',
  'single_source_belief': 'Single source is better',
  'exceptions_disprove_rule': 'Exceptions invalidate the rule',
  'prediction_negates_risk': 'Predictions eliminate risk',
  'real_world_counterexample': 'Real-world counterexample',
  'time_horizon_negates_risk': 'Time horizon eliminates risk',

  // ── Insurance ──
  'routine_care_primary': 'Insurance is for routine care',
  'frequency_over_severity': 'Used often = primary function',
  'insurance_doesnt_cover_large_bills': "Insurance doesn't cover large bills",
  'deductible_is_max_payout': 'Deductible is max payout',
  'deductible_is_premium': 'Confuses deductible with premium',
  'health_insurance_for_injuries': 'Health insurance for injuries only',
  'auto_liability_for_self': 'Auto liability covers self',
  'purpose_misunderstanding': 'Insurance purpose misunderstood',

  // ── Investment & Returns ──
  'positive_correlation_belief': 'Rates up = bond prices up',
  'no_relationship_belief': 'No relationship between rates and prices',
  'bonds_safest_therefore_best': 'Bonds safest = best returns',
  'savings_safest_therefore_best': 'Savings safest = best returns',
  'bonds_contain_stocks': 'Bonds contain stocks',
  'some_bonds_risky_too': 'Some bonds risky too',
  'high_savings_risk': 'High savings = high risk',
  'stocks_too_risky_for_returns': 'Stocks too risky for returns',
  'wealth_creation_primary': 'Wealth creation is primary market function',
  'capital_raising_primary': 'Capital raising is primary function',
  'more_is_always_better': 'More diversification always better',
  'not_guaranteed': 'Returns not guaranteed so avoid',
  'guarantees_profit': 'Diversification guarantees profit',
  'probability_misunderstanding': 'Probability misunderstanding',
  'trust_based_reasoning': 'Trust-based reasoning',
  'partial_understanding': 'Partial understanding',

  // ── Inflation Protection ──
  'fixed_bond_best': 'Fixed bonds best for inflation',
  'mortgage_not_house': 'Mortgage, not house value',

  // ── Financial Crisis ──
  'low_borrowing_caused_crash': 'Low borrowing caused the crash',
  'regulation_caused_crisis': 'Regulation caused the crisis',
  'young_because_building': 'Young because building wealth',
  'young_because_employment': 'Young because employment risk',
  'young_couples_worst': 'Young couples suffer most',
  'older_workers_worst': 'Older workers suffer most',

  // ── Misc ──
  'RISK-03': 'Risk diversification misconception',
};

/**
 * Get a human-readable label for a misconception tag.
 * Falls back to humanizing the tag string if not in the map.
 */
export function getTagLabel(tag: string): string {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  // Fallback: replace underscores with spaces, capitalize first letter
  return tag
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
}

import { buildBudgetAlerts } from './budget-alerts.js';
import { buildCategoryTrends } from './category-trends.js';
import { buildSuggestions } from './suggestions.js';
import { AnalysisInput, SpendingAnalysis } from './analysis.types.js';

export function analyzeSpending(input: AnalysisInput): SpendingAnalysis {
  const budgetAlerts = buildBudgetAlerts(input);
  const categoryTrends = buildCategoryTrends(input.current, input.period);
  return {
    budgetAlerts,
    categoryTrends,
    suggestions: buildSuggestions(budgetAlerts, categoryTrends, input.current),
  };
}

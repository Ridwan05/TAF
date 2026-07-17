// Derived partner figures.
//
// Budget lines are the source of truth for utilization: a partner's disbursed
// amount is the sum of "total used" across its budget lines, and the RAG status
// is computed from utilization (disbursed / grant), never entered by hand.
//
// Fallback: a partner with no budget lines keeps its stored `disbursed` value
// (so existing seed data still displays), until lines are added.

export function ragFor(disbursed, grant) {
  const pct = grant > 0 ? (disbursed / grant) * 100 : 0
  if (pct >= 75) return 'Green'
  if (pct >= 50) return 'Amber'
  return 'Red'
}

export function sumUsed(budgetLines = []) {
  return budgetLines.reduce((s, l) => s + Number(l.totalUsed || 0), 0)
}

export function sumAmount(budgetLines = []) {
  return budgetLines.reduce((s, l) => s + Number(l.totalAmount || 0), 0)
}

// Return the partner with `disbursed` and `utilizationType` recomputed from its
// budget lines. Call this after loading data and after any budget-line change.
export function withDerived(partner) {
  const lines = partner.budgetLines || []
  const disbursed = lines.length ? sumUsed(lines) : Number(partner.disbursed || 0)
  const grant = Number(partner.grant || 0)
  return { ...partner, disbursed, utilizationType: ragFor(disbursed, grant) }
}

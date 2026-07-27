// Derived partner figures.
//
// Budget lines are the source of truth for a partner's financials. Grant,
// disbursed and remaining shown across the app aggregate the budget lines, so a
// partner with NO budget lines shows zero for all three. (The entered Total
// Grant is still stored on the partner and used as the allocation cap and in
// the edit modal — it just isn't shown as a headline figure until lines exist.)

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

// Headline figures for a partner, derived from its budget lines.
// No budget lines => grant / disbursed / remaining are all zero.
export function financials(partner) {
  const lines = partner.budgetLines || []
  const hasLines = lines.length > 0
  const grant = hasLines ? Number(partner.grant || 0) : 0
  const disbursed = hasLines ? sumUsed(lines) : 0
  const remaining = grant - disbursed
  const utilization = grant > 0 ? Math.round((disbursed / grant) * 100) : 0
  return { grant, disbursed, remaining, utilization, rag: ragFor(disbursed, grant), hasLines }
}

// Stamp the derived `disbursed` and `utilizationType` onto a partner so lists
// and charts that read those fields stay consistent. Call after loading data
// and after any budget-line change. Leaves the stored `grant` untouched.
export function withDerived(partner) {
  const f = financials(partner)
  return { ...partner, disbursed: f.disbursed, utilizationType: f.rag }
}

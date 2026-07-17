export const SAMPLE_PARTNERS = [
  {
    id: 'kfw',
    name: 'KfW Development Bank',
    currency: 'USD',
    grant: 1900000,
    disbursed: 1500000,
    targetDate: '2026-08-29',
    purpose: 'Support InfraCredit\'s green bond framework and pipeline development.',
    expectedOutcome: 'Pre-investment resulted in financial close for multiple DRE projects.',
    actualOutcome: 'As at December 2025 these projects have achieved connections to clean electricity.',
    utilizationType: 'Green',
    milestones: [
      { id: 1, text: 'Confirm 2026 workplan', date: '2026-03-31', status: 'Completed' },
      { id: 2, text: 'Mobilize consultants', date: '2026-06-30', status: 'On Going' }
    ],
    kpis: [
      { id: 1, name: 'Utilization rate (disbursed/total)', target: '100%', current: '83.8%', owner: 'Finance & Grants Management', status: 'Green' }
    ]
  },
  {
    id: 'fsd',
    name: 'FSD Africa',
    currency: 'EUR',
    grant: 1500000,
    disbursed: 1000000,
    targetDate: '2026-08-29',
    purpose: 'Support financial inclusion activities.',
    expectedOutcome: 'Transactions reaching financial close in DRE.',
    actualOutcome: 'Ongoing pipeline development.',
    utilizationType: 'Amber',
    milestones: [],
    kpis: []
  }
]

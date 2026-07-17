'use client'

import React, { useContext, useState } from 'react'
import { DataContext } from '../lib/DataProvider'
import { useAuth } from '../lib/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { withDerived, sumAmount, sumUsed } from '../lib/partnerCalc'
import EditPartnerModal from '../components/EditPartnerModal'
import BudgetLineModal from '../components/BudgetLineModal'

const STATUS_PILL = { Completed: 'green', 'On Going': 'amber', 'Not Started': 'red' }

export default function PartnerDetail({ id }) {
  const { partners, setPartners } = useContext(DataContext)
  const { user, canEdit } = useAuth()
  const [editing, setEditing] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(true)
  const [editingLine, setEditingLine] = useState(null) // line object, {} for new, or null
  const [error, setError] = useState('')

  const partner = partners.find(x => x.id === id) ?? null
  if (!partner) return <div className="card"><p>Partner not found.</p></div>

  const balance = partner.grant - partner.disbursed
  const utilization = partner.grant > 0 ? Math.round((partner.disbursed / partner.grant) * 100) : 0
  const cur = partner.currency
  const lines = partner.budgetLines || []
  const teams = partner.responsibleTeams || []
  const objectives = partner.reportObjectives || []
  const lessons = partner.lessonsLearned || []

  const applyPartner = updater =>
    setPartners(prev => prev.map(p => (p.id === partner.id ? withDerived(updater(p)) : p)))

  const onSavePartner = updated => {
    setPartners(prev => prev.map(p => (p.id === updated.id ? withDerived(updated) : p)))
    setEditing(false)
  }

  const saveBudgetLine = async lineForm => {
    setError('')
    const payload = {
      partner_id: partner.id,
      activity: lineForm.activity,
      currency: lineForm.currency,
      taf_type: lineForm.tafType,
      total_amount: lineForm.totalAmount,
      total_used: lineForm.totalUsed
    }
    if (lineForm.id) {
      const { error: e } = await supabase.from('budget_lines').update(payload).eq('id', lineForm.id)
      if (e) throw new Error(e.message)
      applyPartner(p => ({ ...p, budgetLines: p.budgetLines.map(l => (l.id === lineForm.id ? { ...lineForm } : l)) }))
    } else {
      const { data, error: e } = await supabase.from('budget_lines').insert(payload).select().single()
      if (e) throw new Error(e.message)
      const newLine = { id: data.id, activity: data.activity, currency: data.currency, tafType: data.taf_type, totalAmount: Number(data.total_amount || 0), totalUsed: Number(data.total_used || 0) }
      applyPartner(p => ({ ...p, budgetLines: [...(p.budgetLines || []), newLine] }))
    }
  }

  const deleteBudgetLine = async lineId => {
    setError('')
    const { error: e } = await supabase.from('budget_lines').delete().eq('id', lineId)
    if (e) { setError(e.message); return }
    applyPartner(p => ({ ...p, budgetLines: p.budgetLines.filter(l => l.id !== lineId) }))
  }

  const otherAmount = editingLine
    ? sumAmount(lines.filter(l => l.id !== editingLine.id))
    : 0

  const fmtDate = d => (d ? new Date(d).toLocaleDateString() : '—')

  return (
    <div className="stack">
      <div className="page-header">
        <h1>{partner.name} <span className={`pill ${(partner.utilizationType || '').toLowerCase()}`}>{partner.utilizationType}</span></h1>
        <div className="actions">
          {canEdit
            ? <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            : <span className="muted">{user ? 'Read-only access' : 'Sign in to edit'}</span>}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat blue"><div className="label">Total Grant</div><div className="value">{cur} {Number(partner.grant).toLocaleString()}</div></div>
        <div className="stat green"><div className="label">Disbursed</div><div className="value">{cur} {Number(partner.disbursed).toLocaleString()}</div></div>
        <div className="stat orange"><div className="label">Remaining Balance</div><div className="value">{cur} {balance.toLocaleString()}</div></div>
        <div className="stat navy"><div className="label">Full utilization target date</div><div className="value">{fmtDate(partner.targetDate)}</div></div>
      </div>

      <div className="card">
        <div className="progress-head">
          <div style={{ fontWeight: 600 }}>Utilization Progress</div>
          <div className="pct">{utilization}%</div>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(utilization, 100)}%` }} /></div>
      </div>

      {/* Budget Line Breakdown */}
      <div className="card">
        <div className="progress-head" style={{ marginBottom: budgetOpen ? 16 : 0 }}>
          <button className="btn ghost small" onClick={() => setBudgetOpen(o => !o)} aria-expanded={budgetOpen}>
            {budgetOpen ? '▾' : '▸'} Budget Line Breakdown
          </button>
          {canEdit && budgetOpen && (
            <button className="btn green small" onClick={() => setEditingLine({})}>+ Add line</button>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
        {budgetOpen && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>S/N</th><th>Budget Line Or Activity</th><th>Currency</th><th>TAF Type</th>
                  <th>Total TAF Amount</th><th>Total TAF Used</th><th>Total TAF Left</th>
                  {canEdit && <th></th>}
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr><td colSpan={canEdit ? 8 : 7} style={{ padding: 18 }} className="muted">No budget lines yet.</td></tr>
                ) : lines.map((l, idx) => (
                  <tr key={l.id}>
                    <td>{idx + 1}</td>
                    <td>{l.activity}</td>
                    <td>{l.currency}</td>
                    <td>{l.tafType}</td>
                    <td>{Number(l.totalAmount).toLocaleString()}</td>
                    <td>{Number(l.totalUsed).toLocaleString()}</td>
                    <td>{(Number(l.totalAmount) - Number(l.totalUsed)).toLocaleString()}</td>
                    {canEdit && (
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button className="btn ghost small" onClick={() => setEditingLine(l)}>Edit</button>{' '}
                        <button className="btn danger small" onClick={() => deleteBudgetLine(l.id)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {lines.length > 0 && (
                <tfoot>
                  <tr style={{ fontWeight: 700 }}>
                    <td colSpan={4}>Totals</td>
                    <td>{sumAmount(lines).toLocaleString()}</td>
                    <td>{sumUsed(lines).toLocaleString()}</td>
                    <td>{(sumAmount(lines) - sumUsed(lines)).toLocaleString()}</td>
                    {canEdit && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="grid">
        <div className="stack">
          <div className="card"><h3>Purpose (summary)</h3><p className="muted" style={{ margin: 0 }}>{partner.purpose || '—'}</p></div>
          <div className="card"><h3>Expected Outcome</h3><p className="muted" style={{ margin: 0 }}>{partner.expectedOutcome || '—'}</p></div>
          <div className="card"><h3>Actual Outcome</h3><p className="muted" style={{ margin: 0 }}>{partner.actualOutcome || '—'}</p></div>

          <div className="card">
            <h3>Report Objectives</h3>
            {objectives.length ? (
              <ul className="muted" style={{ margin: 0, paddingLeft: 20 }}>
                {objectives.map((o, i) => <li key={i} style={{ marginBottom: 6 }}>{o}</li>)}
              </ul>
            ) : <p className="muted" style={{ margin: 0 }}>—</p>}
          </div>

          <div className="card">
            <h3>Lessons Learned</h3>
            {lessons.length ? (
              <ul className="muted" style={{ margin: 0, paddingLeft: 20 }}>
                {lessons.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l}</li>)}
              </ul>
            ) : <p className="muted" style={{ margin: 0 }}>—</p>}
          </div>

          <div className="card">
            <h3>Implementation Timeline</h3>
            <p style={{ margin: 0 }}>{fmtDate(partner.implStart)} <span className="muted">→</span> {fmtDate(partner.implEnd)}</p>
          </div>

          <div className="card">
            <h3>Responsible teams</h3>
            {teams.length ? (
              <div className="row-inline" style={{ gap: 8 }}>
                {teams.map((t, i) => <span key={i} className="chip" style={{ flex: '0 0 auto', minWidth: 0 }}>{t}</span>)}
              </div>
            ) : <p className="muted" style={{ margin: 0 }}>No teams assigned.</p>}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h4>Key Milestones</h4>
            {partner.milestones?.length ? (
              <div className="stack" style={{ gap: 10 }}>
                {partner.milestones.map(m => (
                  <div className="subcard" key={m.id} style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.text}</div>
                      {m.date && <div className="muted" style={{ fontSize: 12 }}>{fmtDate(m.date)}</div>}
                    </div>
                    <span className={`pill ${STATUS_PILL[m.status] || 'amber'}`}>{m.status}</span>
                  </div>
                ))}
              </div>
            ) : <p className="muted" style={{ margin: 0 }}>No milestones defined.</p>}
          </div>

          <div className="card">
            <h4>KPIs</h4>
            {partner.kpis?.length ? (
              <div className="stack" style={{ gap: 10 }}>
                {partner.kpis.map(k => (
                  <div className="subcard" key={k.id} style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontWeight: 600 }}>{k.name}</div>
                      <span className={`pill ${(k.status || '').toLowerCase()}`}>{k.status}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                      {k.target && <span>Target: {k.target}&nbsp;&nbsp;</span>}
                      {k.current && <span>Current: {k.current}</span>}
                    </div>
                    {k.owner && <div className="muted" style={{ fontSize: 13 }}>Owner: {k.owner}</div>}
                  </div>
                ))}
              </div>
            ) : <p className="muted" style={{ margin: 0 }}>No KPIs defined.</p>}
          </div>
        </div>
      </div>

      {editing && <EditPartnerModal partner={partner} onClose={() => setEditing(false)} onSave={onSavePartner} />}
      {editingLine && (
        <BudgetLineModal
          line={editingLine}
          currency={cur}
          grant={partner.grant}
          otherAmount={otherAmount}
          onClose={() => setEditingLine(null)}
          onSave={saveBudgetLine}
        />
      )}
    </div>
  )
}

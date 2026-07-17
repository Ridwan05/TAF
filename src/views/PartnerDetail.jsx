'use client'

import React, { useContext, useState } from 'react'
import { DataContext } from '../lib/DataProvider'
import { useAuth } from '../lib/AuthProvider'
import EditPartnerModal from '../components/EditPartnerModal'

const STATUS_PILL = {
  Completed: 'green',
  'On Going': 'amber',
  'Not Started': 'red'
}

export default function PartnerDetail({ id }) {
  const { partners, setPartners } = useContext(DataContext)
  const { user, canEdit } = useAuth()
  const [editing, setEditing] = useState(false)

  const partner = partners.find(x => x.id === id) ?? null

  if (!partner) return <div className="card"><p>Partner not found.</p></div>

  const balance = partner.grant - partner.disbursed
  const utilization = partner.grant > 0 ? Math.round((partner.disbursed / partner.grant) * 100) : 0
  const cur = partner.currency

  const onSave = updated => {
    setPartners(prev => prev.map(p => (p.id === updated.id ? updated : p)))
    setEditing(false)
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>
          {partner.name}{' '}
          <span className={`pill ${(partner.utilizationType || '').toLowerCase()}`}>{partner.utilizationType}</span>
        </h1>
        <div className="actions">
          {canEdit
            ? <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            : <span className="muted">{user ? 'Read-only access' : 'Sign in to edit'}</span>}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat blue">
          <div className="label">Total Grant</div>
          <div className="value">{cur} {Number(partner.grant).toLocaleString()}</div>
        </div>
        <div className="stat green">
          <div className="label">Disbursed</div>
          <div className="value">{cur} {Number(partner.disbursed).toLocaleString()}</div>
        </div>
        <div className="stat orange">
          <div className="label">Remaining Balance</div>
          <div className="value">{cur} {balance.toLocaleString()}</div>
        </div>
        <div className="stat navy">
          <div className="label">Full utilization target date</div>
          <div className="value">{partner.targetDate ? new Date(partner.targetDate).toLocaleDateString() : '—'}</div>
        </div>
      </div>

      <div className="card">
        <div className="progress-head">
          <div style={{ fontWeight: 600 }}>Utilization Progress</div>
          <div className="pct">{utilization}%</div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.min(utilization, 100)}%` }} />
        </div>
      </div>

      <div className="grid">
        <div className="stack">
          <div className="card">
            <h3>Purpose (summary)</h3>
            <p className="muted" style={{ margin: 0 }}>{partner.purpose || '—'}</p>
          </div>
          <div className="card">
            <h3>Expected Outcome</h3>
            <p className="muted" style={{ margin: 0 }}>{partner.expectedOutcome || '—'}</p>
          </div>
          <div className="card">
            <h3>Actual Outcome</h3>
            <p className="muted" style={{ margin: 0 }}>{partner.actualOutcome || '—'}</p>
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
                      {m.date && <div className="muted" style={{ fontSize: 12 }}>{new Date(m.date).toLocaleDateString()}</div>}
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

      {editing && <EditPartnerModal partner={partner} onClose={() => setEditing(false)} onSave={onSave} />}
    </div>
  )
}

'use client'

import React, { useContext, useState } from 'react'
import { DataContext } from '../lib/DataProvider'
import { useAuth } from '../lib/AuthProvider'
import EditPartnerModal from '../components/EditPartnerModal'

export default function PartnerDetail({ id }) {
  const { partners, setPartners } = useContext(DataContext)
  const { user, canEdit } = useAuth()
  const [editing, setEditing] = useState(false)

  // Derive the partner from context during render so it works for both
  // server-side rendering and client hydration (no effect required).
  const partner = partners.find(x => x.id === id) ?? null

  if (!partner) return <div className="container"><p>Partner not found.</p></div>

  const balance = partner.grant - partner.disbursed
  const utilization = Math.round((partner.disbursed / partner.grant) * 100)

  const onSave = updated => {
    // update partners in context; the derived `partner` reflects it next render
    setPartners(prev => prev.map(p => (p.id === updated.id ? updated : p)))
    setEditing(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1>{partner.name} <span className={`pill ${partner.utilizationType?.toLowerCase()}`}>{partner.utilizationType}</span></h1>
        <div className="actions">
          {canEdit
            ? <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            : <span className="role">{user ? 'Read-only access' : 'Sign in to edit'}</span>}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div style={{display:'flex',gap:12}}>
            <div className="card" style={{flex:1,background:'#4b6cb7',color:'#fff'}}>
              <div>Total Grant</div>
              <h2>{partner.currency} {partner.grant.toLocaleString()}</h2>
            </div>
            <div className="card" style={{flex:1,background:'#2ecc71',color:'#fff'}}>
              <div>Disbursed</div>
              <h2>{partner.currency} {partner.disbursed.toLocaleString()}</h2>
            </div>
            <div className="card" style={{flex:1,background:'#f54f2c',color:'#fff'}}>
              <div>Remaining Balance</div>
              <h2>{partner.currency} {balance.toLocaleString()}</h2>
            </div>
            <div className="card" style={{flex:1,background:'#0f1724',color:'#fff'}}>
              <div>Full utilization target Date</div>
              <h2>{new Date(partner.targetDate).toLocaleDateString()}</h2>
            </div>
          </div>

          <div style={{marginTop:16}} className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>Utilization Progress</div>
              <div style={{fontWeight:700}}>{utilization}%</div>
            </div>
            <div style={{height:14,background:'#eef2f7',borderRadius:8,marginTop:8}}>
              <div style={{width:`${utilization}%`,height:14,background:'#2ecc71',borderRadius:8}} />
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3>Purpose (summary)</h3>
            <p>{partner.purpose}</p>

            <h3>Expected Outcome</h3>
            <p>{partner.expectedOutcome}</p>

            <h3>Actual Outcome</h3>
            <p>{partner.actualOutcome}</p>
          </div>
        </div>

        <div>
          <div className="card">
            <h4>Key Milestones</h4>
            {partner.milestones?.length ? (
              <ul>
                {partner.milestones.map(m => (
                  <li key={m.id}>{m.text} — <em>{m.status}</em></li>
                ))}
              </ul>
            ) : <p>No milestones defined.</p>}
          </div>

          <div className="card" style={{marginTop:12}}>
            <h4>KPIs</h4>
            {partner.kpis?.length ? (
              <ul>
                {partner.kpis.map(k => (
                  <li key={k.id}>{k.name} — {k.current} ({k.status})</li>
                ))}
              </ul>
            ) : <p>No KPIs defined.</p>}
          </div>
        </div>
      </div>

      {editing && <EditPartnerModal partner={partner} onClose={() => setEditing(false)} onSave={onSave} />}
    </div>
  )
}

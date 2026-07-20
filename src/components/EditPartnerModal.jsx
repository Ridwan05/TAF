'use client'

import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ragFor, sumUsed } from '../lib/partnerCalc'

function slugify(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function EditPartnerModal({ partner, onClose, onSave, isNew = false, title }) {
  const [form, setForm] = useState({ ...partner })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = patch => setForm(f => ({ ...f, ...patch }))

  // Derived (read-only): disbursed comes from budget lines; RAG from utilization.
  const lines = form.budgetLines || []
  const disbursed = lines.length ? sumUsed(lines) : Number(form.disbursed || 0)
  const grant = Number(form.grant || 0)
  const utilization = grant > 0 ? Math.round((disbursed / grant) * 100) : 0
  const rag = ragFor(disbursed, grant)

  const addMilestone = () => update({ milestones: [...(form.milestones || []), { id: Date.now(), text: 'New milestone', date: '', status: 'Not Started' }] })
  const removeMilestone = idx => { const arr = [...(form.milestones || [])]; arr.splice(idx, 1); update({ milestones: arr }) }
  const patchMilestone = (idx, patch) => { const arr = [...(form.milestones || [])]; arr[idx] = { ...arr[idx], ...patch }; update({ milestones: arr }) }

  const addKpi = () => update({ kpis: [...(form.kpis || []), { id: Date.now(), name: 'New KPI', target: '', current: '', owner: '', status: 'Amber' }] })
  const removeKpi = idx => { const arr = [...(form.kpis || [])]; arr.splice(idx, 1); update({ kpis: arr }) }
  const patchKpi = (idx, patch) => { const arr = [...(form.kpis || [])]; arr[idx] = { ...arr[idx], ...patch }; update({ kpis: arr }) }

  const save = async () => {
    const id = (isNew ? (slugify(form.id) || slugify(form.name)) : form.id) || `partner-${Date.now()}`
    if (isNew && !form.name.trim()) { setError('Please enter a partner name.'); return }

    const teams = Array.isArray(form.responsibleTeams)
      ? form.responsibleTeams
      : String(form.responsibleTeams || '').split(',').map(s => s.trim()).filter(Boolean)

    const toLines = v => (Array.isArray(v) ? v : String(v || '').split('\n')).map(s => s.trim()).filter(Boolean)
    const objectives = toLines(form.reportObjectives)
    // Lessons: preserve the author's line breaks and blank-line paragraphs
    // (only trailing whitespace is trimmed) so numbering/paragraphs survive.
    const lessons = Array.isArray(form.lessonsLearned)
      ? form.lessonsLearned
      : String(form.lessonsLearned || '').replace(/\s+$/, '').split('\n')

    setSaving(true)
    setError('')
    try {
      const { error: pErr } = await supabase.from('partners').upsert({
        id,
        name: form.name,
        currency: form.currency,
        grant: form.grant,
        disbursed,                       // derived, kept in sync
        target_date: form.targetDate || null,
        purpose: form.purpose,
        expected_outcome: form.expectedOutcome,
        actual_outcome: form.actualOutcome,
        utilization_type: rag,           // derived
        impl_start: form.implStart || null,
        impl_end: form.implEnd || null,
        responsible_teams: teams,
        grant_year: form.grantYear ? Number(form.grantYear) : null,
        report_objectives: objectives,
        lessons_learned: lessons
      })
      if (pErr) throw pErr

      await supabase.from('milestones').delete().eq('partner_id', id)
      if (form.milestones?.length) {
        await supabase.from('milestones').insert(form.milestones.map(m => ({ partner_id: id, text: m.text, date: m.date || null, status: m.status })))
      }
      await supabase.from('kpis').delete().eq('partner_id', id)
      if (form.kpis?.length) {
        await supabase.from('kpis').insert(form.kpis.map(k => ({ partner_id: id, name: k.name, target: k.target, current: k.current, owner: k.owner, status: k.status })))
      }

      onSave({ ...form, id, disbursed, utilizationType: rag, responsibleTeams: teams, reportObjectives: objectives, lessonsLearned: lessons })
    } catch (err) {
      console.error('save error', err)
      setError(err?.message || 'Save failed. See console.')
    } finally {
      setSaving(false)
    }
  }

  const teamsValue = Array.isArray(form.responsibleTeams) ? form.responsibleTeams.join(', ') : (form.responsibleTeams || '')

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{title || (isNew ? 'Add Partner' : 'Edit Partner')}</h3>
            {!isNew && <p className="sub">{form.name}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="section-title first">Details</div>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input value={form.name || ''} onChange={e => update({ name: e.target.value })} />
            </div>
            {isNew && (
              <div className="field">
                <label>Partner ID (URL slug)</label>
                <input value={form.id || ''} placeholder={slugify(form.name) || 'auto from name'} onChange={e => update({ id: e.target.value })} />
              </div>
            )}
            <div className="field">
              <label>Currency</label>
              <input value={form.currency || ''} onChange={e => update({ currency: e.target.value })} />
            </div>
            <div className="field">
              <label>Total Grant</label>
              <input type="number" value={form.grant ?? 0} onChange={e => update({ grant: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Disbursed <span className="muted">(from budget lines)</span></label>
              <input value={`${form.currency || ''} ${disbursed.toLocaleString()}`} readOnly disabled />
            </div>
            <div className="field">
              <label>Utilization / RAG <span className="muted">(auto)</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
                <strong>{utilization}%</strong>
                <span className={`pill ${rag.toLowerCase()}`}>{rag}</span>
              </div>
            </div>
            <div className="field">
              <label>Target date</label>
              <input type="date" value={form.targetDate?.slice(0, 10) || ''} onChange={e => update({ targetDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Grant year</label>
              <input type="number" placeholder="e.g. 2026" value={form.grantYear ?? ''} onChange={e => update({ grantYear: e.target.value })} />
            </div>
          </div>

          <div className="section-title">Implementation timeline</div>
          <div className="form-grid">
            <div className="field">
              <label>Start date</label>
              <input type="date" value={form.implStart?.slice(0, 10) || ''} onChange={e => update({ implStart: e.target.value })} />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" value={form.implEnd?.slice(0, 10) || ''} onChange={e => update({ implEnd: e.target.value })} />
            </div>
            <div className="field full">
              <label>Responsible teams <span className="muted">(comma separated)</span></label>
              <input value={teamsValue} placeholder="Clean Energy Team, Legal, …" onChange={e => update({ responsibleTeams: e.target.value })} />
            </div>
          </div>

          <div className="section-title">Narrative</div>
          <div className="form-grid">
            <div className="field full">
              <label>Purpose</label>
              <textarea rows={3} value={form.purpose || ''} onChange={e => update({ purpose: e.target.value })} />
            </div>
            <div className="field full">
              <label>Expected outcome</label>
              <textarea rows={3} value={form.expectedOutcome || ''} onChange={e => update({ expectedOutcome: e.target.value })} />
            </div>
            <div className="field full">
              <label>Actual outcome</label>
              <textarea rows={3} value={form.actualOutcome || ''} onChange={e => update({ actualOutcome: e.target.value })} />
            </div>
          </div>

          <div className="section-title">Report objectives &amp; lessons</div>
          <div className="form-grid">
            <div className="field full">
              <label>Report objectives <span className="muted">(one per line)</span></label>
              <textarea rows={4}
                value={Array.isArray(form.reportObjectives) ? form.reportObjectives.join('\n') : (form.reportObjectives || '')}
                onChange={e => update({ reportObjectives: e.target.value })} />
            </div>
            <div className="field full">
              <label>Lessons learned <span className="muted">(one per line)</span></label>
              <textarea rows={4}
                value={Array.isArray(form.lessonsLearned) ? form.lessonsLearned.join('\n') : (form.lessonsLearned || '')}
                onChange={e => update({ lessonsLearned: e.target.value })} />
            </div>
          </div>

          <div className="section-title">Milestones</div>
          {(form.milestones || []).map((m, idx) => (
            <div className="subcard" key={m.id ?? idx}>
              <div className="field" style={{ marginBottom: 8 }}>
                <input value={m.text} placeholder="Milestone" onChange={e => patchMilestone(idx, { text: e.target.value })} />
              </div>
              <div className="row-inline">
                <input type="date" value={m.date || ''} onChange={e => patchMilestone(idx, { date: e.target.value })} />
                <select value={m.status} onChange={e => patchMilestone(idx, { status: e.target.value })}>
                  <option>Not Started</option><option>On Going</option><option>Completed</option>
                </select>
                <button type="button" className="btn ghost small" style={{ flex: '0 0 auto' }} onClick={() => removeMilestone(idx)}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn ghost small" onClick={addMilestone}>+ Add milestone</button>

          <div className="section-title">KPIs</div>
          {(form.kpis || []).map((k, idx) => (
            <div className="subcard" key={k.id ?? idx}>
              <div className="field" style={{ marginBottom: 8 }}>
                <input value={k.name} placeholder="KPI name" onChange={e => patchKpi(idx, { name: e.target.value })} />
              </div>
              <div className="row-inline">
                <input placeholder="Target" value={k.target || ''} onChange={e => patchKpi(idx, { target: e.target.value })} />
                <input placeholder="Current" value={k.current || ''} onChange={e => patchKpi(idx, { current: e.target.value })} />
                <input placeholder="Owner" value={k.owner || ''} onChange={e => patchKpi(idx, { owner: e.target.value })} />
                <select value={k.status} onChange={e => patchKpi(idx, { status: e.target.value })}>
                  <option>Green</option><option>Amber</option><option>Red</option>
                </select>
                <button type="button" className="btn ghost small" style={{ flex: '0 0 auto' }} onClick={() => removeKpi(idx)}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn ghost small" onClick={addKpi}>+ Add KPI</button>
        </div>

        <div className="modal-footer">
          {error && <p className="form-error" style={{ marginRight: 'auto', alignSelf: 'center' }}>{error}</p>}
          <button className="btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn green" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}

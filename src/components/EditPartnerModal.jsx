'use client'

import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function slugify(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function EditPartnerModal({ partner, onClose, onSave, isNew = false, title }) {
  const [form, setForm] = useState({ ...partner })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = patch => setForm(f => ({ ...f, ...patch }))

  const addMilestone = () => {
    const m = { id: Date.now(), text: 'New milestone', date: '', status: 'Not Started' }
    update({ milestones: [...(form.milestones || []), m] })
  }
  const removeMilestone = idx => {
    const arr = [...(form.milestones || [])]
    arr.splice(idx, 1)
    update({ milestones: arr })
  }
  const patchMilestone = (idx, patch) => {
    const arr = [...(form.milestones || [])]
    arr[idx] = { ...arr[idx], ...patch }
    update({ milestones: arr })
  }

  const addKpi = () => {
    const k = { id: Date.now(), name: 'New KPI', target: '', current: '', owner: '', status: 'Amber' }
    update({ kpis: [...(form.kpis || []), k] })
  }
  const removeKpi = idx => {
    const arr = [...(form.kpis || [])]
    arr.splice(idx, 1)
    update({ kpis: arr })
  }
  const patchKpi = (idx, patch) => {
    const arr = [...(form.kpis || [])]
    arr[idx] = { ...arr[idx], ...patch }
    update({ kpis: arr })
  }

  const save = async () => {
    const id = (isNew ? (slugify(form.id) || slugify(form.name)) : form.id) || `partner-${Date.now()}`

    if (isNew && !form.name.trim()) {
      setError('Please enter a partner name.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { error: pErr } = await supabase.from('partners').upsert({
        id,
        name: form.name,
        currency: form.currency,
        grant: form.grant,
        disbursed: form.disbursed,
        target_date: form.targetDate || null,
        purpose: form.purpose,
        expected_outcome: form.expectedOutcome,
        actual_outcome: form.actualOutcome,
        utilization_type: form.utilizationType
      })
      if (pErr) throw pErr

      await supabase.from('milestones').delete().eq('partner_id', id)
      if (form.milestones && form.milestones.length) {
        const toInsert = form.milestones.map(m => ({ partner_id: id, text: m.text, date: m.date || null, status: m.status }))
        await supabase.from('milestones').insert(toInsert)
      }

      await supabase.from('kpis').delete().eq('partner_id', id)
      if (form.kpis && form.kpis.length) {
        const toInsert = form.kpis.map(k => ({ partner_id: id, name: k.name, target: k.target, current: k.current, owner: k.owner, status: k.status }))
        await supabase.from('kpis').insert(toInsert)
      }

      onSave({ ...form, id })
    } catch (err) {
      console.error('save error', err)
      setError(err?.message || 'Save failed. See console.')
    } finally {
      setSaving(false)
    }
  }

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
                <input value={form.id || ''} placeholder={slugify(form.name) || 'auto from name'}
                  onChange={e => update({ id: e.target.value })} />
              </div>
            )}
            <div className="field">
              <label>Currency</label>
              <input value={form.currency || ''} onChange={e => update({ currency: e.target.value })} />
            </div>
            <div className="field">
              <label>Utilization (RAG)</label>
              <select value={form.utilizationType || 'Green'} onChange={e => update({ utilizationType: e.target.value })}>
                <option>Green</option>
                <option>Amber</option>
                <option>Red</option>
              </select>
            </div>
            <div className="field">
              <label>Grant</label>
              <input type="number" value={form.grant ?? 0} onChange={e => update({ grant: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Disbursed</label>
              <input type="number" value={form.disbursed ?? 0} onChange={e => update({ disbursed: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Target date</label>
              <input type="date" value={form.targetDate?.slice(0, 10) || ''} onChange={e => update({ targetDate: e.target.value })} />
            </div>
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

          <div className="section-title">Milestones</div>
          {(form.milestones || []).map((m, idx) => (
            <div className="subcard" key={m.id ?? idx}>
              <div className="field" style={{ marginBottom: 8 }}>
                <input value={m.text} placeholder="Milestone" onChange={e => patchMilestone(idx, { text: e.target.value })} />
              </div>
              <div className="row-inline">
                <input type="date" value={m.date || ''} onChange={e => patchMilestone(idx, { date: e.target.value })} />
                <select value={m.status} onChange={e => patchMilestone(idx, { status: e.target.value })}>
                  <option>Not Started</option>
                  <option>On Going</option>
                  <option>Completed</option>
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
                  <option>Green</option>
                  <option>Amber</option>
                  <option>Red</option>
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

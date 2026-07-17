'use client'

import React, { useState } from 'react'

// props:
//  line         - the budget line being edited (or a blank template for new)
//  currency     - partner currency (default for new lines)
//  grant        - partner Total Grant (cap for the sum of all line amounts)
//  otherAmount  - sum of Total TAF Amount of all OTHER lines (excludes this one)
//  onClose, onSave(line)
export default function BudgetLineModal({ line, currency, grant, otherAmount, onClose, onSave }) {
  const [form, setForm] = useState({
    activity: '',
    currency: currency || 'USD',
    tafType: line?.tafType || 'Non-Refundable',
    totalAmount: 0,
    totalUsed: 0,
    ...line
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = patch => setForm(f => ({ ...f, ...patch }))

  const amount = Number(form.totalAmount || 0)
  const used = Number(form.totalUsed || 0)
  const left = amount - used
  const projectedTotal = Number(otherAmount || 0) + amount

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (!form.activity.trim()) { setError('Enter a budget line / activity.'); return }
    if (used > amount) { setError('Total TAF Used cannot exceed Total TAF Amount.'); return }
    if (grant > 0 && projectedTotal > grant) {
      setError(`Total of all budget amounts (${projectedTotal.toLocaleString()}) would exceed the partner's Total Grant (${Number(grant).toLocaleString()}).`)
      return
    }
    setBusy(true)
    try {
      await onSave({ ...form, totalAmount: amount, totalUsed: used })
      onClose()
    } catch (err) {
      setError(err?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <form className="modal narrow" onMouseDown={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <h3>{line?.id ? 'Edit budget line' : 'Add budget line'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Budget line or activity</label>
            <input value={form.activity} onChange={e => update({ activity: e.target.value })} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Currency</label>
              <input value={form.currency} onChange={e => update({ currency: e.target.value })} />
            </div>
            <div className="field">
              <label>TAF type</label>
              <select value={form.tafType} onChange={e => update({ tafType: e.target.value })}>
                <option>Refundable</option>
                <option>Non-Refundable</option>
              </select>
            </div>
            <div className="field">
              <label>Total TAF amount</label>
              <input type="number" value={form.totalAmount} onChange={e => update({ totalAmount: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Total TAF used</label>
              <input type="number" value={form.totalUsed} onChange={e => update({ totalUsed: Number(e.target.value) })} />
            </div>
          </div>
          <p className="muted" style={{ margin: '4px 0 0' }}>Total TAF left: {form.currency} {left.toLocaleString()}</p>
          {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn green" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}

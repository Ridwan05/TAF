'use client'

import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function Field({label, children}){
  return <div style={{marginBottom:12}}><label style={{fontWeight:700}}>{label}</label><div>{children}</div></div>
}

export default function EditPartnerModal({ partner, onClose, onSave }){
  const [form, setForm] = useState({ ...partner })
  const [saving, setSaving] = useState(false)

  const update = (patch) => setForm(f => ({...f, ...patch}))

  const addMilestone = () => {
    const m = { id: Date.now(), text: 'New milestone', date: '', status: 'Not Started' }
    update({ milestones: [...(form.milestones||[]), m] })
  }

  const addKpi = () => {
    const k = { id: Date.now(), name: 'New KPI', target: '', current: '', owner: '', status: 'Amber' }
    update({ kpis: [...(form.kpis||[]), k] })
  }

  const save = async () => {
    setSaving(true)
    try {
      // upsert partner
      const { error: pErr } = await supabase.from('partners').upsert({
        id: form.id,
        name: form.name,
        currency: form.currency,
        grant: form.grant,
        disbursed: form.disbursed,
        target_date: form.targetDate,
        purpose: form.purpose,
        expected_outcome: form.expectedOutcome,
        actual_outcome: form.actualOutcome,
        utilization_type: form.utilizationType
      })

      if (pErr) throw pErr

      // replace milestones and kpis for simplicity
      await supabase.from('milestones').delete().eq('partner_id', form.id)
      if (form.milestones && form.milestones.length) {
        const toInsert = form.milestones.map(m => ({ partner_id: form.id, text: m.text, date: m.date || null, status: m.status }))
        await supabase.from('milestones').insert(toInsert)
      }

      await supabase.from('kpis').delete().eq('partner_id', form.id)
      if (form.kpis && form.kpis.length){
        const toInsert = form.kpis.map(k => ({ partner_id: form.id, name: k.name, target: k.target, current: k.current, owner: k.owner, status: k.status }))
        await supabase.from('kpis').insert(toInsert)
      }

      // fetch updated partner row including nested milestones/kpis is left to client
      onSave(form)
    } catch (err) {
      console.error('save error', err)
      alert('Save failed. See console.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
      <div style={{width:900,maxHeight:'90vh',overflow:'auto',background:'#fff',padding:20,borderRadius:12}}>
        <h3>Edit Partner</h3>
        <Field label="Name"><input value={form.name} onChange={e=>update({name:e.target.value})} /></Field>
        <Field label="Currency"><input value={form.currency} onChange={e=>update({currency:e.target.value})} /></Field>
        <Field label="Grant"><input type="number" value={form.grant} onChange={e=>update({grant:Number(e.target.value)})} /></Field>
        <Field label="Disbursed"><input type="number" value={form.disbursed} onChange={e=>update({disbursed:Number(e.target.value)})} /></Field>
        <Field label="Target Date"><input type="date" value={form.targetDate?.slice(0,10)} onChange={e=>update({targetDate:e.target.value})} /></Field>
        <Field label="Purpose"><textarea value={form.purpose} onChange={e=>update({purpose:e.target.value})} rows={3} /></Field>
        <Field label="Expected Outcome"><textarea value={form.expectedOutcome} onChange={e=>update({expectedOutcome:e.target.value})} rows={3} /></Field>
        <Field label="Actual Outcome"><textarea value={form.actualOutcome} onChange={e=>update({actualOutcome:e.target.value})} rows={3} /></Field>

        <div style={{display:'flex',gap:12}}>
          <div style={{flex:1}}>
            <h4>Milestones</h4>
            {(form.milestones||[]).map((m, idx)=> (
              <div key={m.id} style={{marginBottom:8,border:'1px solid #eef2f7',padding:8,borderRadius:6}}>
                <input style={{width:'100%'}} value={m.text} onChange={e=>{
                  const arr = [...(form.milestones||[])]
                  arr[idx] = {...arr[idx], text:e.target.value}
                  update({milestones:arr})
                }} />
                <div style={{display:'flex',gap:8,marginTop:6}}>
                  <input type="date" value={m.date||''} onChange={e=>{
                    const arr = [...(form.milestones||[])]
                    arr[idx] = {...arr[idx], date:e.target.value}
                    update({milestones:arr})
                  }} />
                  <select value={m.status} onChange={e=>{
                    const arr = [...(form.milestones||[])]
                    arr[idx] = {...arr[idx], status:e.target.value}
                    update({milestones:arr})
                  }}>
                    <option>Not Started</option>
                    <option>On Going</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
            ))}
            <button className="btn" onClick={addMilestone}>Add milestone</button>
          </div>

          <div style={{flex:1}}>
            <h4>KPIs</h4>
            {(form.kpis||[]).map((k, idx)=> (
              <div key={k.id} style={{marginBottom:8,border:'1px solid #eef2f7',padding:8,borderRadius:6}}>
                <input style={{width:'100%'}} value={k.name} onChange={e=>{
                  const arr = [...(form.kpis||[])]
                  arr[idx] = {...arr[idx], name:e.target.value}
                  update({kpis:arr})
                }} />
                <input placeholder="target" value={k.target||''} onChange={e=>{
                  const arr = [...(form.kpis||[])]
                  arr[idx] = {...arr[idx], target:e.target.value}
                  update({kpis:arr})
                }} />
                <input placeholder="current" value={k.current||''} onChange={e=>{
                  const arr = [...(form.kpis||[])]
                  arr[idx] = {...arr[idx], current:e.target.value}
                  update({kpis:arr})
                }} />
                <input placeholder="owner" value={k.owner||''} onChange={e=>{
                  const arr = [...(form.kpis||[])]
                  arr[idx] = {...arr[idx], owner:e.target.value}
                  update({kpis:arr})
                }} />
                <select value={k.status} onChange={e=>{
                  const arr = [...(form.kpis||[])]
                  arr[idx] = {...arr[idx], status:e.target.value}
                  update({kpis:arr})
                }}>
                  <option>Green</option>
                  <option>Amber</option>
                  <option>Red</option>
                </select>
              </div>
            ))}
            <button className="btn" onClick={addKpi}>Add KPI</button>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn green" onClick={save} disabled={saving}>{saving? 'Saving...':'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

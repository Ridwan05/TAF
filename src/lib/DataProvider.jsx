'use client'

import React, { useState, useEffect } from 'react'
import { SAMPLE_PARTNERS } from '../data/sample'
import { supabase } from './supabaseClient'
import { withDerived } from './partnerCalc'

export const DataContext = React.createContext(null)

// Map a Supabase `partners` row (snake_case) to the camelCase shape the UI uses.
function mapPartner(row) {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    grant: Number(row.grant),
    disbursed: Number(row.disbursed),
    targetDate: row.target_date,
    purpose: row.purpose,
    expectedOutcome: row.expected_outcome,
    actualOutcome: row.actual_outcome,
    utilizationType: row.utilization_type,
    implStart: row.impl_start,
    implEnd: row.impl_end,
    responsibleTeams: row.responsible_teams || [],
    grantYear: row.grant_year ?? null,
    reportObjectives: row.report_objectives || [],
    lessonsLearned: row.lessons_learned || [],
    milestones: [],
    kpis: [],
    budgetLines: []
  }
}

export default function DataProvider({ children }) {
  const [partners, setPartners] = useState(SAMPLE_PARTNERS)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [pRes, mRes, kRes, bRes] = await Promise.all([
          supabase.from('partners').select('*'),
          supabase.from('milestones').select('*'),
          supabase.from('kpis').select('*'),
          supabase.from('budget_lines').select('*')
        ])

        if (pRes.error || !pRes.data || !pRes.data.length || !mounted) return

        const byId = {}
        const mapped = pRes.data.map(row => {
          const p = mapPartner(row)
          byId[p.id] = p
          return p
        })

        if (!mRes.error && mRes.data) {
          for (const m of mRes.data) {
            byId[m.partner_id]?.milestones.push({ id: m.id, text: m.text, date: m.date, status: m.status })
          }
        }
        if (!kRes.error && kRes.data) {
          for (const k of kRes.data) {
            byId[k.partner_id]?.kpis.push({ id: k.id, name: k.name, target: k.target, current: k.current, owner: k.owner, status: k.status })
          }
        }
        if (!bRes.error && bRes.data) {
          for (const b of bRes.data) {
            byId[b.partner_id]?.budgetLines.push({
              id: b.id,
              activity: b.activity,
              currency: b.currency,
              tafType: b.taf_type,
              totalAmount: Number(b.total_amount || 0),
              totalUsed: Number(b.total_used || 0)
            })
          }
        }

        setPartners(mapped.map(withDerived))
      } catch (err) {
        // ignore, keep sample data
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <DataContext.Provider value={{ partners, setPartners }}>
      {children}
    </DataContext.Provider>
  )
}

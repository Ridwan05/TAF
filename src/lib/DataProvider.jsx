'use client'

import React, { useState, useEffect } from 'react'
import { SAMPLE_PARTNERS } from '../data/sample'
import { supabase } from './supabaseClient'

export const DataContext = React.createContext(null)

// Map a Supabase `partners` row (snake_case) to the camelCase shape the UI
// uses (see src/data/sample.js).
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
    milestones: [],
    kpis: []
  }
}

export default function DataProvider({ children }) {
  const [partners, setPartners] = useState(SAMPLE_PARTNERS)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [pRes, mRes, kRes] = await Promise.all([
          supabase.from('partners').select('*'),
          supabase.from('milestones').select('*'),
          supabase.from('kpis').select('*')
        ])

        if (pRes.error || !pRes.data || !pRes.data.length || !mounted) return

        const byId = {}
        const mapped = pRes.data.map(row => {
          const p = mapPartner(row)
          byId[p.id] = p
          return p
        })

        // Nest milestones/kpis under their partner (ignore orphans).
        if (!mRes.error && mRes.data) {
          for (const m of mRes.data) {
            byId[m.partner_id]?.milestones.push({
              id: m.id,
              text: m.text,
              date: m.date,
              status: m.status
            })
          }
        }
        if (!kRes.error && kRes.data) {
          for (const k of kRes.data) {
            byId[k.partner_id]?.kpis.push({
              id: k.id,
              name: k.name,
              target: k.target,
              current: k.current,
              owner: k.owner,
              status: k.status
            })
          }
        }

        setPartners(mapped)
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

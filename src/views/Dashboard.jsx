'use client'

import React, { useContext, useState } from 'react'
import Link from 'next/link'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend
} from 'chart.js'
import { DataContext } from '../lib/DataProvider'
import { useAuth } from '../lib/AuthProvider'
import EditPartnerModal from '../components/EditPartnerModal'

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend)

const RAG_COLORS = { Green: '#2ecc71', Amber: '#f39c12', Red: '#e74c3c' }

function utilPct(p) {
  return p.grant > 0 ? Math.round((p.disbursed / p.grant) * 100) : 0
}

function blankPartner() {
  return {
    id: '', name: '', currency: 'USD', grant: 0, disbursed: 0, targetDate: '',
    purpose: '', expectedOutcome: '', actualOutcome: '', utilizationType: 'Green',
    milestones: [], kpis: []
  }
}

export default function Dashboard() {
  const { partners, setPartners } = useContext(DataContext)
  const { canEdit } = useAuth()
  const [filter, setFilter] = useState('All Partners')
  const [adding, setAdding] = useState(false)

  const onAddSave = saved => {
    setPartners(prev => (
      prev.some(p => p.id === saved.id)
        ? prev.map(p => (p.id === saved.id ? saved : p))
        : [...prev, saved]
    ))
    setAdding(false)
  }

  const shown = filter === 'All Partners' ? partners : partners.filter(p => p.name === filter)

  const labels = shown.map(p => p.name)

  const utilizationChart = {
    labels,
    datasets: [{
      label: 'Utilization %',
      data: shown.map(utilPct),
      backgroundColor: shown.map(p => RAG_COLORS[p.utilizationType] || RAG_COLORS.Red),
      borderRadius: 6
    }]
  }

  const grantVsDisbursed = {
    labels,
    datasets: [
      { label: 'Disbursed', data: shown.map(p => p.disbursed), backgroundColor: '#2ecc71', borderRadius: 4 },
      { label: 'Remaining', data: shown.map(p => Math.max(p.grant - p.disbursed, 0)), backgroundColor: '#e2e8f0', borderRadius: 4 }
    ]
  }

  const doughnutData = {
    labels: ['Green', 'Amber', 'Red'],
    datasets: [{
      data: [
        shown.filter(p => p.utilizationType === 'Green').length,
        shown.filter(p => p.utilizationType === 'Amber').length,
        shown.filter(p => p.utilizationType === 'Red').length
      ],
      backgroundColor: [RAG_COLORS.Green, RAG_COLORS.Amber, RAG_COLORS.Red],
      borderWidth: 0
    }]
  }

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
  }
  const stackedOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } }
  }
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: { legend: { position: 'bottom' } }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>InfraTAF Impact Dashboard</h1>
          <div className="subtitle">TA Utilization Tracking &amp; Accountability</div>
        </div>
        <div className="actions">
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
            <option>All Partners</option>
            {partners.map(p => <option key={p.id}>{p.name}</option>)}
          </select>
          {canEdit && <button className="btn green" onClick={() => setAdding(true)}>Add Partner</button>}
          <button className="btn ghost">Download</button>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3>Utilization by Partner</h3>
          <div style={{ height: 280 }}><Bar data={utilizationChart} options={barOptions} /></div>
        </div>
        <div className="card">
          <h3>Grant vs Disbursed</h3>
          <div style={{ height: 280 }}><Bar data={grantVsDisbursed} options={stackedOptions} /></div>
        </div>
      </div>

      <div className="card">
        <h3>Utilization RAG Status Across All Partners</h3>
        <div style={{ height: 300, maxWidth: 460, margin: '0 auto' }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      <div className="table-card card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Partner / Facility</th>
                <th>Grant</th>
                <th>Disbursed</th>
                <th>Balance</th>
                <th>Utilization</th>
                <th>RAG</th>
                <th>Target date</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p, idx) => (
                <tr key={p.id}>
                  <td>{idx + 1}</td>
                  <td><Link href={`/partner/${p.id}`}>{p.name}</Link></td>
                  <td>{p.currency} {Number(p.grant).toLocaleString()}</td>
                  <td>{p.currency} {Number(p.disbursed).toLocaleString()}</td>
                  <td>{p.currency} {(p.grant - p.disbursed).toLocaleString()}</td>
                  <td>{utilPct(p)}%</td>
                  <td><span className={`pill ${(p.utilizationType || '').toLowerCase()}`}>{p.utilizationType}</span></td>
                  <td>{p.targetDate ? new Date(p.targetDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adding && (
        <EditPartnerModal
          partner={blankPartner()}
          isNew
          onClose={() => setAdding(false)}
          onSave={onAddSave}
        />
      )}
    </div>
  )
}

'use client'

import React, { useContext, useState } from 'react'
import Link from 'next/link'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js'
import { DataContext } from '../lib/DataProvider'

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement)

export default function Dashboard() {
  const { partners } = useContext(DataContext)
  const [filter, setFilter] = useState('All Partners')

  const labels = partners.map(p => p.name)
  const utilization = partners.map(p => Math.round((p.disbursed / p.grant) * 100))
  const colors = partners.map(p => (p.utilizationType === 'Green' ? '#2ecc71' : p.utilizationType === 'Amber' ? '#f39c12' : '#e74c3c'))

  const barData = {
    labels,
    datasets: [
      {
        label: 'Utilization %',
        data: utilization,
        backgroundColor: colors
      }
    ]
  }

  const doughnutData = {
    labels: ['Green', 'Amber', 'Red'],
    datasets: [
      {
        data: [partners.filter(p => p.utilizationType === 'Green').length, partners.filter(p => p.utilizationType === 'Amber').length, partners.filter(p => p.utilizationType === 'Red').length],
        backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c']
      }
    ]
  }

  return (
    <div>
      <div className="page-header">
        <h1>InfraTAF Impact Dashboard</h1>
        <div className="actions">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All Partners</option>
            {partners.map(p => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn green">TAF Approval</button>
          <button className="btn">Download</button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Utilization by Partner</h3>
          <Bar data={barData} />
        </div>
        <div className="card">
          <h3>Utilization RAG Status Across All Partners</h3>
          <Doughnut data={doughnutData} />
        </div>
      </div>

      <div className="table-card card">
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
            {partners.map((p, idx) => (
              <tr key={p.id}>
                <td>{idx + 1}</td>
                <td><Link href={`/partner/${p.id}`}>{p.name}</Link></td>
                <td>{p.currency} {p.grant.toLocaleString()}</td>
                <td>{p.currency} {p.disbursed.toLocaleString()}</td>
                <td>{p.currency} {(p.grant - p.disbursed).toLocaleString()}</td>
                <td>{Math.round((p.disbursed / p.grant) * 100)}%</td>
                <td><span className={`pill ${p.utilizationType.toLowerCase()}`}>{p.utilizationType}</span></td>
                <td>{new Date(p.targetDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

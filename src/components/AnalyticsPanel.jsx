// ============================================================
// AnalyticsPanel — Board analytics with recharts-style charts
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Users, Shapes, MessageSquare, TrendingUp, Activity } from 'lucide-react';

/**
 * Simple bar chart rendered with pure HTML/CSS (no recharts dependency).
 */
function SimpleBarChart({ data = [] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', padding: '8px 0' }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6366f1' }}>
            {d.value > 0 ? d.value : ''}
          </span>
          <div
            style={{
              width: '100%',
              maxWidth: '28px',
              height: `${Math.max(4, (d.value / maxVal) * 100)}%`,
              background: 'linear-gradient(180deg, #6366f1, #818cf8)',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.3s ease',
              minHeight: '4px',
            }}
          />
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = '#6366f1' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px',
        background: '#fafbfc',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color}15`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ isOpen, onClose, stats, loading }) {
  if (!isOpen) return null;

  // Build chart data from stats
  const chartData = stats?.dailyActivity
    ? stats.dailyActivity.map((d) => ({
        label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: d.count || 0,
      }))
    : Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: 0,
        };
      });

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '380px',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        animation: 'slideInRight 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="#6366f1" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Analytics
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading...
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            <StatCard icon={Users} label="Total Visits" value={stats?.totalVisits || 0} color="#3b82f6" />
            <StatCard icon={Activity} label="Active Now" value={stats?.activeUsers || 0} color="#22c55e" />
            <StatCard icon={Shapes} label="Shapes Created" value={stats?.totalShapes || 0} color="#f59e0b" />
            <StatCard icon={MessageSquare} label="Messages" value={stats?.chatMessages || 0} color="#ec4899" />
          </div>

          {/* Most active contributor */}
          {stats?.topContributor && (
            <div
              style={{
                padding: '14px',
                background: 'linear-gradient(135deg, #eef2ff, #faf5ff)',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #e0e7ff',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🏆 Most Active
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {stats.topContributor.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {stats.topContributor.count} drawing actions
              </div>
            </div>
          )}

          {/* Activity chart */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Activity (Last 7 Days)
            </h3>
            <div
              style={{
                background: '#fafbfc',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <SimpleBarChart data={chartData} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

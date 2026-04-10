// ============================================================
// Tooltip — Reusable tooltip for onboarding and more
// ============================================================

import React from 'react';

export default function Tooltip({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  isLastStep = false,
  arrowSide = null, // 'left' | 'right' | 'top' | 'bottom' | null
}) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        maxWidth: '320px',
        minWidth: '260px',
        fontFamily: "'Inter', sans-serif",
        animation: 'tooltipFadeIn 0.25s ease',
      }}
    >
      {/* Arrow */}
      {arrowSide === 'left' && (
        <div
          style={{
            position: 'absolute',
            left: '-8px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: '16px',
            height: '16px',
            background: 'white',
            boxShadow: '-2px 2px 4px rgba(0,0,0,0.08)',
          }}
        />
      )}
      {arrowSide === 'right' && (
        <div
          style={{
            position: 'absolute',
            right: '-8px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: '16px',
            height: '16px',
            background: 'white',
            boxShadow: '2px -2px 4px rgba(0,0,0,0.08)',
          }}
        />
      )}

      {/* Content */}
      <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
        {title}
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
        {description}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Progress dots */}
        {totalSteps && (
          <div style={{ display: 'flex', gap: '5px' }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === currentStep ? '#6366f1' : '#e2e8f0',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={onNext}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '10px',
            background: isLastStep
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : '#6366f1',
            color: 'white',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isLastStep ? "Let's Go! 🎉" : 'Next'}
        </button>
      </div>

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

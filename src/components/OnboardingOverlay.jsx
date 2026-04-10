// ============================================================
// OnboardingOverlay — Interactive step-by-step tutorial
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import Tooltip from './Tooltip.jsx';

/**
 * Simple confetti burst using DOM spans
 */
function Confetti({ active }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) return;

    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444'];
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 50 + (Math.random() - 0.5) * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      angle: Math.random() * 360,
      velocity: 2 + Math.random() * 4,
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);
  }, [active]);

  if (!active) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 20001, overflow: 'hidden' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall 1.5s ${p.delay}s ease-out forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(60vh) rotate(720deg) scale(0.5); }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingOverlay({
  active,
  stepData,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}) {
  const [targetRect, setTargetRect] = useState(null);
  const isLastStep = currentStep === totalSteps - 1;

  // Find target element
  useEffect(() => {
    if (!active || !stepData?.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(stepData.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        x: rect.x - 8,
        y: rect.y - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      });
    } else {
      setTargetRect(null);
    }
  }, [active, stepData]);

  if (!active) return null;

  const isCenter = !targetRect || stepData?.placement === 'center';

  return (
    <>
      <Confetti active={isLastStep} />

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20000,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Dimmed overlay with spotlight cutout */}
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.x}
                  y={targetRect.y}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#spotlight-mask)"
          />
          {/* Spotlight border glow */}
          {targetRect && (
            <rect
              x={targetRect.x}
              y={targetRect.y}
              width={targetRect.width}
              height={targetRect.height}
              rx="16"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              style={{ animation: 'spotlightPulse 2s ease infinite' }}
            />
          )}
        </svg>

        {/* Skip button */}
        <button
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            color: 'rgba(255,255,255,0.7)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            zIndex: 1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Skip Tutorial →
        </button>

        {/* Tooltip */}
        {isCenter ? (
          // Centered card
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          >
            <Tooltip
              title={stepData?.title || ''}
              description={stepData?.description || ''}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={onNext}
              isLastStep={isLastStep}
            />
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              left: targetRect ? targetRect.x + targetRect.width + 16 : '50%',
              top: targetRect ? targetRect.y + targetRect.height / 2 : '50%',
              transform: targetRect ? 'translateY(-50%)' : 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          >
            <Tooltip
              title={stepData?.title || ''}
              description={stepData?.description || ''}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={onNext}
              isLastStep={isLastStep}
              arrowSide="left"
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spotlightPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

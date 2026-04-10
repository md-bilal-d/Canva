// ============================================================
// ConnectorLayer — Konva Layer for flowchart connectors/arrows
// ============================================================

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Layer, Arrow, Circle, Text, Group, Line } from 'react-konva';
import { Html } from 'react-konva-utils';
import { computeConnectorPoints, getShapeEdgePoints } from '../hooks/useConnectors';

export default function ConnectorLayer({
  connectors,
  shapes,
  connectionMode,
  stageScale,
  onAddConnector,
  onRemoveConnector,
  onUpdateConnector,
  color = '#6366f1',
}) {
  const [hoveredShapeId, setHoveredShapeId] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null); // { shapeId, point }
  const [dragPos, setDragPos] = useState(null);
  const [editingConnectorId, setEditingConnectorId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Rendered connectors with computed bezier points
  const renderedConnectors = useMemo(() => {
    return Object.values(connectors).map((conn) => {
      const fromShape = shapes[conn.fromShapeId];
      const toShape = shapes[conn.toShapeId];
      if (!fromShape || !toShape) return null;

      const pts = computeConnectorPoints(fromShape, toShape);
      if (!pts) return null;

      return { ...conn, computedPoints: pts };
    }).filter(Boolean);
  }, [connectors, shapes]);

  // Edge dots for hovered shape
  const edgeDots = useMemo(() => {
    if (!connectionMode || !hoveredShapeId) return [];
    const shape = shapes[hoveredShapeId];
    return getShapeEdgePoints(shape);
  }, [connectionMode, hoveredShapeId, shapes]);

  const handleEdgeDotClick = useCallback((shapeId, point) => {
    if (!connectingFrom) {
      // Start connection
      setConnectingFrom({ shapeId, point });
    } else {
      // Finish connection — create connector
      if (connectingFrom.shapeId !== shapeId) {
        onAddConnector?.({
          fromShapeId: connectingFrom.shapeId,
          toShapeId: shapeId,
          fromPoint: connectingFrom.point,
          toPoint: point,
          color,
          label: '',
        });
      }
      setConnectingFrom(null);
      setDragPos(null);
    }
  }, [connectingFrom, onAddConnector, color]);

  const handleStageMouseMove = useCallback((e) => {
    if (!connectionMode) return;

    const stage = e.target.getStage();
    const pos = stage.getRelativePointerPosition();

    if (connectingFrom && pos) {
      setDragPos(pos);
    }

    // Check which shape we're hovering over
    const target = e.target;
    const id = target?.id?.();
    if (id && shapes[id]) {
      setHoveredShapeId(id);
    }
  }, [connectionMode, connectingFrom, shapes]);

  const handleConnectorDblClick = useCallback((connId, conn) => {
    setEditingConnectorId(connId);
    setEditingLabel(conn.label || '');
  }, []);

  const handleSaveLabel = useCallback(() => {
    if (editingConnectorId) {
      onUpdateConnector?.(editingConnectorId, { label: editingLabel });
      setEditingConnectorId(null);
      setEditingLabel('');
    }
  }, [editingConnectorId, editingLabel, onUpdateConnector]);

  return (
    <>
      <Layer name="connector-layer" listening={connectionMode}>
        {/* Rendered connectors */}
        {renderedConnectors.map((conn) => {
          const pts = conn.computedPoints;
          return (
            <Group key={conn.id}>
              <Arrow
                points={pts.points}
                stroke={conn.color || '#6366f1'}
                strokeWidth={2.5}
                fill={conn.color || '#6366f1'}
                pointerLength={10}
                pointerWidth={8}
                tension={0}
                bezier={true}
                hitStrokeWidth={12}
                onDblClick={() => handleConnectorDblClick(conn.id, conn)}
              />
              {/* Connector label */}
              {conn.label && (
                <Text
                  x={(pts.from.x + pts.to.x) / 2}
                  y={(pts.from.y + pts.to.y) / 2 - 12}
                  text={conn.label}
                  fontSize={12}
                  fill={conn.color || '#6366f1'}
                  fontFamily="Inter, sans-serif"
                  fontStyle="600"
                  align="center"
                  offsetX={conn.label.length * 3}
                  listening={false}
                />
              )}
            </Group>
          );
        })}

        {/* Connection dots on hovered shape edges */}
        {connectionMode && edgeDots.map((dot, i) => (
          <Circle
            key={`dot-${hoveredShapeId}-${i}`}
            x={dot.x}
            y={dot.y}
            radius={6 / stageScale}
            fill="#22c55e"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            hitStrokeWidth={16 / stageScale}
            style={{ cursor: 'pointer' }}
            onClick={() => handleEdgeDotClick(hoveredShapeId, dot)}
            onTap={() => handleEdgeDotClick(hoveredShapeId, dot)}
          />
        ))}

        {/* Drag line while connecting */}
        {connectingFrom && dragPos && (
          <Line
            points={[
              connectingFrom.point.x,
              connectingFrom.point.y,
              dragPos.x,
              dragPos.y,
            ]}
            stroke={color}
            strokeWidth={2}
            dash={[8, 4]}
            listening={false}
          />
        )}
      </Layer>

      {/* Label editing overlay */}
      {editingConnectorId && (
        <Layer>
          <Html>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.15)',
                zIndex: 3000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={handleSaveLabel}
            >
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '260px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Connector Label
                </span>
                <input
                  autoFocus
                  type="text"
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLabel();
                    if (e.key === 'Escape') setEditingConnectorId(null);
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="Enter label..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => setEditingConnectorId(null)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLabel}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#6366f1',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </Html>
        </Layer>
      )}
    </>
  );
}

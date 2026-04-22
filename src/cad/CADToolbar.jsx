// CADToolbar.jsx — Floating left-side vertical icon toolbar
import React, { useState } from 'react';
import {
  MousePointer2, Move, RotateCw, Maximize2, FlipHorizontal,
  Minus, Spline, Square, Circle, Compass, Hexagon, Type,
  Scissors, ArrowUpRight, CopyMinus, CornerDownRight, Pentagon,
  Grid3X3, Zap, Ruler,
  Triangle, ArrowRight,
  PenLine, Slash, PaintBucket
} from 'lucide-react';

const iconMap = {
  select: MousePointer2,
  move: Move,
  rotate: RotateCw,
  scale: Maximize2,
  mirror: FlipHorizontal,
  line: Minus,
  polyline: Spline,
  rectangle: Square,
  circle: Circle,
  arc: Compass,
  polygon: Hexagon,
  text: Type,
  trim: Scissors,
  extend: ArrowUpRight,
  offset: CopyMinus,
  fillet: CornerDownRight,
  chamfer: Pentagon,
  array: Grid3X3,
  explode: Zap,
  dim_linear: Ruler,
  dim_aligned: Ruler,
  dim_radius: Compass,
  dim_diameter: Circle,
  dim_angle: Triangle,
  leader: ArrowRight,
  centerline: Slash,
  hatch: PaintBucket,
};

const toolGroups = [
  {
    label: 'SELECT',
    tools: [
      { id: 'select', label: 'Select' },
      { id: 'move', label: 'Move' },
      { id: 'rotate', label: 'Rotate' },
      { id: 'scale', label: 'Scale' },
      { id: 'mirror', label: 'Mirror' },
    ],
  },
  {
    label: 'DRAW',
    tools: [
      { id: 'line', label: 'Line' },
      { id: 'polyline', label: 'Polyline' },
      { id: 'rectangle', label: 'Rectangle' },
      { id: 'circle', label: 'Circle' },
      { id: 'arc', label: 'Arc' },
      { id: 'polygon', label: 'Polygon' },
      { id: 'text', label: 'Text' },
    ],
  },
  {
    label: 'MODIFY',
    tools: [
      { id: 'trim', label: 'Trim' },
      { id: 'extend', label: 'Extend' },
      { id: 'offset', label: 'Offset' },
      { id: 'fillet', label: 'Fillet' },
      { id: 'chamfer', label: 'Chamfer' },
      { id: 'array', label: 'Array' },
      { id: 'explode', label: 'Explode' },
    ],
  },
  {
    label: 'DIMENSION',
    tools: [
      { id: 'dim_linear', label: 'Linear Dim' },
      { id: 'dim_aligned', label: 'Aligned Dim' },
      { id: 'dim_radius', label: 'Radius Dim' },
      { id: 'dim_diameter', label: 'Diameter Dim' },
      { id: 'dim_angle', label: 'Angle Dim' },
    ],
  },
  {
    label: 'ANNOTATE',
    tools: [
      { id: 'leader', label: 'Leader Line' },
      { id: 'centerline', label: 'Centerline' },
      { id: 'hatch', label: 'Hatch Fill' },
    ],
  },
];

export default function CADToolbar({ activeTool, onToolChange }) {
  const [hoveredTool, setHoveredTool] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (label) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div style={styles.container}>
      {toolGroups.map((group) => (
        <div key={group.label} style={styles.group}>
          <div
            style={styles.groupLabel}
            onClick={() => toggleGroup(group.label)}
          >
            <span style={styles.groupLabelText}>{group.label}</span>
            <span style={{
              ...styles.groupChevron,
              transform: collapsedGroups[group.label] ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}>▾</span>
          </div>
          {!collapsedGroups[group.label] && group.tools.map((tool) => {
            const isActive = activeTool === tool.id;
            const isHovered = hoveredTool === tool.id;
            const IconComp = iconMap[tool.id] || MousePointer2;

            return (
              <div
                key={tool.id}
                style={{
                  ...styles.toolButton,
                  ...(isActive ? styles.toolButtonActive : {}),
                  ...(isHovered && !isActive ? styles.toolButtonHover : {}),
                }}
                onClick={() => onToolChange(tool.id)}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
                title={tool.label}
              >
                <IconComp size={18} strokeWidth={1.5} />
                {isHovered && (
                  <div style={styles.tooltip}>
                    {tool.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 48,
    left: 0,
    width: 52,
    bottom: 32,
    backgroundColor: '#161b22',
    borderRight: '1px solid #30363d',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    zIndex: 100,
    scrollbarWidth: 'thin',
    scrollbarColor: '#30363d #161b22',
    paddingBottom: 8,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  groupLabel: {
    width: '100%',
    padding: '6px 6px 3px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
  },
  groupLabelText: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#484f58',
    fontFamily: '"JetBrains Mono", monospace',
  },
  groupChevron: {
    fontSize: 9,
    color: '#484f58',
    transition: 'transform 0.15s ease',
  },
  toolButton: {
    position: 'relative',
    width: 40,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#8b949e',
    borderRadius: 6,
    margin: '1px 0',
    transition: 'all 0.12s ease',
  },
  toolButtonActive: {
    backgroundColor: '#58a6ff22',
    color: '#58a6ff',
    boxShadow: 'inset 3px 0 0 #58a6ff',
  },
  toolButtonHover: {
    backgroundColor: '#1e2730',
    color: '#e6edf3',
  },
  tooltip: {
    position: 'absolute',
    left: 50,
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#1c2128',
    color: '#e6edf3',
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: '"Inter", sans-serif',
    whiteSpace: 'nowrap',
    border: '1px solid #30363d',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    zIndex: 200,
    pointerEvents: 'none',
  },
};

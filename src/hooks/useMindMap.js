import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';

export default function useMindMap(ydoc, shapeId) {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (!ydoc || !shapeId) return;

    const yMindMap = ydoc.getMap(`mindmap-${shapeId}`);
    
    // Initialize if empty
    if (yMindMap.size === 0) {
        const rootId = 'root';
        const rootNode = {
            id: rootId,
            text: 'Main Idea',
            x: 0,
            y: 0,
            color: '#6366f1',
            isRoot: true
        };
        ydoc.transact(() => {
            yMindMap.set(rootId, rootNode);
            yMindMap.set('connections', []);
        });
    }

    const updateState = () => {
        const nodesList = [];
        const connList = yMindMap.get('connections') || [];
        
        yMindMap.forEach((val, key) => {
            if (key !== 'connections') {
                nodesList.push(val);
            }
        });
        
        setNodes(nodesList);
        setConnections(connList);
    };

    yMindMap.observeDeep(updateState);
    updateState();

    return () => yMindMap.unobserveDeep(updateState);
  }, [ydoc, shapeId]);

  const addNode = useCallback((parentId, text = 'New Idea') => {
    const yMindMap = ydoc.getMap(`mindmap-${shapeId}`);
    const parentNode = yMindMap.get(parentId);
    if (!parentNode) return;

    const id = 'node-' + Date.now();
    // Position it somewhat away from parent
    const angle = Math.random() * Math.PI * 2;
    const dist = 150;
    
    const newNode = {
        id,
        text,
        x: parentNode.x + Math.cos(angle) * dist,
        y: parentNode.y + Math.sin(angle) * dist,
        color: '#10b981'
    };

    const currentConnections = yMindMap.get('connections') || [];

    ydoc.transact(() => {
        yMindMap.set(id, newNode);
        yMindMap.set('connections', [...currentConnections, { from: parentId, to: id }]);
    });
  }, [ydoc, shapeId]);

  const updateNode = useCallback((id, updates) => {
    const yMindMap = ydoc.getMap(`mindmap-${shapeId}`);
    const existing = yMindMap.get(id);
    if (existing) {
        yMindMap.set(id, { ...existing, ...updates });
    }
  }, [ydoc, shapeId]);

  const deleteNode = useCallback((id) => {
    const yMindMap = ydoc.getMap(`mindmap-${shapeId}`);
    const node = yMindMap.get(id);
    if (!node || node.isRoot) return;

    const currentConnections = yMindMap.get('connections') || [];
    const filteredConnections = currentConnections.filter(c => c.from !== id && c.to !== id);

    ydoc.transact(() => {
        yMindMap.delete(id);
        yMindMap.set('connections', filteredConnections);
    });
  }, [ydoc, shapeId]);

  return { nodes, connections, addNode, updateNode, deleteNode };
}

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, X } from 'lucide-react';

export default function ChartWidget({ shapeId, ydoc, initialData }) {
    const [isEditing, setIsEditing] = useState(false);
    const [rawData, setRawData] = useState(JSON.stringify(initialData || [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 }
    ], null, 2));
    
    let data = [];
    try {
        data = JSON.parse(rawData);
    } catch(e) {
        // invalid json
    }

    const handleSave = () => {
        if (!ydoc) return;
        const yShapes = ydoc.getMap('shapes');
        const shape = yShapes.get(shapeId);
        if (shape) {
            yShapes.doc.transact(() => {
                yShapes.set(shapeId, { ...shape, chartData: rawData });
            }, 'local');
        }
        setIsEditing(false);
    };

    return (
        <div 
            className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging board when interacting
            style={{ pointerEvents: 'auto' }}
        >
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-100 cursor-move" onPointerDown={e => e.preventDefault() /* allow konva to drag */}>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    📊 Live Data Chart
                </span>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500"
                    title="Edit Data"
                >
                    <Settings size={14} />
                </button>
            </div>
            
            <div className="flex-1 p-4 relative">
                {isEditing ? (
                    <div className="absolute inset-0 bg-white z-10 flex flex-col p-2">
                        <textarea 
                            className="flex-1 text-xs font-mono p-2 border rounded resize-none"
                            value={rawData}
                            onChange={(e) => setRawData(e.target.value)}
                        />
                        <button 
                            onClick={handleSave}
                            className="mt-2 w-full py-1 bg-indigo-600 text-white rounded text-xs font-semibold"
                        >
                            Save Data
                        </button>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

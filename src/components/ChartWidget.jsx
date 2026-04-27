import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Settings, X, Upload, FileJson, Table } from 'lucide-react';

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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            if (file.name.endsWith('.csv')) {
                // Simple CSV to JSON parser
                const lines = content.split('\n');
                const headers = lines[0].split(',');
                const result = lines.slice(1).map(line => {
                    const obj = {};
                    const currentLine = line.split(',');
                    headers.forEach((header, i) => {
                        obj[header.trim()] = isNaN(currentLine[i]) ? currentLine[i]?.trim() : Number(currentLine[i]);
                    });
                    return obj;
                }).filter(o => o.name || Object.keys(o).length > 0);
                setRawData(JSON.stringify(result, null, 2));
            } else {
                setRawData(content);
            }
        };
        reader.readAsText(file);
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
                    <div className="absolute inset-0 bg-white z-10 flex flex-col p-4 gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">JSON DATA</label>
                             <textarea 
                                className="flex-1 text-xs font-mono p-3 border rounded-xl resize-none bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={rawData}
                                onChange={(e) => setRawData(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition">
                                <Upload size={14} /> Upload CSV/JSON
                                <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} />
                            </label>
                            <button 
                                onClick={handleSave}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
                            >
                                Save Data
                            </button>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {data.length > 0 && Object.keys(data[0]).length > 2 ? (
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff' }} />
                            </LineChart>
                        ) : (
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

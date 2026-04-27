import React, { useState, useEffect } from 'react';
import { Palette, X, Plus, Trash2, Check, Type, Image as ImageIcon } from 'lucide-react';

export default function BrandKitSidebar({ isOpen, onClose, ydoc }) {
    const [brandKit, setBrandKit] = useState({
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
        fonts: ['Inter', 'Roboto', 'Outfit'],
        logos: []
    });

    const yBrandKitRef = React.useRef(null);

    useEffect(() => {
        if (!ydoc) return;
        const yMap = ydoc.getMap('brandKit');
        yBrandKitRef.current = yMap;

        const observe = () => {
            const colors = yMap.get('colors') || ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];
            const fonts = yMap.get('fonts') || ['Inter', 'Roboto', 'Outfit'];
            const logos = yMap.get('logos') || [];
            setBrandKit({ colors, fonts, logos });
        };

        yMap.observe(observe);
        observe();

        return () => yMap.unobserve(observe);
    }, [ydoc]);

    const addColor = (color) => {
        const newColors = [...brandKit.colors, color];
        yBrandKitRef.current.set('colors', newColors);
    };

    const removeColor = (index) => {
        const newColors = brandKit.colors.filter((_, i) => i !== index);
        yBrandKitRef.current.set('colors', newColors);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-6 top-6 w-72 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-[1001] flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Palette size={18} className="text-indigo-600" />
                    Brand Kit
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition">
                    <X size={18} />
                </button>
            </div>

            <div className="p-4 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
                {/* Colors Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand Colors</span>
                        <label className="p-1 bg-indigo-50 text-indigo-600 rounded-md cursor-pointer hover:bg-indigo-100 transition">
                            <Plus size={14} />
                            <input type="color" className="hidden" onChange={(e) => addColor(e.target.value)} />
                        </label>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {brandKit.colors.map((color, i) => (
                            <div key={i} className="group relative">
                                <div 
                                    className="w-full aspect-square rounded-lg shadow-sm border border-gray-100 cursor-pointer"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                                <button 
                                    onClick={() => removeColor(i)}
                                    className="absolute -top-1 -right-1 bg-white shadow-md text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Typography Section */}
                <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Typography</span>
                    <div className="flex flex-col gap-2">
                        {brandKit.fonts.map((font, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span style={{ fontFamily: font }} className="text-sm font-medium">{font}</span>
                                <Check size={14} className="text-indigo-500" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Assets Section */}
                <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand Assets</span>
                    <div className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition cursor-pointer">
                        <ImageIcon size={24} />
                        <span className="text-[10px] font-bold">Drop Logos Here</span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-indigo-600 text-white text-center">
                <p className="text-[10px] font-bold opacity-80 mb-1">TEAM SYNC ACTIVE</p>
                <p className="text-[11px]">Changes apply to everyone in this room.</p>
            </div>
        </div>
    );
}

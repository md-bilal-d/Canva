import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuestBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  
  if (!isVisible) return null;
  
  return (
    <div className="bg-indigo-600 px-4 py-2 flex items-center justify-center text-white text-sm relative z-50">
      <div className="text-center w-full pr-8">
        <strong>You are in Guest Mode</strong> — your work won't be saved. Sign up to keep your boards.
        <button 
          onClick={() => navigate('/login')}
          className="ml-4 bg-white text-indigo-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
        >
          Sign Up
        </button>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 text-white/80 hover:text-white transition-colors focus:outline-none"
        aria-label="Dismiss banner"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  );
}

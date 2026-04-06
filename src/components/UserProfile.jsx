import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { Edit2, Check } from 'lucide-react';

export const UserProfile = ({ provider, isVisible, onClose }) => {
  const { profile, updateName, loading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!isVisible || loading || !profile) return null;

  const handleEditClick = () => {
    setEditName(profile.displayName);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editName.trim() && editName.trim() !== profile.displayName) {
      const newName = editName.trim();
      await updateName(newName);
      
      // Sync updated name to Yjs Awareness immediately after save
      if (provider && provider.awareness) {
         provider.awareness.setLocalStateField('user', {
             ...provider.awareness.getLocalState()?.user,
             name: newName
         });
      }
    }
    setIsEditing(false);
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';
  
  const getAvatarBg = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };
  
  const userId = profile.id || profile.email || 'default';

  return (
    <div className="absolute top-16 right-4 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-200 origin-top-right">
      <div className="p-5 flex flex-col items-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4"
          style={{ 
             backgroundColor: profile.avatarUrl ? 'transparent' : getAvatarBg(userId),
             backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : 'none',
             backgroundSize: 'cover'
          }}
        >
          {!profile.avatarUrl && getInitials(profile.displayName)}
        </div>
        
        {isEditing ? (
          <div className="flex items-center w-full bg-gray-50 rounded-lg px-3 py-2 mb-2 border-2 border-blue-100 focus-within:border-blue-500 transition-colors">
             <input 
               type="text" 
               className="w-full bg-transparent outline-none text-sm font-semibold text-gray-800"
               value={editName}
               onChange={(e) => setEditName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSave()}
               autoFocus
             />
             <button onClick={handleSave} className="text-blue-500 hover:text-blue-600 p-1 bg-blue-50 rounded-md">
               <Check size={16} />
             </button>
          </div>
        ) : (
          <div className="flex items-center justify-center group mb-2 cursor-pointer w-full hover:bg-gray-50 rounded-lg py-1 px-2" onClick={handleEditClick}>
             <h3 className="text-lg font-bold text-gray-800 mr-2 truncate">{profile.displayName}</h3>
             <Edit2 size={14} className="text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        <div className="text-xs text-gray-500 font-medium mb-5 truncate w-full text-center">
          {profile.email}
        </div>

        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Boards created</span>
            <span className="text-sm font-bold text-slate-700 bg-white px-2 py-1 rounded shadow-sm">
              {profile.boardsCreated}
            </span>
          </div>
        </div>

        <button 
           onClick={onClose}
           className="mt-5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
        >
          Close Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfile;

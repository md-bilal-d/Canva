import React from 'react';

export const AvatarStack = ({ users, onAvatarClick, maxSize = 5 }) => {
  if (!users || users.length === 0) return null;

  const visibleUsers = users.slice(0, maxSize);
  const overflow = users.length - maxSize;

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const getAvatarBg = (id) => {
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  return (
    <div className="flex items-center -space-x-3 pr-2">
      {visibleUsers.map((user, index) => {
        // Fallback to clientID or index if no specific user id
        const uniqueId = String(user.id || user.clientId || index);
        const name = user.name || 'Anonymous';
        const color = getAvatarBg(uniqueId);
        
        return (
          <div 
            key={user.clientId || index} 
            className="group relative"
            style={{ zIndex: maxSize - index }}
            onClick={() => onAvatarClick && onAvatarClick(user)}
          >
            <div 
               className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold text-white shadow-md cursor-pointer hover:-translate-y-1 transition-transform bg-white"
               style={{ 
                 backgroundColor: user.avatarUrl ? 'transparent' : color,
                 backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
                 backgroundSize: 'cover'
               }}
            >
              {!user.avatarUrl && getInitials(name)}
            </div>
            
            {/* Hover Tooltip */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
               {name} {user.isPresenter && " (Presenting)"}
               <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-700"></div>
            </div>

            {/* Live Presenting Badge */}
            {user.isPresenter && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse z-50 shadow-sm" title="Presenting Live" />
            )}
          </div>
        );
      })}
      
      {overflow > 0 && (
        <div 
          className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-md z-0 hover:bg-slate-200 transition-colors cursor-default"
          title={`+${overflow} more users`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default AvatarStack;

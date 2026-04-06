import { useState, useEffect } from 'react';
import { stitchClient } from '../StitchClient.js';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read user from stitchClient and localStorage
    const fetchUser = async () => {
      // Simulate network request loading time if needed, but currentUser is synchronous
      const user = stitchClient.currentUser;
      const savedProfiles = JSON.parse(localStorage.getItem('stitch_user_metadata') || '{}');
      
      if (user) {
        const userMeta = savedProfiles[user.id] || {};
        setProfile({
          id: user.id,
          displayName: userMeta.displayName || user.email?.split('@')[0] || 'Anonymous',
          avatarUrl: userMeta.avatarUrl || null,
          email: user.email,
          boardsCreated: userMeta.boardsCreated || 0,
        });
      }
      setLoading(false);
    };
    
    fetchUser();
  }, []);

  const updateName = async (newName) => {
    if (!stitchClient.currentUser) return;
    const userId = stitchClient.currentUser.id;
    
    // Simulating saving updated name to Stitch user metadata
    const allProfiles = JSON.parse(localStorage.getItem('stitch_user_metadata') || '{}');
    const userProfile = allProfiles[userId] || {};
    userProfile.displayName = newName;
    allProfiles[userId] = userProfile;
    localStorage.setItem('stitch_user_metadata', JSON.stringify(allProfiles));
    
    setProfile(prev => prev ? { ...prev, displayName: newName } : null);
  };

  const updateAvatar = async (newAvatarUrl) => {
    if (!stitchClient.currentUser) return;
    const userId = stitchClient.currentUser.id;
    
    // Simulating saving updated avatar to Stitch user metadata
    const allProfiles = JSON.parse(localStorage.getItem('stitch_user_metadata') || '{}');
    const userProfile = allProfiles[userId] || {};
    userProfile.avatarUrl = newAvatarUrl;
    allProfiles[userId] = userProfile;
    localStorage.setItem('stitch_user_metadata', JSON.stringify(allProfiles));
    
    setProfile(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);
  };

  return { profile, updateName, updateAvatar, loading };
};

export default useUserProfile;

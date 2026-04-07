import { useAuth } from '../AuthContext';

export default function useCurrentUser() {
  const { user } = useAuth();
  
  if (user) {
    return user;
  }
  
  if (sessionStorage.getItem('isGuest') === 'true') {
    return {
      id: sessionStorage.getItem('guestId') || 'guest-xxx',
      name: sessionStorage.getItem('guestName') || 'Guest-1234',
      isGuest: true
    };
  }
  
  return null;
}

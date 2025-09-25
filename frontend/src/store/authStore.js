import create from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userId: null,
      role: null,
      isAuthenticated: false,
      
      // Login action
      login: (token, userId, role) => set({
        token,
        userId,
        role,
        isAuthenticated: true,
      }),
      
      // Logout action
      logout: () => set({
        token: null,
        userId: null,
        role: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      getStorage: () => localStorage, // storage to use
    }
  )
);

export default useAuthStore;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../config/supabase';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,
      error: null,

      // Initialize auth state from Supabase
      initAuth: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          set({
            session,
            user: session?.user || null,
            loading: false,
          });

          // Fetch profile if user exists
          if (session?.user) {
            get().fetchProfile(session.user.id);
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange((_event, session) => {
            set({
              session,
              user: session?.user || null,
            });
            if (session?.user) {
              get().fetchProfile(session.user.id);
            } else {
              set({ profile: null });
            }
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Sync user to backend users table
      syncUser: async (name, role) => {
        try {
          await api.post('/auth/sync', { name, role });
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      },

      // Fetch user profile
      fetchProfile: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) {
            // If table doesn't exist or profile not found, use user metadata
            const user = get().user;
            set({ 
              profile: { 
                id: userId,
                name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
                email: user?.email,
                role: user?.user_metadata?.role || 'student' 
              } 
            });
            return;
          }
          set({ profile: data });
        } catch (error) {
          console.error('Error fetching profile:', error);
          // Set profile from user metadata as fallback
          const user = get().user;
          set({ 
            profile: { 
              id: userId,
              name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
              email: user?.email,
              role: user?.user_metadata?.role || 'student' 
            } 
          });
        }
      },

      // Sign up with email and password
      signUp: async (email, password, metadata = {}) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata, // { name, role: 'teacher' | 'student' }
            },
          });
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            profile: { ...metadata, email },
            loading: false,
          });

          // Sync user to backend users table
          if (data.session) {
            await get().syncUser(metadata.name, metadata.role);
          }
          
          return true;
        } catch (error) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      // Sign in with email and password
      signIn: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            loading: false,
          });

          // Sync user to backend (in case they signed up before sync was implemented)
          if (data.user) {
            await get().syncUser(
              data.user.user_metadata?.name, 
              data.user.user_metadata?.role
            );
            await get().fetchProfile(data.user.id);
          }
          
          return true;
        } catch (error) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      // Sign out
      signOut: async () => {
        set({ loading: true });
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            profile: null,
            loading: false,
          });
          return true;
        } catch (error) {
          set({ error: error.message, loading: false });
          return false;
        }
      },

      // Get access token for API calls
      getToken: () => {
        const { session } = get();
        return session?.access_token || null;
      },

      // Check if user is authenticated
      isAuthenticated: () => {
        const { session } = get();
        return !!session;
      },

      // Get user role
      getRole: () => {
        const { profile, user } = get();
        return profile?.role || user?.user_metadata?.role || 'student';
      },

      // Check if user is teacher
      isTeacher: () => {
        return get().getRole() === 'teacher';
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session,
        profile: state.profile
      }),
    }
  )
);

export default useAuthStore;

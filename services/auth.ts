import { supabase } from './supabase';

/**
 * Authentication Service
 * Handles Email/Password, Magic Link (OTP), and Google OAuth.
 * All sessions are synchronized via Supabase SSR logic.
 */
export const authService = {
  // Standard Signup
  signUp: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: name
        }
      }
    });
    if (error) throw error;
    return data;
  },

  // Standard Password Login
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Resend Verification Email
  resendVerification: async (email: string, name?: string) => {
    // For users created via OTP/Magic Link, we resend via OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: name ? { full_name: name } : undefined
      }
    });
    if (error) throw error;
  },

  // Stealth Access: Email-only login via Magic Link
  signInWithOtp: async (email: string, name?: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: name ? { full_name: name } : undefined
      }
    });
    if (error) throw error;
    return data;
  },

  // Single Sign-On via Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`, 
      }
    });
    if (error) throw error;
    return data;
  },

  // Terminate current session
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Sends password reset email
  resetPasswordForEmail: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    if (error) throw error;
  },

  // Updates password for currently authenticated user
  updateUserPassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  // Simple getter for current session state
  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // Real-time listener for login/logout events
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

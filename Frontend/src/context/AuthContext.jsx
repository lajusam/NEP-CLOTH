import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { fetchMe } from "../lib/api";

const AuthContext = createContext(null);
const profileCache = new Map();
const profileRequests = new Map();

function fetchProfileCached(userId) {
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.at < 60_000) return Promise.resolve(cached.value);
  if (profileRequests.has(userId)) return profileRequests.get(userId);
  const request = fetchMe().then((value) => {
    profileCache.set(userId, { value, at: Date.now() });
    return value;
  }).finally(() => profileRequests.delete(userId));
  profileRequests.set(userId, request);
  return request;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh profile from backend GET /auth/me
  const refreshProfile = useCallback(async () => {
    try {
      const data = user?.id ? await fetchProfileCached(user.id) : await fetchMe();
      setProfile(data);
      return data;
    } catch (err) {
      console.warn("Could not fetch user profile from /auth/me:", err?.message || err);
      setProfile(null);
      return null;
    }
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // 1. Initial session check
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const data = await fetchProfileCached(session.user.id);
            if (mounted) setProfile(data);
          } catch (err) {
            if (mounted) setProfile(null);
          }
        } else {
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    // 2. Listen to auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const data = await fetchProfileCached(session.user.id);
          if (mounted) setProfile(data);
        } catch (err) {
          if (mounted) setProfile(null);
        }
      } else {
        if (mounted) setProfile(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email, password, and name (never allow client-specified role)
  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });
    if (error) throw error;
    return data;
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Immediately fetch profile after sign-in
    try {
      const prof = await fetchProfileCached(data.user.id);
      setProfile(prof);
    } catch {
      // Backend upserts profile on requireAuth
    }

    return data;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    if (error) throw error;
  };

  // Send password reset email
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    profile,
    role: profile?.role || null,
    isAdmin: profile?.role === "admin",
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

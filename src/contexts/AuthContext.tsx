import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { notifyBpcSubmissionFn } from "@/lib/backend.functions";

interface Profile {
  fullName: string;
  email: string;
  phone: string;
  balance: number;
  referralId: string;
}


interface BpcStatus {
  status: "none" | "pending" | "approved" | "declined";
}

export type KycStatus = "not_verified" | "pending" | "verified" | "failed";

export interface KycState {
  tier: 0 | 1 | 2;
  nin: KycStatus;
  bvn: KycStatus;
  face: KycStatus;
  ninVerifiedAt: string | null;
  bvnVerifiedAt: string | null;
}

const EMPTY_KYC: KycState = {
  tier: 0,
  nin: "not_verified",
  bvn: "not_verified",
  face: "not_verified",
  ninVerifiedAt: null,
  bvnVerifiedAt: null,
};

interface AuthContextType {
  user: (Profile & BpcStatus) | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  submitBPCProof: (proofUrl: string) => Promise<string | null>;
  refreshBpcStatus: () => Promise<void>;
  kyc: KycState;
  refreshKyc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<(Profile & BpcStatus) | null>(null);
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycState>(EMPTY_KYC);

  const fetchProfile = async (uid: string, email: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .single();

    const { data: bpcSub } = await supabase
      .from("bpc_submissions")
      .select("status")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const bpcStatus: "none" | "pending" | "approved" | "declined" =
      bpcSub ? (bpcSub.status as any) : "none";

    setKyc({
      tier: ((profile as any)?.verification_tier ?? 0) as 0 | 1 | 2,
      nin: ((profile as any)?.nin_verification_status ?? "not_verified") as KycStatus,
      bvn: ((profile as any)?.bvn_verification_status ?? "not_verified") as KycStatus,
      face: ((profile as any)?.face_verification_status ?? "not_verified") as KycStatus,
      ninVerifiedAt: (profile as any)?.nin_verified_at ?? null,
      bvnVerifiedAt: (profile as any)?.bvn_verified_at ?? null,
    });

    setUser({
      fullName: profile?.full_name || "",
      email,
      phone: profile?.phone || "",
      balance: Number(profile?.balance || 200000),
      status: bpcStatus,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchProfile(session.user.id, session.user.email || "");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || "");
      } else {
        setUser(null);
        setKyc(EMPTY_KYC);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  };

  const register = async (fullName: string, email: string, phone: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) return error.message;
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return error.message;
    return null;
  };

  const submitBPCProof = async (proofUrl: string): Promise<string | null> => {
    if (!supabaseUser) return "Not authenticated";

    const { data, error } = await supabase
      .from("bpc_submissions")
      .insert({ user_id: supabaseUser.id, proof_url: proofUrl })
      .select()
      .single();

    if (error) return error.message;

    // Notify admin via edge function
    try {
      await notifyBpcSubmissionFn({ data: { submissionId: data.id } });
    } catch (e) {
      console.error("Failed to notify admin:", e);
    }

    // Refresh status
    await refreshBpcStatus();
    return null;
  };

  const refreshBpcStatus = async () => {
    if (supabaseUser) {
      await fetchProfile(supabaseUser.id, supabaseUser.email || "");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, supabaseUser, loading, login, register, logout, resetPassword, submitBPCProof, refreshBpcStatus, kyc, refreshKyc: refreshBpcStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    { name: "cinepass-auth" }
  )
);

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { User, WorkItem } from "../types";
import { mapItem, mapUser } from "../utils";

// Centraliza autenticação, carregamento de dados e sincronização
// em tempo real do app.
export function usePreceptorData() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  const refreshItems = useCallback(async () => {
    const { data } = await supabase
      .from("work_items")
      .select("*")
      .order("date")
      .order("time");
    if (data) setItems(data.map(mapItem));
  }, []);

  const refreshUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setAllUsers(data.map(mapUser));
  }, []);

  const loadUserAndData = useCallback(async (userId: string) => {
    setLoading(true);
    const [profileRes, usersRes, itemsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("profiles").select("*"),
      supabase.from("work_items").select("*").order("date").order("time"),
    ]);
    if (profileRes.data) setCurrentUser(mapUser(profileRes.data));
    if (usersRes.data) setAllUsers(usersRes.data.map(mapUser));
    if (itemsRes.data) setItems(itemsRes.data.map(mapItem));
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserAndData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        setLoading(false);
        return;
      }
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        loadUserAndData(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setAllUsers([]);
        setItems([]);
        setRecovery(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserAndData]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel("preceptor-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_items" },
        () => {
          refreshItems();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          refreshUsers();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, refreshItems, refreshUsers]);

  async function logout() {
    await supabase.auth.signOut();
  }

  return {
    currentUser,
    allUsers,
    items,
    loading,
    recovery,
    refreshItems,
    refreshUsers,
    logout,
  };
}

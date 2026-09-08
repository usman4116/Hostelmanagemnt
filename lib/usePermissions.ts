"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  canAccessRoute,
  canViewRevenue,
  hasPermission,
  isSuperAdmin,
  type PermissionId,
} from "@/lib/permissions";

export type StaffProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  permissions: string[];
};

export function usePermissions() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData.user?.email;
      if (!email) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("staff_users")
        .select("id, email, full_name, phone, role, status, permissions")
        .ilike("email", email)
        .maybeSingle();

      if (data) {
        const rawPermissions = data.permissions;
        const parsedPermissions: string[] = Array.isArray(rawPermissions)
          ? rawPermissions
          : typeof rawPermissions === "string"
          ? JSON.parse(rawPermissions || "[]")
          : [];

        setProfile({
          id: String(data.id),
          email: String(data.email),
          full_name: data.full_name ? String(data.full_name) : null,
          phone: data.phone ? String(data.phone) : null,
          role: String(data.role || "Staff"),
          status: String(data.status || "Active"),
          permissions: parsedPermissions,
        });
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const userRole = profile?.role ?? "";
  const userPermissions = profile?.permissions ?? [];
  const superAdmin = isSuperAdmin(userRole);

  const checkPermission = useCallback(
    (permissionId: string) => {
      return hasPermission(userRole, userPermissions, permissionId);
    },
    [userRole, userPermissions],
  );

  const checkRouteAccess = useCallback(
    (pathname: string, searchType?: string | null) => {
      return canAccessRoute(userRole, userPermissions, pathname, searchType);
    },
    [userRole, userPermissions],
  );

  return {
    profile,
    role: userRole,
    permissions: userPermissions,
    isSuperAdmin: superAdmin,
    canViewRevenue: canViewRevenue(userRole),
    hasPermission: checkPermission,
    canAccess: checkRouteAccess,
    loading,
    refresh: loadPermissions,
  };
}

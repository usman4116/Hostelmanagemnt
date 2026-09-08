import { NextRequest, NextResponse } from "next/server";
import { verifyDataAdmin } from "@/lib/adminDataManagement";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const verification = await verifyDataAdmin(request);
    if (!verification.admin) {
      return json({ error: verification.error }, verification.status);
    }

    const { data, error } = await supabaseAdmin
      .from("staff_users")
      .select("id, email, full_name, phone, role, status, permissions, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return json({ error: `Staff users could not be retrieved: ${error.message}` }, 500);
    }

    const staffUsers = (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      phone: row.phone,
      role: row.role || "Staff",
      status: row.status || "Active",
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return json({ staffUsers });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load staff users" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const verification = await verifyDataAdmin(request);
    if (!verification.admin) {
      return json({ error: verification.error }, verification.status);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request payload." }, 400);
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();
    const fullName = String(body.full_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const role = String(body.role ?? "Staff").trim();
    const status = String(body.status ?? "Active").trim();
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    if (!email || !email.includes("@")) {
      return json({ error: "A valid email address is required." }, 400);
    }
    if (!password || password.length < 6) {
      return json({ error: "A password of at least 6 characters is required." }, 400);
    }
    if (!fullName) {
      return json({ error: "Full name is required." }, 400);
    }

    // Check if user already exists in auth
    let page = 1;
    let authUser: { id: string; email?: string } | null = null;
    while (page <= 10 && !authUser) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 500,
      });
      if (listError) break;
      authUser = usersData.users.find((u) => u.email?.trim().toLowerCase() === email) ?? null;
      if (usersData.users.length < 500) break;
      page++;
    }

    if (authUser) {
      // User exists in Auth, update their password and metadata
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          account_type: "staff",
        },
      });

      if (updateAuthError) {
        return json({ error: `Auth account update failed: ${updateAuthError.message}` }, 500);
      }
    } else {
      // Create new user in Auth
      const { error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          account_type: "staff",
        },
      });

      if (createAuthError) {
        return json({ error: `Failed to create login account: ${createAuthError.message}` }, 500);
      }
    }

    // Upsert into staff_users table
    const { data: staffRow, error: staffError } = await supabaseAdmin
      .from("staff_users")
      .upsert(
        {
          email,
          full_name: fullName,
          phone: phone || null,
          role,
          status,
          permissions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      )
      .select()
      .single();

    if (staffError) {
      return json({ error: `Database record creation failed: ${staffError.message}` }, 500);
    }

    return json({
      message: `Staff user ${fullName} (${email}) created successfully.`,
      user: staffRow,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const verification = await verifyDataAdmin(request);
    if (!verification.admin) {
      return json({ error: verification.error }, verification.status);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request payload." }, 400);
    }

    const id = String(body.id ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.full_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const role = String(body.role ?? "Staff").trim();
    const status = String(body.status ?? "Active").trim();
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!id || !email) {
      return json({ error: "Staff user ID and email are required." }, 400);
    }
    if (!fullName) {
      return json({ error: "Full name is required." }, 400);
    }

    // If password update requested
    if (password) {
      if (password.length < 6) {
        return json({ error: "New password must be at least 6 characters." }, 400);
      }

      let page = 1;
      let authUser: { id: string; email?: string } | null = null;
      while (page <= 10 && !authUser) {
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 500,
        });
        if (listError) break;
        authUser = usersData.users.find((u) => u.email?.trim().toLowerCase() === email) ?? null;
        if (usersData.users.length < 500) break;
        page++;
      }

      if (authUser) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password,
          user_metadata: { full_name: fullName, role },
        });
      } else {
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, role, account_type: "staff" },
        });
      }
    }

    // Update staff_users row
    const { data: updatedStaff, error: updateError } = await supabaseAdmin
      .from("staff_users")
      .update({
        full_name: fullName,
        phone: phone || null,
        role,
        status,
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return json({ error: `Failed to update user record: ${updateError.message}` }, 500);
    }

    return json({
      message: `Staff user ${fullName} updated successfully.`,
      user: updatedStaff,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const verification = await verifyDataAdmin(request);
    if (!verification.admin) {
      return json({ error: verification.error }, verification.status);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!id || !email) {
      return json({ error: "Staff user ID and email are required." }, 400);
    }

    if (email === verification.admin.email.toLowerCase()) {
      return json({ error: "You cannot delete your own account." }, 400);
    }

    if (email === "admin@admin.com") {
      return json({ error: "The primary super administrator cannot be deleted." }, 400);
    }

    // Delete from staff_users
    const { error: dbError } = await supabaseAdmin
      .from("staff_users")
      .delete()
      .eq("id", id);

    if (dbError) {
      return json({ error: `Failed to delete staff record: ${dbError.message}` }, 500);
    }

    // Find and delete auth user
    let page = 1;
    let authUser: { id: string; email?: string } | null = null;
    while (page <= 10 && !authUser) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 500,
      });
      if (listError) break;
      authUser = usersData.users.find((u) => u.email?.trim().toLowerCase() === email) ?? null;
      if (usersData.users.length < 500) break;
      page++;
    }

    if (authUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    }

    return json({ message: `Staff user ${email} deleted successfully.` });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
}

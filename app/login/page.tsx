"use client";

import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function ResidentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    const checkLockout = () => {
      const storedLockout = localStorage.getItem("residentLockoutTime");
      if (storedLockout) {
        const time = parseInt(storedLockout, 10);
        if (Date.now() < time) {
          setLockoutTime(time);
        } else {
          localStorage.removeItem("residentLockoutTime");
          localStorage.removeItem("residentLoginAttempts");
        }
      }
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  function recordFailedAttempt() {
    const attempts = parseInt(localStorage.getItem("residentLoginAttempts") || "0", 10) + 1;
    if (attempts >= 3) {
      const lockout = Date.now() + 30000; // 30 seconds
      localStorage.setItem("residentLockoutTime", lockout.toString());
      setLockoutTime(lockout);
      setErrorMessage("Too many failed attempts. Please wait 30 seconds.");
    } else {
      localStorage.setItem("residentLoginAttempts", attempts.toString());
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (lockoutTime && Date.now() < lockoutTime) {
      setErrorMessage(`Too many failed attempts. Please wait ${Math.ceil((lockoutTime - Date.now()) / 1000)} seconds.`);
      return;
    }

    const normalizedEmail = email.trim();
    const submittedPassword = password;

    if (!normalizedEmail || !submittedPassword) {
      setErrorMessage("Please enter both your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: submittedPassword,
      });

      if (signInError) {
        recordFailedAttempt();
        setErrorMessage(
          signInError.message.includes("Invalid login credentials")
            ? "The email or password you entered is incorrect."
            : signInError.message || "Unable to sign you in right now. Please try again."
        );
        setIsLoading(false);
        return;
      }

      if (!authData.session?.user) {
        recordFailedAttempt();
        setErrorMessage("We could not complete the sign-in. Please try again.");
        setIsLoading(false);
        return;
      }

      const { data: verifiedAuth, error: verificationError } = await supabase.auth.getUser();
      const user = verifiedAuth.user;
      if (verificationError || !user?.email) {
        setErrorMessage("The sign-in did not create a valid session. Please try again.");
        setIsLoading(false);
        return;
      }

      const lookupEmail = user.email?.toLowerCase() ?? normalizedEmail.toLowerCase();

      const { data: residentRecord, error: residentError } = await supabase
        .from("residents")
        .select("id, email, status")
        .ilike("email", lookupEmail)
        .maybeSingle();

      const residentIsActive =
        residentRecord?.email &&
        String(residentRecord.status ?? "").trim().toLowerCase() !== "archived";

      if (!residentError && residentIsActive) {
        localStorage.removeItem("residentLoginAttempts");
        localStorage.removeItem("residentLockoutTime");
        window.location.href = "/resident-portal";
        return;
      }

      await supabase.auth.signOut();
      recordFailedAttempt();
      setErrorMessage("No active resident profile is linked to this account.");
    } catch {
      setErrorMessage("Something went wrong while signing you in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-bold text-center text-blue-700">
          StayHub
        </h1>
        <p className="mt-2 text-center text-gray-500">
          Resident Portal
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!!lockoutTime || isLoading}
            className="w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!!lockoutTime || isLoading}
            className="w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
          />

          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          {lockoutTime ? (
             <p className="text-sm text-amber-600 font-medium">Please wait {Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000))}s before trying again.</p>
          ) : null}

          <button
            type="submit"
            disabled={!!lockoutTime || isLoading}
            className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}

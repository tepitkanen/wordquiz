"use client";

import { useEffect, useId, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Bi } from "./Bi";

const smallBtn =
  "min-h-10 rounded-lg border-2 border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-900 transition-colors hover:border-accent-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-accent-300 dark:focus-visible:outline-accent-300";
const menuItem =
  "block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-accent-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus-visible:outline-accent-300";

// Sign-in state is read on the client, so pages stay static and the shell stays instant.
export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);
  // After signing out, the menu disappears; move focus to the Sign in button that replaces it.
  const focusSignIn = useRef(false);
  useEffect(() => {
    if (!session && focusSignIn.current) {
      focusSignIn.current = false;
      signInRef.current?.focus();
    }
  }, [session]);

  // Close on Escape (focus back to the toggle) or on a click outside.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // Keep the space while the session loads, so the header doesn't jump.
  if (isPending) return <div aria-hidden="true" className="min-h-10 w-24" />;

  if (!session) {
    return (
      <button
        ref={signInRef}
        type="button"
        className={smallBtn}
        onClick={() =>
          authClient.signIn.social({
            provider: "google",
            callbackURL: window.location.pathname,
          })
        }
      >
        <Bi fi="Kirjaudu" en="Sign in" />
      </button>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`${smallBtn} flex max-w-48 items-center gap-1`}
      >
        <span className="truncate">{session.user.name}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute right-0 z-10 mt-2 min-w-44 rounded-lg border-2 border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <button
            type="button"
            className={menuItem}
            onClick={async () => {
              setOpen(false);
              focusSignIn.current = true;
              await authClient.signOut();
            }}
          >
            <Bi fi="Kirjaudu ulos" en="Sign out" />
          </button>
        </div>
      )}
    </div>
  );
}

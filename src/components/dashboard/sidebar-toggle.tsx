"use client";
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Navigation } from "./navigation";

export function SidebarToggle({
  displayName,
  role,
  signOutForm,
}: {
  displayName: string;
  role: string;
  signOutForm: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
        <p className="text-lg font-bold tracking-tight text-neutral-900">
          Elden<span className="text-neutral-400">Care</span>
        </p>
        <button
          className="button !min-h-10 !px-3 !py-2"
          aria-expanded={open}
          aria-controls="mobile-sidebar"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
          <span className="sr-only">Menu</span>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer sidebar */}
      <div
        ref={ref}
        id="mobile-sidebar"
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={open ? undefined : "true"}
        style={{ transitionTimingFunction: "ease" }}
      >
        <div className="px-5 pt-6 pb-5 border-b border-neutral-100">
          <p className="text-xl font-bold tracking-tight text-neutral-900">
            Elden<span className="text-neutral-400">Care</span>
          </p>
          <p className="text-sm text-neutral-500 mt-0.5">Care, together.</p>
        </div>
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <Navigation onNavigate={() => setOpen(false)} />
        </div>
        <div className="px-4 py-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600 flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate text-neutral-900">{displayName}</p>
              <p className="text-xs text-neutral-500">{role}</p>
            </div>
          </div>
          {signOutForm}
        </div>
      </div>
    </>
  );
}

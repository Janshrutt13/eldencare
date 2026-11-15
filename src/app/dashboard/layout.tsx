import { requireSession } from "@/lib/auth/session";
import { signOut } from "@/features/auth/actions";
import { Navigation } from "@/components/dashboard/navigation";
import { SidebarToggle } from "@/components/dashboard/sidebar-toggle";
import { CompanionPanel } from "@/components/ai-companion/companion-panel";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const roles: Record<string, string> = {
  elderly: "Elderly user",
  family: "Family member",
  caretaker: "Caretaker",
  volunteer: "Demo volunteer",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireSession();

  const signOutForm = (
    <form action={signOut}>
      <button className="button w-full text-sm">Sign out</button>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      {/* Mobile header + drawer handled by client component */}
      <SidebarToggle
        displayName={profile.display_name}
        role={roles[profile.role] ?? profile.role}
        signOutForm={signOutForm}
      />

      <div className="md:grid md:grid-cols-[260px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col border-r border-neutral-200 bg-white min-h-screen sticky top-0 max-h-screen overflow-y-auto">
          {/* Logo */}
          <div className="px-5 pt-6 pb-5 border-b border-neutral-100">
            <p className="text-xl font-bold tracking-tight text-neutral-900">
              Elden<span className="text-neutral-400">Care</span>
            </p>
            <p className="text-sm text-neutral-500 mt-0.5">Care, together.</p>
          </div>

          {/* Nav */}
          <div className="flex-1 px-3 py-4">
            <Navigation />
          </div>

          {/* User + signout */}
          <div className="px-4 py-4 border-t border-neutral-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600 flex-shrink-0">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-neutral-900">
                  {profile.display_name}
                </p>
                <p className="text-xs text-neutral-500">{roles[profile.role]}</p>
              </div>
            </div>
            {signOutForm}
          </div>
        </aside>

        {/* Main content area */}
        <div className="min-w-0 flex flex-col">
          <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-5 py-2.5 md:px-8">
            <p className="text-xs text-neutral-400 font-medium tracking-wide">
              FICTIONAL-DATA PROTOTYPE · NOT FOR MEDICAL OR EMERGENCY USE
            </p>
          </header>
          <main id="main" className="flex-1 mx-auto w-full max-w-5xl p-5 md:p-8 pb-28">
            {children}
          </main>
        </div>
      </div>

      <Suspense fallback={null}>
        <CompanionPanel />
      </Suspense>
    </div>
  );
}

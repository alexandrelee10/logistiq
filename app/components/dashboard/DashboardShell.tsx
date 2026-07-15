"use client";

import { useEffect, useState } from "react";
import Sidebar, { type DashboardUser } from "./Sidebar";
import Topbar from "./Topbar";
import CopilotPanel from "./CopilotPanel";

export const OPEN_COPILOT_EVENT = "logistiq:open-copilot";

export default function DashboardShell({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Lets any page (e.g. an "Ask Copilot" card in page content) open the
  // panel without needing to lift state further than this shell.
  useEffect(() => {
    const open = () => setCopilotOpen(true);
    window.addEventListener(OPEN_COPILOT_EVENT, open);
    return () => window.removeEventListener(OPEN_COPILOT_EVENT, open);
  }, []);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onCopilotClick={() => setCopilotOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          user={user}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onCopilotClick={() => setCopilotOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}

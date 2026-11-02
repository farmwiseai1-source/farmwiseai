"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Bell, BookOpen, ChevronDown, CircleHelp, CloudSun, Droplets, FileClock, Flower2, Gauge, Leaf, Menu, Settings, ShieldAlert, Sprout, Tractor, UserRound, X } from "lucide-react";
import { farms } from "@/lib/farmwise-types";
import { listDemoFarms } from "@/lib/demo-repository";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: Gauge },
  { label: "My farms", href: "/farms", icon: Tractor },
  { label: "Crop recommendations", href: "/crop-recommendation", icon: Sprout },
  { label: "Pest detection", href: "/pest-detection", icon: ShieldAlert },
  { label: "Irrigation planner", href: "/irrigation", icon: Droplets },
  { label: "Fertilizer calculator", href: "/fertilizer", icon: Flower2 },
  { label: "AI advisor", href: "/advisor", icon: CircleHelp },
  { label: "History", href: "/history", icon: FileClock },
] as const;

function Brand() {
  return <Link href="/" className="brand" aria-label="FarmWiseAI home"><span className="brand-icon"><Leaf size={19} /></span><span>FarmWise<span>AI</span></span></Link>;
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [farmId, setFarmId] = useState(listDemoFarms()[0].id);
  const [language, setLanguage] = useState("English");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const activeFarm = listDemoFarms().find((farm) => farm.id === farmId) ?? farms[0];
  useEffect(() => {
    if (!drawerOpen) return;
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setDrawerOpen(false); }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const sidebar = <>
    <div className="sidebar-brand"><Brand /><button className="icon-button drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
    <div className="nav-section-label">FARM WORKSPACE</div>
    <nav className="side-nav" aria-label="Main navigation">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href === "/farms" && pathname.startsWith("/farms"));
        return <Link onClick={() => setDrawerOpen(false)} className={`nav-link ${active ? "is-active" : ""}`} href={href} key={href} aria-current={active ? "page" : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Pest detection" && <span className="nav-count">2</span>}</Link>;
      })}
    </nav>
    <div className="sidebar-bottom"><div className="season-card"><span className="season-icon"><CloudSun size={17} /></span><div><b>Kharif season</b><small>Monsoon · Jun–Oct</small></div></div><Link className="nav-link settings-link" href="/settings" onClick={() => setDrawerOpen(false)}><Settings size={18} /><span>Settings</span></Link><div className="demo-note"><span className="demo-dot" />Development preview <span className="demo-pill">DEMO</span></div></div>
  </>;

  return <div className="app-frame">
    <aside className="sidebar">{sidebar}</aside>
    {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}><aside id="mobile-navigation" className="mobile-sidebar" onClick={(event) => event.stopPropagation()}>{sidebar}</aside></div>}
    <div className="app-main">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={drawerOpen} aria-controls="mobile-navigation" onClick={() => setDrawerOpen(true)}><Menu size={21} /></button>
        <div className="topbar-farm"><span className="farm-label">CURRENT FARM</span><label className="select-wrap"><Tractor size={16} /><select aria-label="Select farm" value={farmId} onChange={(event) => setFarmId(event.target.value)}>{listDemoFarms().map((farm) => <option value={farm.id} key={farm.id}>{farm.name}</option>)}</select><ChevronDown size={15} /></label></div>
        <div className="topbar-actions"><label className="language-select"><span className="sr-only">Language</span><select aria-label="Choose language" value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>తెలుగు</option><option>हिन्दी</option></select><ChevronDown size={13} /></label><div className="notification-wrap"><button className="icon-button notification-button" aria-label="Notifications, two alerts" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={19} /><i /></button>{notificationsOpen && <div className="notification-menu"><b>Farm notes · demo</b><span>Review 2 unverified sample reports.</span><Link href="/history" onClick={() => setNotificationsOpen(false)}>Open activity history <ChevronDown size={13} /></Link></div>}</div><div className="profile-wrap"><button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}><span className="avatar">RK</span><span className="profile-copy"><b>Ravi Kumar</b><small>Farm owner · demo</small></span><ChevronDown size={15} /></button>{profileOpen && <div className="profile-menu"><Link href="/settings" onClick={() => setProfileOpen(false)}><UserRound size={15} /> Profile & settings</Link><Link href="/" onClick={() => setProfileOpen(false)}><BookOpen size={15} /> Public home</Link><div className="profile-menu-note">Development mode · no account session</div></div>}</div></div>
      </header>
      <div className="farm-context sr-only" aria-live="polite">Selected farm: {activeFarm.name} in {activeFarm.location}</div>
      <main id="main-content" className="content-area">{children}</main>
      <footer className="app-footer"><span>FarmWiseAI · Practical guidance for every growing season</span><span>Demonstration environment</span></footer>
    </div>
  </div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="page-eyebrow">{eyebrow}</div>}<h1>{title}</h1><p>{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>;
}

export function DemoBanner({ children = "You’re viewing demonstration data. No live farm readings or AI analysis are connected." }: { children?: React.ReactNode }) {
  return <div className="demo-banner"><span className="demo-banner-icon"><Activity size={16} /></span><span>{children}</span><span className="demo-banner-tag">DEMO DATA</span></div>;
}

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

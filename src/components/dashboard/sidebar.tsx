"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  MapPin,
  Tag,
  Calendar,
  LogOut,
  Trophy,
  Plus,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const adminNav: NavItem[] = [
  { label: "Genel Bakış", href: "/admin", icon: LayoutDashboard },
  { label: "Takımlar", href: "/admin/teams", icon: Trophy },
  { label: "Kullanıcılar", href: "/admin/users", icon: Users },
  { label: "Roller", href: "/admin/roles", icon: Shield },
  { label: "Lokasyonlar", href: "/admin/locations", icon: MapPin },
  { label: "Event Tipleri", href: "/admin/event-types", icon: Tag },
  { label: "Eventler", href: "/admin/events", icon: Calendar },
];

const staffNav: NavItem[] = [
  { label: "Tüm Eventler", href: "/staff", icon: Calendar },
  { label: "Yeni Event", href: "/staff/create-event", icon: Plus },
];

const playerNav: NavItem[] = [
  { label: "Dashboard", href: "/player", icon: LayoutDashboard },
];

type SidebarProps = {
  role: "ADMIN" | "STAFF" | "PLAYER";
  userName: string;
};

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "ADMIN" ? adminNav : role === "STAFF" ? staffNav : playerNav;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <span className="text-2xl">🏀</span>
        <span className="font-bold text-gray-900 text-lg">Teamgo</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/admin" || item.href === "/staff" || item.href === "/player"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500">{role === "ADMIN" ? "Admin" : role === "STAFF" ? "Staff" : "Oyuncu"}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </form>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/",
    label: "Home",
    icon: "🏠"
  },
  {
    href: "/delivery",
    label: "Delivery",
    icon: "🚚"
  },
  {
    href: "/search",
    label: "Search",
    icon: "🔎"
  },
  {
    href: "/stock-check",
    label: "Stock Check",
    icon: "📦"
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "📊"
  },
  {
    href: "/admin",
    label: "Admin",
    icon: "⚙️"
  }
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="main-navigation">
      <div className="navigation-inner">
        <div className="navigation-brand">
          <span className="navigation-logo">
            🚚
          </span>

          <div>
            <strong>
              Chennai Goods
            </strong>

            <span>
              Management
            </span>
          </div>
        </div>

        <div className="navigation-links">
          {navigationItems.map(
            (item) => {
              const active =
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "navigation-link active"
                      : "navigation-link"
                  }
                >
                  <span className="navigation-icon">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </div>
    </nav>
  );
}

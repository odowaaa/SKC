import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/properties?listingType=SALE", label: "Buy" },
      { href: "/properties?listingType=RENT", label: "Rent" },
      { href: "/properties?listingType=COMMERCIAL", label: "Commercial" },
      { href: "/properties?type=LAND", label: "Land" },
      { href: "/mortgage-calculator", label: "Mortgage Calculator" },
      { href: "/compare", label: "Compare Properties" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/agents", label: "Agents" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <p className="text-xl font-bold">AMODA</p>
          <p className="mt-1 text-sm text-primary-foreground/70">Your Property Partner</p>
          <p className="mt-4 max-w-xs text-sm text-primary-foreground/70">
            Discover, list, and manage properties across Somalia and beyond — built for buyers, renters,
            agents and developers.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" aria-label="Facebook" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">
              {column.title}
            </p>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-primary-foreground/80 hover:text-primary-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} AMODA. All rights reserved.
      </div>
    </footer>
  );
}

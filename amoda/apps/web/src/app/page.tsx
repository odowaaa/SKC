import Link from "next/link";
import { ArrowRight, Building2, Home as HomeIcon, MapPin, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { PropertyCard } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchProperties } from "@/lib/api/properties";

const POPULAR_CITIES = ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Berbera"];

const STATS = [
  { label: "Listed properties", value: "1,200+", icon: HomeIcon },
  { label: "Verified agents", value: "180+", icon: ShieldCheck },
  { label: "Cities covered", value: "12", icon: MapPin },
  { label: "Happy clients", value: "6,500+", icon: Users },
];

export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    searchProperties({ featured: true, limit: 6 }).catch(() => ({ data: [], meta: { page: 1, limit: 6, total: 0, totalPages: 1 } })),
    searchProperties({ sortBy: "newest", limit: 8 }).catch(() => ({ data: [], meta: { page: 1, limit: 8, total: 0, totalPages: 1 } })),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground md:py-28">
        <div className="container-page relative z-10 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest">
            Somalia&apos;s modern property marketplace
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Find your next home with <span className="text-accent">AMODA</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
            Browse apartments, villas, commercial spaces, and land for sale or rent — verified listings from
            trusted agents and developers.
          </p>
          <div className="mt-10">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="container-page -mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="flex flex-col items-center gap-2 pt-6">
              <stat.icon className="h-6 w-6 text-secondary" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Featured properties</h2>
            <p className="mt-1 text-muted-foreground">Hand-picked listings from our top agents and developers</p>
          </div>
          <Link href="/properties?featured=true" className="hidden md:block">
            <Button variant="outline" className="gap-2">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {featured.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured properties yet — check back soon.</p>
        )}
      </section>

      <section className="bg-muted py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">Latest listings</h2>
          <p className="mt-1 text-muted-foreground">Freshly published properties across Somalia</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latest.data.slice(0, 8).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold md:text-3xl">Popular cities</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {POPULAR_CITIES.map((city) => (
            <Link key={city} href={`/properties?city=${encodeURIComponent(city)}`}>
              <Card className="flex flex-col items-center justify-center gap-2 py-8 text-center transition-shadow hover:shadow-md">
                <Building2 className="h-6 w-6 text-secondary" />
                <p className="font-semibold">{city}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container-page grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" /> For agents & developers
            </p>
            <h2 className="mt-4 text-3xl font-bold">List your properties with AMODA</h2>
            <p className="mt-3 max-w-lg text-primary-foreground/70">
              Reach thousands of verified buyers and tenants. Manage listings, bookings, and leads from a single
              dashboard built for real estate professionals.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/register">
                <Button variant="accent" size="lg">
                  Get started
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="border-white/30 text-primary-foreground hover:bg-white/10">
                  View pricing
                </Button>
              </Link>
            </div>
          </div>
          <Card className="bg-white/5 text-primary-foreground">
            <CardContent className="grid grid-cols-2 gap-6 pt-6 text-center">
              <div>
                <p className="text-3xl font-bold text-accent">0%</p>
                <p className="text-xs text-primary-foreground/70">Listing fees for the first 90 days</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">24/7</p>
                <p className="text-xs text-primary-foreground/70">Dedicated agent support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, ChevronRight, User, Train, Bus, Car, Film, ArrowRight, Star, Clock, Loader2, X, ShoppingBag, Carrot } from "lucide-react";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { CITIES, getCity, contentForCity } from "@/lib/cities";
import { CitySelector } from "@/components/CitySelector";
import { TravelBooking } from "@/components/TravelBooking";
import { Assistant } from "@/components/Assistant";

const searchSchema = z.object({
  city: fallback(z.enum(CITIES.map((c) => c.slug) as [string, ...string[]]), "gurugram").default("gurugram"),
  search: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  component: Home,
  head: () => ({
    meta: [
      { title: "SHAI — Movies, Trains, Buses & Cabs" },
      { name: "description", content: "Book movies, trains, buses and cabs across India with SHAI. One app for movies and travel." },
      { property: "og:title", content: "SHAI — Movies, Trains, Buses & Cabs" },
      { property: "og:description", content: "Book movies, trains, buses and cabs across India on SHAI." },
    ],
  }),
});

const nav: { label: string; icon?: typeof Train }[] = [
  { label: "For you" },
  { label: "Movies", icon: Film },
  { label: "Trains", icon: Train },
  { label: "Buses", icon: Bus },
  { label: "Cabs", icon: Car },
];

const popularTrainRoutes = [
  { from: "New Delhi", to: "Mumbai CST", code: "NDLS → CSTM", trains: 34 },
  { from: "New Delhi", to: "Howrah", code: "NDLS → HWH", trains: 28 },
  { from: "Mumbai CST", to: "Pune", code: "CSTM → PUNE", trains: 42 },
  { from: "Bengaluru", to: "Chennai", code: "SBC → MAS", trains: 26 },
  { from: "Delhi", to: "Jaipur", code: "NDLS → JP", trains: 22 },
  { from: "Ahmedabad", to: "Mumbai", code: "ADI → BCT", trains: 30 },
];

const popularBusRoutes = [
  { from: "Delhi", to: "Manali", operators: 48, fare: "₹899" },
  { from: "Delhi", to: "Jaipur", operators: 62, fare: "₹499" },
  { from: "Mumbai", to: "Pune", operators: 120, fare: "₹350" },
  { from: "Bengaluru", to: "Chennai", operators: 85, fare: "₹599" },
  { from: "Hyderabad", to: "Vijayawada", operators: 54, fare: "₹450" },
  { from: "Chennai", to: "Coimbatore", operators: 70, fare: "₹649" },
];

const cabFleet = [
  { type: "Hatchback", seats: "4 seats", price: "₹9/km", desc: "Wagon R, Swift" },
  { type: "Sedan", seats: "4 seats", price: "₹12/km", desc: "Dzire, Etios" },
  { type: "SUV", seats: "6 seats", price: "₹16/km", desc: "Ertiga, Innova" },
  { type: "Premium", seats: "4 seats", price: "₹22/km", desc: "Innova Crysta" },
];

function Poster({ hue, label, image }: { hue: number; label: string; image?: string }) {
  if (image) {
    return (
      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md relative group cursor-pointer border border-border/30">
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-3 text-white font-semibold text-sm">
          <span className="line-clamp-2">{label}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="aspect-[2/3] w-full rounded-xl flex items-end p-3 text-white font-semibold text-sm cursor-pointer shadow-md hover:scale-[1.02] transition duration-200"
      style={{ background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.35 0.18 ${(hue + 40) % 360}))` }}
    >
      {label}
    </div>
  );
}
function Banner({ hue, label }: { hue: number; label: string }) {
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl flex items-end p-4 text-white font-semibold"
      style={{ background: `linear-gradient(160deg, oklch(0.6 0.2 ${hue}), oklch(0.3 0.15 ${(hue + 60) % 360}))` }}
    >
      {label}
    </div>
  );
}
function Section({ title, action, id, children }: { title: string; action?: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-20">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {action && (
          <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            {action} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Home() {
  const { city: citySlug, search = "" } = Route.useSearch();
  const city = getCity(citySlug);
  const { movies } = contentForCity(city);
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("For you");
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<string>("");
  const [selectedPriceClass, setSelectedPriceClass] = useState<any>(null);
  const [isBookingMovie, setIsBookingMovie] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [wallet, setWallet] = useState<any>({
    full_name: "Test User",
    email: "test@shai.com",
    phone: "9999999999",
    wallet_balance: 5000.00,
    transaction_limit: 2000.00,
    daily_limit: 3000.00,
  });

  const MOCK_WALLET = {
    full_name: "Test User",
    email: "test@shai.com",
    phone: "9999999999",
    wallet_balance: 5000.00,
    transaction_limit: 2000.00,
    daily_limit: 3000.00,
  };

  const STATIC_SERVICES = [
    {
      service_id: 4,
      category: "Shopping",
      provider_name: "Amazon",
      item_name: "Wireless Earbuds",
      available_quantity: 200,
      price: 1999.00,
      status: "Available"
    },
    {
      service_id: 5,
      category: "Grocery",
      provider_name: "Amazon Fresh",
      item_name: "Grocery Combo Pack",
      available_quantity: 500,
      price: 799.00,
      status: "Available"
    }
  ];

  // Load wallet profile on mount and listen for changes
  useEffect(() => {
    const local = localStorage.getItem("wallet_profile");
    if (local) {
      setWallet(JSON.parse(local));
    } else {
      setWallet(MOCK_WALLET);
      localStorage.setItem("wallet_profile", JSON.stringify(MOCK_WALLET));
    }

    const handleWalletUpdated = () => {
      const updated = localStorage.getItem("wallet_profile");
      if (updated) setWallet(JSON.parse(updated));
    };
    window.addEventListener("wallet-updated", handleWalletUpdated);
    return () => window.removeEventListener("wallet-updated", handleWalletUpdated);
  }, []);

  const [dbServices, setDbServices] = useState<any[]>(STATIC_SERVICES);

  const openMovie = (movie: any) => {
    setSelectedMovie(movie);
    setSelectedShowtime(movie.showtimes?.[0] || "");
    setSelectedPriceClass(movie.prices?.[0] || null);
  };

  const handleBookMovie = async () => {
    if (!selectedMovie) return;
    const ticketPrice = parseInt(selectedPriceClass?.price.replace("₹", "") || "0");
    
    if (ticketPrice > wallet.wallet_balance) {
      toast.error("Insufficient wallet balance.");
      return;
    }
    
    if (ticketPrice > wallet.transaction_limit) {
      toast.error(`Transaction amount exceeds your limit of ₹${wallet.transaction_limit}.`);
      return;
    }

    setIsBookingMovie(true);
    
    setTimeout(() => {
      const nextBalance = wallet.wallet_balance - ticketPrice;
      const nextWallet = { ...wallet, wallet_balance: nextBalance };
      setWallet(nextWallet);
      localStorage.setItem("wallet_profile", JSON.stringify(nextWallet));
      
      setIsBookingMovie(false);
      setSelectedMovie(null);
      
      toast.success("Movie Ticket Booked!", {
        description: `Successfully booked ticket for "${selectedMovie.title}" - ${selectedShowtime} (${selectedPriceClass?.name} - ${selectedPriceClass?.price}) at Cinepolis, ${city.name}!`,
        duration: 5000,
      });
      window.dispatchEvent(new CustomEvent("wallet-updated"));
    }, 800);
  };

  // Track scrolling to update active navigation item
  useEffect(() => {
    const sections = ["movies-section", "trains-section", "buses-section", "cabs-section"];
    
    const observerOptions = {
      root: null,
      rootMargin: "-15% 0px -75% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const label = id.replace("-section", "");
          const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
          setActiveSection(formattedLabel);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if (window.scrollY < 120) {
        setActiveSection("For you");
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavClick = (label: string) => {
    if (label === "For you") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const id = `${label.toLowerCase()}-section`;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.tag.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTrains = popularTrainRoutes.filter(
    (r) =>
      r.from.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBuses = popularBusRoutes.filter(
    (r) =>
      r.from.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCabs = cabFleet.filter(
    (c) =>
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-extrabold tracking-tight text-primary cursor-pointer" onClick={() => handleNavClick("For you")}>SHAI</div>
            <div className="hidden md:block">
              <CitySelector city={city} />
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium ml-4">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = activeSection === n.label;
              return (
                <a
                  key={n.label}
                  onClick={() => handleNavClick(n.label)}
                  className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                    active ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {n.label}
                </a>
              );
            })}
          </nav>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 bg-muted rounded-full px-4 h-10 w-[360px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search movies, trains, buses & cabs"
              value={search}
              onChange={(e) => navigate({ to: "/", search: (prev: any) => ({ ...prev, search: e.target.value || undefined }) })}
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
            />
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile((p) => !p)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent cursor-pointer transition relative"
            >
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-background animate-pulse" />
            </button>
            
            {showProfile && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-xl rounded-2xl z-50 p-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-3 border-b border-border/80 pb-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                    {wallet.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{wallet.full_name || "Test User"}</div>
                    <div className="text-xs text-muted-foreground">{wallet.email || "test@shai.com"}</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-semibold">{wallet.phone || "9999999999"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Wallet Balance:</span>
                    <span className="font-bold text-primary text-sm">
                      ₹{wallet.wallet_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Txn Limit:</span>
                    <span className="font-semibold text-foreground">₹{wallet.transaction_limit?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Daily Limit:</span>
                    <span className="font-semibold text-foreground">₹{wallet.daily_limit?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ background: "var(--hero)" }}>
        <main className="max-w-[1360px] mx-auto px-6 pb-16">
          <div className="pt-10 pb-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl">
              Movies & travel in {city.name}, one app.
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Book movie tickets, trains, buses and cabs across {city.name}, {city.state} — all in the same place.
            </p>
          </div>

          <Section id="movies-section" title={`Top movies near you in ${city.name}`} action="See all">
            {filteredMovies.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No matching movies found in {city.name}.
              </div>
            ) : (
              <div className="scroll-row">
                {filteredMovies.map((m) => (
                  <div
                    key={m.title}
                    onClick={() => openMovie(m)}
                    className="w-[190px] shrink-0 snap-start hover:scale-[1.02] transition duration-200 cursor-pointer"
                  >
                    <Poster hue={m.hue} label={m.title} image={m.image} />
                    <div className="mt-2">
                      <div className="font-semibold text-sm flex items-center justify-between gap-1">
                        <span className="truncate">{m.title}</span>
                        {m.rating && (
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5 shrink-0">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {m.rating}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Travel booking widget */}
          <Section id="booking-section" title="Book your journey">
            <TravelBooking wallet={wallet} setWallet={setWallet} />
          </Section>

          {/* Trains */}
          <Section id="trains-section" title="Popular train routes" action="See all">
            {filteredTrains.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No matching train routes found.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrains.map((r) => (
                  <div
                    key={r.code}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("autofill-booking", { 
                        detail: { mode: "trains", from: r.from, to: r.to } 
                      }));
                      document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/60 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                      <Train className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {r.from} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /> {r.to}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.code} · {r.trains} trains daily</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Buses */}
          <Section id="buses-section" title="Popular bus routes" action="See all">
            {filteredBuses.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No matching bus routes found.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredBuses.map((r) => (
                  <div
                    key={`${r.from}-${r.to}`}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("autofill-booking", { 
                        detail: { mode: "buses", from: r.from, to: r.to } 
                      }));
                      document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/60 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                      <Bus className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {r.from} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /> {r.to}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.operators} operators</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">from</div>
                      <div className="text-sm font-semibold text-primary">{r.fare}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Cabs */}
          <Section id="cabs-section" title="Cabs — choose your ride" action="See all">
            {filteredCabs.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No matching cabs found.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {filteredCabs.map((c) => (
                  <div
                    key={c.type}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("autofill-booking", { 
                        detail: { mode: "cabs", to: c.type }
                      }));
                      document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-primary/60 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary mb-3">
                      <Car className="w-6 h-6" />
                    </div>
                    <div className="font-semibold text-base">{c.type}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                    <div className="flex items-baseline justify-between mt-4">
                      <span className="text-xs text-muted-foreground">{c.seats}</span>
                      <span className="text-sm font-semibold text-primary">{c.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Shopping & Grocery (Dynamic services 4 & 5 from database) */}
          {dbServices.length > 0 && (
            <Section id="shopping-section" title="Featured Online Shopping & Grocery Deals">
              <div className="grid gap-4 md:grid-cols-2">
                {dbServices.map((item: any) => (
                  <div
                    key={item.service_id}
                    className="bg-card border border-border rounded-3xl p-5 hover:border-primary/60 hover:shadow-md transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                        {item.category === "Shopping" ? <ShoppingBag className="w-6 h-6" /> : <Carrot className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-semibold text-base text-foreground">{item.item_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Provided by <strong className="text-foreground">{item.provider_name}</strong> · Status: <span className="text-emerald-600 font-semibold">{item.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Available Qty: <strong className="text-foreground">{item.available_quantity}</strong> units
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2 shrink-0">
                      <div>
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Price</div>
                        <div className="text-base font-bold text-primary">₹{item.price?.toLocaleString('en-IN')}</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (item.price > wallet.wallet_balance) {
                            toast.error("Insufficient wallet balance.");
                            return;
                          }
                          if (item.price > wallet.transaction_limit) {
                            toast.error(`Transaction amount exceeds your limit of ₹${wallet.transaction_limit}.`);
                            return;
                          }
                          
                          try {
                            const res = await bookTicketInDb({ serviceId: item.service_id, amount: item.price });
                            if (res && res.success) {
                              const nextBalance = wallet.wallet_balance - item.price;
                              const nextWallet = { ...wallet, wallet_balance: nextBalance };
                              setWallet(nextWallet);
                              localStorage.setItem("wallet_profile", JSON.stringify(nextWallet));
                              
                              // Decrement quantity locally
                              setDbServices(prev => prev.map(p => p.service_id === item.service_id ? { ...p, available_quantity: p.available_quantity - 1 } : p));
                              
                              toast.success("Order Placed Successfully!", {
                                description: `Successfully ordered "${item.item_name}" for ₹${item.price} using your wallet balance!`,
                              });
                            }
                          } catch (err: any) {
                            console.warn("DB purchase transaction failed, performing client-only purchase:", err);
                            const nextBalance = wallet.wallet_balance - item.price;
                            const nextWallet = { ...wallet, wallet_balance: nextBalance };
                            setWallet(nextWallet);
                            localStorage.setItem("wallet_profile", JSON.stringify(nextWallet));
                            
                            setDbServices(prev => prev.map(p => p.service_id === item.service_id ? { ...p, available_quantity: p.available_quantity - 1 } : p));
                            
                            toast.success("Order Placed (Client-side Fallback)!", {
                              description: `Successfully ordered "${item.item_name}" for ₹${item.price}!`,
                            });
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition cursor-pointer shadow-sm"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </main>
      </div>

      <footer className="border-t border-border bg-card">
        <div className="max-w-[1360px] mx-auto px-6 py-12 grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-2xl font-extrabold text-primary">SHAI</div>
            <p className="mt-3 text-sm text-muted-foreground">Movies and travel in one app. Book tickets, trains, buses and cabs across India.</p>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground"><li>About</li><li>Careers</li><li>Press</li><li>Contact</li></ul>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">Book</div>
            <ul className="space-y-2 text-sm text-muted-foreground"><li>Movies</li><li>Trains</li><li>Buses</li><li>Cabs</li></ul>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">Legal</div>
            <ul className="space-y-2 text-sm text-muted-foreground"><li>Terms</li><li>Privacy</li><li>Cookies</li><li>Refunds</li></ul>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} SHAI. All rights reserved.</div>
      </footer>

      {/* MOVIE DETAILS MODAL */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-250">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/10 to-violet-600/10 px-6 py-5 flex items-center justify-between border-b border-border/80">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" /> Movie Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMovie(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Movie info top */}
              <div className="flex gap-4">
                {/* Poster */}
                <div className="w-28 h-40 rounded-xl overflow-hidden shadow-md shrink-0 border border-border/30 bg-muted/40">
                  {selectedMovie.image ? (
                    <img
                      src={selectedMovie.image}
                      alt={selectedMovie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-end p-2 text-white font-bold text-xs"
                      style={{ background: `linear-gradient(135deg, oklch(0.55 0.22 ${selectedMovie.hue}), oklch(0.35 0.18 ${(selectedMovie.hue + 40) % 360}))` }}
                    >
                      {selectedMovie.title}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <h4 className="text-xl font-bold text-foreground leading-tight truncate">
                    {selectedMovie.title}
                  </h4>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded-lg">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {selectedMovie.rating || "N/A"}
                    </div>
                    <span className="text-xs text-muted-foreground">({selectedMovie.votes || "0"} votes)</span>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedMovie.duration || "N/A"}</p>
                    <p>Genre: <strong className="text-foreground">{selectedMovie.genre || "N/A"}</strong></p>
                    <p>Rating: <strong className="text-foreground">{selectedMovie.tag}</strong></p>
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Synopsis</h5>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {selectedMovie.description || "No synopsis available for this movie."}
                </p>
              </div>

              {/* Showtimes */}
              {selectedMovie.showtimes && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Showtime</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovie.showtimes.map((time: string) => {
                      const active = selectedShowtime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedShowtime(time)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prices Class select */}
              {selectedMovie.prices && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Ticket Class</h5>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {selectedMovie.prices.map((p: any) => {
                      const active = selectedPriceClass?.name === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setSelectedPriceClass(p)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
                            active
                              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                              : "bg-background border-border hover:bg-muted"
                          }`}
                        >
                          <span className="text-xs text-muted-foreground font-medium">{p.name}</span>
                          <span className={`text-base font-bold ${active ? "text-primary" : "text-foreground"}`}>
                            {p.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 bg-muted/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedMovie(null)}
                className="px-4 py-2 border border-border rounded-xl hover:bg-muted text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBookingMovie || !selectedShowtime || !selectedPriceClass}
                onClick={handleBookMovie}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition shadow-sm disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
              >
                {isBookingMovie ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Ticket"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Speech and Text Assistant */}
      <Assistant />
    </div>
  );
}

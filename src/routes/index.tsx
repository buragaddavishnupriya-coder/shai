import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, ChevronRight, User, Train, Bus, Car, Film, ArrowRight, Star, Clock, Loader2, X, ShoppingBag, Carrot } from "lucide-react";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { CITIES, getCity, contentForCity } from "@/lib/cities";
import { CitySelector } from "@/components/CitySelector";
import { TravelBooking } from "@/components/TravelBooking";
import { Assistant } from "@/components/Assistant";
import { getDbWallet, getDbServices, updateDbWalletBalance } from "@/lib/db-server";

const searchSchema = z.object({
  city: fallback(z.enum(CITIES.map((c) => c.slug) as [string, ...string[]]), "gurugram").default("gurugram"),
  search: z.string().optional(),
  autoBookMode: z.enum(["trains", "buses", "cabs"]).optional(),
  autoBookFrom: z.string().optional(),
  autoBookTo: z.string().optional(),
  autoBookDate: z.string().optional(),
  autoBookClass: z.string().optional(),
  autoBookCabType: z.string().optional(),
  autoBookMembers: z.number().optional(),
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
  const { 
    city: citySlug, 
    search = "",
    autoBookMode,
    autoBookFrom,
    autoBookTo,
    autoBookDate,
    autoBookClass,
    autoBookCabType,
    autoBookMembers,
  } = Route.useSearch();
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

  const [activeProfileTab, setActiveProfileTab] = useState<"info" | "billing" | "transactions">("info");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileTxLimit, setProfileTxLimit] = useState(2000.00);
  const [profileDailyLimit, setProfileDailyLimit] = useState(3000.00);
  
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [profileTransactions, setProfileTransactions] = useState<any[]>([]);

  useEffect(() => {
    setProfileName(wallet.full_name || "");
    setProfilePhone(wallet.phone || "");
    setProfileEmail(wallet.email || "");
    setProfileTxLimit(wallet.transaction_limit || 2000.00);
    setProfileDailyLimit(wallet.daily_limit || 3000.00);
  }, [wallet]);

  useEffect(() => {
    if (showProfile) {
      const txs = localStorage.getItem("user_transactions");
      setProfileTransactions(txs ? JSON.parse(txs) : []);
    }
  }, [showProfile]);

  useEffect(() => {
    if (autoBookMode && autoBookFrom && autoBookTo) {
      window.dispatchEvent(new CustomEvent("autofill-booking", {
        detail: {
          mode: autoBookMode,
          from: autoBookFrom,
          to: autoBookTo,
          date: autoBookDate,
          travelClass: autoBookClass,
          cabType: autoBookCabType,
          members: autoBookMembers,
          autoSubmit: true,
          autoBook: true
        }
      }));

      const el = document.getElementById("booking-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });

      navigate({
        to: "/",
        search: (prev: any) => ({
          ...prev,
          autoBookMode: undefined,
          autoBookFrom: undefined,
          autoBookTo: undefined,
          autoBookDate: undefined,
          autoBookClass: undefined,
          autoBookCabType: undefined,
          autoBookMembers: undefined,
        }),
        replace: true
      });
    }
  }, [autoBookMode, autoBookFrom, autoBookTo, autoBookDate, autoBookClass, autoBookCabType, autoBookMembers, navigate]);

  const handleAddMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    
    const nextBalance = wallet.wallet_balance + amount;
    const nextWallet = { ...wallet, wallet_balance: nextBalance };
    setWallet(nextWallet);
    localStorage.setItem("wallet_profile", JSON.stringify(nextWallet));
    
    const transactionsLocal = localStorage.getItem("user_transactions");
    const transactions = transactionsLocal ? JSON.parse(transactionsLocal) : [];
    const newTx = {
      id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      service: "Wallet Top-up",
      details: "Added money to wallet balance",
      amount: amount,
      timestamp: new Date().toLocaleString(),
      status: "Approved",
      type: "credit"
    };
    transactions.unshift(newTx);
    localStorage.setItem("user_transactions", JSON.stringify(transactions));
    
    setShowAddMoney(false);
    setAddMoneyAmount("");
    toast.success(`Successfully added ₹${amount.toLocaleString('en-IN')} to your wallet!`);
    window.dispatchEvent(new CustomEvent("wallet-updated"));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedWallet = {
      ...wallet,
      full_name: profileName,
      phone: profilePhone,
      email: profileEmail,
      transaction_limit: parseFloat(String(profileTxLimit)),
      daily_limit: parseFloat(String(profileDailyLimit)),
    };
    setWallet(updatedWallet);
    localStorage.setItem("wallet_profile", JSON.stringify(updatedWallet));
    toast.success("Profile and billing limits updated successfully!");
    window.dispatchEvent(new CustomEvent("wallet-updated"));
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoggedIn(true);
    localStorage.setItem("user_session", JSON.stringify({ email: loginEmail }));

    // Generate formatted full name from email
    const namePart = loginEmail.split("@")[0];
    const cleanName = namePart.split(".")
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

    const updatedWallet = {
      ...wallet,
      email: loginEmail,
      full_name: cleanName
    };
    setWallet(updatedWallet);
    localStorage.setItem("wallet_profile", JSON.stringify(updatedWallet));

    setShowLoginModal(false);
    toast.success("Welcome back!", {
      description: `Signed in as ${loginEmail}`
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowProfile(false);
    localStorage.removeItem("user_session");
    toast.success("Signed out successfully.");
  };

  const handleSocialLogin = (provider: string) => {
    const providerEmail = `guest.${provider.toLowerCase()}@shai.com`;
    setIsLoggedIn(true);
    localStorage.setItem("user_session", JSON.stringify({ email: providerEmail }));

    const updatedWallet = {
      ...wallet,
      email: providerEmail,
      full_name: `Guest (${provider})`
    };
    setWallet(updatedWallet);
    localStorage.setItem("wallet_profile", JSON.stringify(updatedWallet));

    setShowLoginModal(false);
    toast.success("Connected successfully!", {
      description: `Logged in using your ${provider} account.`
    });
  };

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

  // Load wallet profile and session on mount and listen for changes
  useEffect(() => {
    const session = localStorage.getItem("user_session");
    let email: string | undefined = undefined;
    if (session && session !== "undefined") {
      setIsLoggedIn(true);
      try {
        const parsed = JSON.parse(session);
        email = parsed?.email;
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }

    // Try loading wallet from DB
    getDbWallet({ data: { email } })
      .then((dbWallet) => {
        if (dbWallet) {
          setWallet(dbWallet);
          localStorage.setItem("wallet_profile", JSON.stringify(dbWallet));
        } else {
          const local = localStorage.getItem("wallet_profile");
          if (local) {
            setWallet(JSON.parse(local));
          } else {
            setWallet(MOCK_WALLET);
            localStorage.setItem("wallet_profile", JSON.stringify(MOCK_WALLET));
          }
        }
      })
      .catch(() => {
        const local = localStorage.getItem("wallet_profile");
        if (local) {
          setWallet(JSON.parse(local));
        } else {
          setWallet(MOCK_WALLET);
          localStorage.setItem("wallet_profile", JSON.stringify(MOCK_WALLET));
        }
      });

    const handleWalletUpdated = () => {
      const updated = localStorage.getItem("wallet_profile");
      if (updated) setWallet(JSON.parse(updated));
    };

    const handleOpenProfileTab = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setShowProfile(true);
      if (detail.tab) setActiveProfileTab(detail.tab);
    };

    window.addEventListener("wallet-updated", handleWalletUpdated);
    window.addEventListener("open-profile-tab", handleOpenProfileTab);
    
    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdated);
      window.removeEventListener("open-profile-tab", handleOpenProfileTab);
    };
  }, []);

  const [dbServices, setDbServices] = useState<any[]>(STATIC_SERVICES);

  // Load services from DB on mount
  useEffect(() => {
    getDbServices()
      .then((services) => {
        if (services && services.length > 0) {
          setDbServices(services);
        }
      })
      .catch(console.error);
  }, []);

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
      
      // Record transaction in local history
      const transactionsLocal = localStorage.getItem("user_transactions");
      const transactions = transactionsLocal ? JSON.parse(transactionsLocal) : [];
      const newTx = {
        id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        service: "Movie Ticket",
        details: `Ticket for "${selectedMovie.title}" - ${selectedShowtime} (${selectedPriceClass?.name})`,
        amount: ticketPrice,
        timestamp: new Date().toLocaleString(),
        status: "Approved"
      };
      transactions.unshift(newTx);
      localStorage.setItem("user_transactions", JSON.stringify(transactions));
      
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
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleNavClick("For you")}>
              <img src="/logo-symbol-purple.png" alt="SHAI logo" className="h-6 w-auto object-contain" />
              <span className="text-2xl font-extrabold tracking-tight text-primary">SHAI</span>
            </div>
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
          
          {/* Profile Trigger */}
          <div className="relative">
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 shadow-sm cursor-pointer transition active:scale-95 flex items-center justify-center"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent cursor-pointer transition relative"
                title="View Profile Dashboard"
              >
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-background animate-pulse" />
              </button>
            )}
          </div>
        </div>
      </header>

      {showProfile ? (
        <div className="max-w-[1360px] mx-auto px-6 py-10 animate-in fade-in duration-200">
          {/* Back button and title */}
          <div className="flex items-center gap-4 mb-8 border-b border-border/60 pb-6 max-w-5xl mx-auto">
            <button
              onClick={() => setShowProfile(false)}
              className="p-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-muted active:scale-95 transition cursor-pointer flex items-center justify-center shadow-sm"
              title="Back to Home"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Account Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your local wallet balance, adjust spending limits, and check transaction history.</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[260px_1fr] max-w-5xl mx-auto">
            {/* Left Sidebar Navigation */}
            <div className="flex flex-col justify-between bg-card border border-border p-6 rounded-3xl shadow-sm">
              <div className="flex flex-col gap-2">
                {[
                  { id: "info", label: "Wallet & Profile", icon: User },
                  { id: "billing", label: "Billing & Limits", icon: Clock },
                  { id: "transactions", label: "Transactions History", icon: ShoppingBag }
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  const active = activeProfileTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveProfileTab(tab.id as any)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                        active 
                          ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <TabIcon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              
              <div className="border-t border-border mt-6 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer text-left"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right Content Panel */}
            <div className="bg-card border border-border p-6 rounded-3xl min-h-[500px] shadow-sm flex flex-col justify-start">
              {activeProfileTab === "info" && (
                <div className="space-y-8 w-full">
                  {/* Wallet Card */}
                  <div className="max-w-2xl bg-gradient-to-br from-primary/95 to-primary/80 text-primary-foreground p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col gap-6">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-6" />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs opacity-75 font-medium uppercase tracking-wider">Wallet Balance</span>
                        <div className="text-4xl font-extrabold mt-1">
                          ₹{wallet.wallet_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddMoney(true)}
                        className="px-5 py-2.5 bg-white text-primary rounded-xl font-bold text-xs hover:bg-opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
                      >
                        + Add Money
                      </button>
                    </div>

                    {showAddMoney && (
                      <form onSubmit={handleAddMoneySubmit} className="bg-white/10 border border-white/10 rounded-xl p-4 flex gap-2 items-center animate-in slide-in-from-top-2 duration-200">
                        <input
                          required
                          type="number"
                          placeholder="Enter amount to add in ₹"
                          className="bg-transparent text-white placeholder:text-white/60 outline-none text-sm font-semibold w-full px-2"
                          value={addMoneyAmount}
                          onChange={(e) => setAddMoneyAmount(e.target.value)}
                        />
                        <button type="submit" className="px-4 py-1.5 bg-white text-primary rounded-lg text-xs font-bold hover:bg-opacity-95 cursor-pointer">
                          Add
                        </button>
                        <button type="button" onClick={() => setShowAddMoney(false)} className="text-white hover:text-white/80 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-white/10 opacity-90">
                      <div>
                        <span className="opacity-75">Daily limit:</span>
                        <span className="font-semibold block mt-0.5">₹{wallet.daily_limit?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Transaction limit:</span>
                        <span className="font-semibold block mt-0.5">₹{wallet.transaction_limit?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Edit Info Form */}
                  <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-5 w-full">
                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Profile Information</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Full Name</label>
                        <input
                          required
                          className="w-full bg-muted/20 border border-border px-4 py-3 rounded-xl text-sm font-semibold outline-none focus:border-primary focus:bg-background transition"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Phone Number</label>
                        <input
                          required
                          className="w-full bg-muted/20 border border-border px-4 py-3 rounded-xl text-sm font-semibold outline-none focus:border-primary focus:bg-background transition"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">Email Address</label>
                      <input
                        required
                        type="email"
                        className="w-full bg-muted/20 border border-border px-4 py-3 rounded-xl text-sm font-semibold outline-none focus:border-primary focus:bg-background transition"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                      />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition cursor-pointer shadow-sm"
                      >
                        Save Profile Details
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeProfileTab === "billing" && (
                <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-6">
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Billing & Spending Limits</h4>
                    <p className="text-xs text-muted-foreground">Adjust limits below to control wallet transaction sizes and prevent unwanted expenses.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-muted/30 border border-border/80 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="block text-base font-bold">Transaction Limit</label>
                          <span className="text-xs text-muted-foreground">Maximum amount allowed per booking/order</span>
                        </div>
                        <span className="font-bold text-primary text-lg">₹{parseInt(String(profileTxLimit))?.toLocaleString('en-IN')}</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="100"
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        value={profileTxLimit}
                        onChange={(e) => setProfileTxLimit(parseFloat(e.target.value))}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>Min: ₹500</span>
                        <span>Max: ₹10,000</span>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-border/80 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="block text-base font-bold">Daily Spending Limit</label>
                          <span className="text-xs text-muted-foreground">Maximum accumulated balance allowed per day</span>
                        </div>
                        <span className="font-bold text-primary text-lg">₹{parseInt(String(profileDailyLimit))?.toLocaleString('en-IN')}</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="20000"
                        step="500"
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        value={profileDailyLimit}
                        onChange={(e) => setProfileDailyLimit(parseFloat(e.target.value))}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>Min: ₹1,000</span>
                        <span>Max: ₹20,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition cursor-pointer shadow-sm"
                    >
                      Save Spending Limits
                    </button>
                  </div>
                </form>
              )}

              {activeProfileTab === "transactions" && (
                <div className="space-y-4 max-w-2xl w-full">
                  <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Transaction History</h4>
                  
                  {profileTransactions.length === 0 ? (
                    <div className="border border-border/85 rounded-2xl p-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground/60" />
                      <div>
                        <div className="font-bold text-foreground mb-1 text-base">No Transactions Found</div>
                        <div className="text-xs">Your booking records and receipts will show up here.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                      {profileTransactions.map((tx) => (
                        <div key={tx.id} className="bg-muted/30 border border-border/60 p-5 rounded-2xl flex justify-between items-center gap-4 hover:border-primary/40 transition">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary shrink-0 font-extrabold text-sm uppercase">
                              {tx.service?.charAt(0) || "TX"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-base leading-snug flex items-center gap-2">
                                <span className="truncate">{tx.service}</span>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">{tx.status}</span>
                              </div>
                              <div className="text-sm text-muted-foreground truncate mt-0.5">{tx.details}</div>
                              <div className="text-xs text-muted-foreground/75 mt-0.5">{tx.timestamp} · {tx.id}</div>
                            </div>
                          </div>
                          <span className={`font-bold text-base shrink-0 ${tx.type === "credit" ? "text-emerald-500" : "text-foreground"}`}>
                            {tx.type === "credit" ? "+" : "-"} ₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
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
                <TravelBooking wallet={wallet} setWallet={setWallet} dbServices={dbServices} />
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
                        key={r.from + "-" + r.to}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("autofill-booking", { 
                            detail: { mode: "buses", from: r.from, to: r.to } 
                          }));
                          document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-card border border-border rounded-2xl p-4 hover:border-primary/60 hover:shadow-sm transition cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                            <Bus className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm flex items-center gap-2">
                              {r.from} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /> {r.to}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{r.operators} operators · Fares from {r.fare}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Cabs */}
              <Section id="cabs-section" title="Cabs — choose from wide range of fleet">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredCabs.map((c) => (
                    <div
                      key={c.type}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("autofill-booking", { 
                          detail: { mode: "cabs", cabType: c.type } 
                        }));
                        document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/60 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary">
                          <Car className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">{c.seats}</div>
                          <div className="font-bold text-foreground text-sm mt-0.5">{c.price}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="font-bold text-sm">{c.type}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Shopping & Grocery catalog section */}
              {dbServices.length > 0 && (
                <Section id="shopping-section" title="Exclusive Offers for you">
                  <div className="grid gap-4 md:grid-cols-2">
                    {dbServices.map((item: any) => (
                      <div
                        key={item.service_id}
                        className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-sm transition flex flex-col justify-between relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 px-3 py-1 bg-primary/10 text-primary font-bold text-[10px] rounded-bl-xl uppercase tracking-wider">
                          {item.category}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                            {item.category === "Shopping" ? <ShoppingBag className="w-3.5 h-3.5" /> : <Carrot className="w-3.5 h-3.5" />}
                            {item.provider_name}
                          </div>
                          <h4 className="font-bold text-base mt-1.5 leading-snug">{item.item_name}</h4>
                          <div className="mt-2 text-xs flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${item.available_quantity > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                              {item.available_quantity > 0 ? `Available: ${item.available_quantity}` : "Sold out"}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">Delivery in 1 hr</span>
                          </div>
                        </div>
                        <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
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
                              
                              const nextBalance = wallet.wallet_balance - item.price;
                              const nextWallet = { ...wallet, wallet_balance: nextBalance };
                              setWallet(nextWallet);
                              localStorage.setItem("wallet_profile", JSON.stringify(nextWallet));
                              
                              // Decrement quantity locally
                              setDbServices(prev => prev.map(p => p.service_id === item.service_id ? { ...p, available_quantity: p.available_quantity - 1 } : p));
                              
                              // Record transaction in local history
                              const transactionsLocal = localStorage.getItem("user_transactions");
                              const transactions = transactionsLocal ? JSON.parse(transactionsLocal) : [];
                              const newTx = {
                                id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                                service: item.category === "Shopping" ? "Shopping Order" : "Grocery Order",
                                details: `${item.item_name} from ${item.provider_name}`,
                                amount: item.price,
                                timestamp: new Date().toLocaleString(),
                                status: "Approved"
                              };
                              transactions.unshift(newTx);
                              localStorage.setItem("user_transactions", JSON.stringify(transactions));
                              
                              toast.success("Order Placed Successfully!", {
                                description: `Successfully ordered "${item.item_name}" for ₹${item.price} using your wallet balance!`,
                              });
                              window.dispatchEvent(new CustomEvent("wallet-updated"));
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
        </>
      )}

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

      {/* Sign In Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setShowLoginModal(false)} />
          
          <div className="auth-container relative z-10 animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="auth-heading">Sign In</div>
            
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <input 
                required 
                className="auth-input" 
                type="email" 
                name="email" 
                id="email" 
                placeholder="E-mail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input 
                required 
                className="auth-input" 
                type="password" 
                name="password" 
                id="password" 
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <span className="auth-forgot-password">
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Password recovery is not implemented in this demo."); }}>Forgot Password ?</a>
              </span>
              <input className="auth-login-button" type="submit" value="Sign In" />
            </form>
            
            <div className="auth-social-container">
              <span className="auth-title">Or Sign in with</span>
              <div className="auth-social-accounts">
                <button onClick={() => handleSocialLogin("Google")} className="auth-social-button google">
                  <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 488 512">
                    <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                </button>
                <button onClick={() => handleSocialLogin("Apple")} className="auth-social-button apple">
                  <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
                  </svg>
                </button>
                <button onClick={() => handleSocialLogin("Twitter")} className="auth-social-button twitter">
                  <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <span className="auth-agreement">
              <a href="#" onClick={(e) => { e.preventDefault(); toast.info("User license agreement shown in full system terms."); }}>Learn user licence agreement</a>
            </span>
          </div>
        </div>
      )}

    </div>
  );
}

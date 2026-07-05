import { useState, useEffect } from "react";
import { Train, Bus, Car, ArrowRightLeft, Calendar, MapPin, Search, Loader2, X, Star, Check } from "lucide-react";
import { Toaster, toast } from "sonner";
import { executeDbBooking } from "@/lib/db-server";

type Mode = "trains" | "buses" | "cabs";

const tabs: { key: Mode; label: string; icon: typeof Train }[] = [
  { key: "trains", label: "Trains", icon: Train },
  { key: "buses", label: "Buses", icon: Bus },
  { key: "cabs", label: "Cabs", icon: Car },
];

const classes = ["All Classes", "Sleeper (SL)", "AC 3-Tier (3A)", "AC 2-Tier (2A)", "AC First (1A)", "Chair Car (CC)"];
const cabTypes = ["Hatchback", "Sedan", "SUV", "Premium"];

const today = new Date().toISOString().slice(0, 10);

interface TravelBookingProps {
  defaultMode?: Mode;
  wallet?: any;
  setWallet?: (w: any) => void;
  dbServices?: any[];
}

export function TravelBooking({ defaultMode = "trains" as Mode, wallet, setWallet, dbServices }: TravelBookingProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(today);
  const [returnDate, setReturnDate] = useState("");
  const [travelClass, setTravelClass] = useState(classes[0]);
  const [cabType, setCabType] = useState(cabTypes[1]);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [passengers, setPassengers] = useState(1);
  
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bookingLoadingId, setBookingLoadingId] = useState<string | null>(null);
  const [bookedTicket, setBookedTicket] = useState<any>(null);

  // Listen to autofill booking events from voice commands or quick links
  useEffect(() => {
    const handleAutofill = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.mode) setMode(detail.mode);
      if (detail.from !== undefined) setFrom(detail.from);
      if (detail.to !== undefined) setTo(detail.to);
      if (detail.date !== undefined) setDate(detail.date);
      if (detail.travelClass !== undefined) setTravelClass(detail.travelClass);
      if (detail.cabType !== undefined) setCabType(detail.cabType);
      if (detail.members !== undefined) setPassengers(detail.members);
      
      if (detail.autoSubmit) {
        setIsSearching(true);
        setTimeout(() => {
          setIsSearching(false);
          setShowResults(true);
          
          if (detail.autoBook) {
            setTimeout(() => {
              const categoryLabel = detail.mode === "trains" ? "Train" : detail.mode === "buses" ? "Bus" : "Cab";
              let results: any[] = [];
              if (dbServices && dbServices.length > 0) {
                const filtered = dbServices.filter(s => 
                  s.category.toLowerCase() === categoryLabel.toLowerCase() &&
                  s.source_location?.toLowerCase() === detail.from?.toLowerCase() &&
                  s.destination_location?.toLowerCase() === detail.to?.toLowerCase()
                );
                if (filtered.length > 0) {
                  results = filtered.map(s => ({
                    id: String(s.service_id),
                    isDbService: true,
                    name: s.provider_name,
                    number: s.item_name,
                    departure: s.show_time || "10:00",
                    arrival: "18:00",
                    duration: "8h 00m",
                    price: `₹${s.price}`,
                    type: s.travel_class || "Standard",
                    status: s.status === "Available" ? `AVAILABLE - 00${s.available_quantity}` : "UNAVAILABLE"
                  }));
                }
              }
              
              if (results.length === 0) {
                if (detail.mode === "trains") {
                  results = [
                    { id: "t1", name: "Rajdhani Express", number: "12951", departure: "16:30", arrival: "08:30", duration: "16h 00m", price: "₹650", type: detail.travelClass || "AC 3-Tier", status: "AVAILABLE - 0048" }
                  ];
                } else if (detail.mode === "buses") {
                  results = [
                    { id: "b1", name: "RedBus A/C Sleeper", departure: "20:00", arrival: "06:30", duration: "10h 30m", price: "₹900", rating: "4.7", type: "AC Sleeper (2+1)" }
                  ];
                } else {
                  results = [
                    { id: "c1", name: `Uber ${detail.cabType || "Sedan"}`, price: "₹450", details: "Best for 2-3 passengers", duration: "approx. 4h 30m" }
                  ];
                }
              }
              
              const firstItem = results[0];
              if (firstItem) {
                handleBook(firstItem, detail.members);
              }
            }, 1000);
          }
        }, 1200);
      }
    };
    
    window.addEventListener("autofill-booking", handleAutofill);
    return () => window.removeEventListener("autofill-booking", handleAutofill);
  }, [from, to, mode, dbServices, wallet, passengers]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) {
      toast.error("Please fill in both origin and destination locations.");
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 1200); // 1.2s loading state
  }

  const getMockResults = () => {
    const categoryLabel = mode === "trains" ? "Train" : mode === "buses" ? "Bus" : "Cab";
    
    if (dbServices && dbServices.length > 0) {
      const filtered = dbServices.filter(s => 
        s.category.toLowerCase() === categoryLabel.toLowerCase() &&
        s.source_location?.toLowerCase() === from?.toLowerCase() &&
        s.destination_location?.toLowerCase() === to?.toLowerCase()
      );
      
      if (filtered.length > 0) {
        return filtered.map(s => ({
          id: String(s.service_id),
          isDbService: true,
          name: s.provider_name,
          number: s.item_name,
          departure: s.show_time || "10:00",
          arrival: "18:00",
          duration: "8h 00m",
          price: `₹${s.price}`,
          type: s.travel_class || "Standard",
          status: s.status === "Available" ? `AVAILABLE - 00${s.available_quantity}` : "UNAVAILABLE"
        }));
      }
    }

    if (mode === "trains") {
      return [
        { id: "t1", name: "Rajdhani Express", number: "12951", departure: "16:30", arrival: "08:30", duration: "16h 00m", price: "₹650", type: travelClass || "AC 3-Tier", status: "AVAILABLE - 0048" },
        { id: "t2", name: "Shatabdi Express", number: "12002", departure: "06:00", arrival: "14:15", duration: "8h 15m", price: "₹650", type: travelClass || "AC Chair Car", status: "AVAILABLE - 0120" },
        { id: "t3", name: "Duronto Express", number: "12260", departure: "22:15", arrival: "07:30", duration: "9h 15m", price: "₹650", type: "Sleeper Class", status: "RAC - 0005" }
      ];
    } else if (mode === "buses") {
      return [
        { id: "b1", name: "RedBus A/C Sleeper", departure: "20:00", arrival: "06:30", duration: "10h 30m", price: "₹900", rating: "4.7", type: "AC Sleeper (2+1)" },
        { id: "b2", name: "IntrCity SmartBus Volvo", departure: "21:45", arrival: "08:15", duration: "10h 30m", price: "₹900", rating: "4.5", type: "Volvo A/C Multi-Axle Semi-Sleeper" },
        { id: "b3", name: "RSRTC Express", departure: "07:30", arrival: "15:45", duration: "8h 15m", price: "₹900", rating: "3.9", type: "Non-AC Seater" }
      ];
    } else {
      return [
        { id: "c1", name: `Uber Sedan (${cabType || "Dzire"})`, price: "₹450", details: "Best for 2-3 passengers, 1 small bag", duration: "approx. 4h 30m" },
        { id: "c2", name: `Uber Hatchback (${cabType || "WagonR"})`, price: "₹450", details: "Spacious trunk, 4 seats, premium ride", duration: "approx. 4h 15m" },
        { id: "c3", name: `Uber SUV (${cabType || "Innova"})`, price: "₹450", details: "Best for families, 6 seats, high comfort", duration: "approx. 4h 20m" }
      ];
    }
  };

  const handleBook = async (item: any, membersOverride?: number) => {
    const count = mode === "cabs" ? 1 : (membersOverride !== undefined ? membersOverride : passengers);
    const basePrice = parseFloat(item.price.replace("₹", "").replace(",", ""));
    const priceAmount = basePrice * count;
    
    if (wallet) {
      if (priceAmount > wallet.wallet_balance) {
        toast.error("Insufficient wallet balance.");
        return;
      }
      if (priceAmount > wallet.transaction_limit) {
        toast.error(`Transaction amount exceeds your limit of ₹${wallet.transaction_limit}.`);
        return;
      }
    }

    setBookingLoadingId(item.id);
    
    if (item.isDbService) {
      try {
        const session = localStorage.getItem("user_session");
        let email: string | undefined = undefined;
        if (session && session !== "undefined") {
          try {
            email = JSON.parse(session)?.email;
          } catch (e) {
            console.error("Failed to parse session", e);
          }
        }
        const res = await executeDbBooking({ data: { serviceId: parseInt(item.id), amount: priceAmount, email } });
        if (res && res.success) {
          if (setWallet && wallet) {
            const nextBalance = res.balance;
            const nextWallet = { ...wallet, wallet_balance: nextBalance };
            setWallet(nextWallet);
            localStorage.setItem("wallet_profile", JSON.stringify(nextWallet));
          }
          
          const transactionsLocal = localStorage.getItem("user_transactions");
          const transactions = transactionsLocal ? JSON.parse(transactionsLocal) : [];
          const newTx = {
            id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            service: mode === "trains" ? "Train Ticket" : mode === "buses" ? "Bus Ticket" : "Cab Ride",
            details: `${item.name} (${item.number || "Express"}) from ${from} to ${to} (${count} traveler(s))`,
            amount: priceAmount,
            timestamp: new Date().toLocaleString(),
            status: "Approved"
          };
          transactions.unshift(newTx);
          localStorage.setItem("user_transactions", JSON.stringify(transactions));
          
          if (mode === "trains" || mode === "buses") {
            const ticketId = mode === "trains" 
              ? `PNR-${Math.floor(1000000000 + Math.random() * 9000000000)}` 
              : `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
            const formattedDate = new Date(date || Date.now()).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }).toUpperCase();
            
            const newTicket = {
              mode,
              service: item.name.toUpperCase(),
              number: item.number || "EXPRESS",
              date: formattedDate,
              time: item.departure || "12:00 PM",
              arrival: item.arrival || "08:00 AM",
              seat: mode === "trains" ? `COACH A1 - SEAT ${Math.floor(1 + Math.random() * 64)}` : `SEAT ${Math.floor(1 + Math.random() * 36)}B`,
              id: ticketId,
              from: from.toUpperCase() || "SOURCE",
              to: to.toUpperCase() || "DESTINATION",
              operator: mode === "trains" ? "INDIAN RAILWAYS" : "GRAND BUS EXPRESS",
              qrData: `https://shai.com/ticket/${ticketId}`
            };
            setBookedTicket(newTicket);
          }

          toast.success("Booking Confirmed in Database!", {
            description: `Successfully booked ${item.name} (${item.number || "Express"}) from ${from} to ${to} on ${date} for ${count} traveler(s)!`,
            duration: 5000,
          });
          window.dispatchEvent(new CustomEvent("wallet-updated"));
          window.dispatchEvent(new CustomEvent("booking-completed-voice", { 
            detail: { success: true, itemName: `${item.name} (for ${count} traveler(s))`, itemNumber: item.number, price: priceAmount }
          }));
        } else {
          toast.error("Database transaction failed.");
        }
      } catch (err: any) {
        toast.error(`Database booking failed: ${err.message || err}`);
      } finally {
        setBookingLoadingId(null);
        setShowResults(false);
      }
      return;
    }

    // Local Storage Mock fallback
    setTimeout(() => {
      if (setWallet && wallet) {
        const nextBalance = wallet.wallet_balance - priceAmount;
        const nextWallet = { ...wallet, wallet_balance: nextBalance };
        setWallet(nextWallet);
        localStorage.setItem("wallet_profile", JSON.stringify(nextWallet));
      }
      
      const transactionsLocal = localStorage.getItem("user_transactions");
      const transactions = transactionsLocal ? JSON.parse(transactionsLocal) : [];
      const newTx = {
        id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        service: mode === "trains" ? "Train Ticket" : mode === "buses" ? "Bus Ticket" : "Cab Ride",
        details: `${mode === "cabs" ? item.name : item.name + " (" + (item.number || "Express") + ")"} from ${from} to ${to} (${count} traveler(s))`,
        amount: priceAmount,
        timestamp: new Date().toLocaleString(),
        status: "Approved"
      };
      transactions.unshift(newTx);
      localStorage.setItem("user_transactions", JSON.stringify(transactions));

      if (mode === "trains" || mode === "buses") {
        const ticketId = mode === "trains" 
          ? `PNR-${Math.floor(1000000000 + Math.random() * 9000000000)}` 
          : `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
        const formattedDate = new Date(date || Date.now()).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }).toUpperCase();
        
        const newTicket = {
          mode,
          service: item.name.toUpperCase(),
          number: item.number || "EXPRESS",
          date: formattedDate,
          time: item.departure || "12:00 PM",
          arrival: item.arrival || "08:00 AM",
          seat: mode === "trains" ? `COACH A1 - SEAT ${Math.floor(1 + Math.random() * 64)}` : `SEAT ${Math.floor(1 + Math.random() * 36)}B`,
          id: ticketId,
          from: from.toUpperCase() || "SOURCE",
          to: to.toUpperCase() || "DESTINATION",
          operator: mode === "trains" ? "INDIAN RAILWAYS" : "GRAND BUS EXPRESS",
          qrData: `https://shai.com/ticket/${ticketId}`
        };
        setBookedTicket(newTicket);
      }

      setBookingLoadingId(null);
      setShowResults(false);
      
      toast.success("Booking Confirmed!", {
        description: `Successfully booked ${mode === "cabs" ? item.name : item.name + " (" + (item.number || "Express") + ")"} from ${from} to ${to} on ${date} for ${count} traveler(s)!`,
        duration: 5000,
      });
      window.dispatchEvent(new CustomEvent("wallet-updated"));
      window.dispatchEvent(new CustomEvent("booking-completed-voice", { 
        detail: { success: true, itemName: `${mode === "cabs" ? item.name : item.name + " (" + (item.number || "Express") + ")"} (for ${count} traveler(s))`, itemNumber: item.number || "Express", price: priceAmount }
      }));
    }, 800);
  };

  const handleDirectBook = () => {
    if (!from.trim() || !to.trim()) {
      toast.error(`Please enter both ${mode === "cabs" ? "pickup and drop" : "from and to"} locations.`);
      return;
    }

    const results = getMockResults();
    const firstOption = results[0];
    if (firstOption) {
      handleBook(firstOption);
    } else {
      toast.error("No booking options available.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden relative">
      
      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/40">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = mode === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition relative ${
                active ? "text-primary bg-card" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {active && <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="p-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_auto_1.2fr_1fr_1.5fr_0.8fr_auto] md:items-end">
          {/* From */}
          <Field label={mode === "cabs" ? "Pickup" : "From"} icon={<MapPin className="w-4 h-4 text-primary" />}>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder={mode === "trains" ? "e.g. New Delhi (NDLS)" : mode === "buses" ? "e.g. Delhi ISBT" : "Pickup address"}
              className="bg-transparent outline-none text-base font-semibold w-full placeholder:text-muted-foreground/70 placeholder:font-normal"
            />
          </Field>

          {/* Swap */}
          <button
            type="button"
            onClick={swap}
            className="hidden md:flex w-10 h-10 rounded-full bg-muted hover:bg-accent items-center justify-center text-primary self-center mt-6 cursor-pointer"
            aria-label="Swap"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* To */}
          <Field label={mode === "cabs" ? "Drop" : "To"} icon={<MapPin className="w-4 h-4 text-primary" />}>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={mode === "trains" ? "e.g. Mumbai CST (CSTM)" : mode === "buses" ? "e.g. Jaipur Sindhi Camp" : "Drop address"}
              className="bg-transparent outline-none text-base font-semibold w-full placeholder:text-muted-foreground/70 placeholder:font-normal"
            />
          </Field>

          {/* Date */}
          <Field label={mode === "cabs" ? "Pickup Date" : "Journey Date"} icon={<Calendar className="w-4 h-4 text-primary" />}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent outline-none text-base font-semibold w-full"
            />
          </Field>

          {/* 4th field varies */}
          {mode === "trains" && (
            <Field label="Class">
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="bg-transparent outline-none text-base font-semibold w-full"
              >
                {classes.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}
          {mode === "buses" && (
            <Field label="Return (optional)" icon={<Calendar className="w-4 h-4 text-primary" />}>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="bg-transparent outline-none text-base font-semibold w-full"
              />
            </Field>
          )}
          {mode === "cabs" && (
            <Field label="Cab Type">
              <select
                value={cabType}
                onChange={(e) => setCabType(e.target.value)}
                className="bg-transparent outline-none text-base font-semibold w-full"
              >
                {cabTypes.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}

          {/* 5th field varies: Travelers (trains/buses) or Pickup Time (cabs) */}
          {(mode === "trains" || mode === "buses") && (
            <Field label="Travelers">
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="bg-transparent outline-none text-base font-semibold w-full"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Traveler" : "Travelers"}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {mode === "cabs" && (
            <Field label="Pickup Time">
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="bg-transparent outline-none text-base font-semibold w-full"
              />
            </Field>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 h-[62px]">
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 rounded-2xl border border-border text-foreground hover:bg-muted font-semibold flex items-center justify-center gap-2 transition disabled:opacity-75 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>

            <button
              type="button"
              onClick={handleDirectBook}
              disabled={isSearching || bookingLoadingId !== null}
              className="px-5 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-75 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              Book Now
            </button>
          </div>
        </div>

        {/* Extras row */}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
          {mode === "trains" && (
            <>
              <Chip>Person With Disability</Chip>
              <Chip>Flexible With Date</Chip>
              <Chip>Train with Available Berth</Chip>
              <Chip>Railway Pass Concession</Chip>
            </>
          )}
          {mode === "buses" && (
            <>
              <Chip>AC Sleeper</Chip>
              <Chip>Volvo / Multi-Axle</Chip>
              <Chip>Live Tracking</Chip>
              <Chip>Women Booking</Chip>
            </>
          )}
          {mode === "cabs" && (
            <>
              <Chip>One-way</Chip>
              <Chip>Round trip</Chip>
              <Chip>Airport transfer</Chip>
            </>
          )}
        </div>
      </form>

      {/* SEARCH RESULTS DIALOG MODAL */}
      {showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-250">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/10 to-violet-600/10 px-6 py-5 flex items-center justify-between border-b border-border/80">
              <div>
                <h3 className="text-lg font-bold text-foreground capitalize flex items-center gap-2">
                  Available {mode}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {from} → {to} · {date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {getMockResults().map((item: any) => (
                <div
                  key={item.id}
                  className="border border-border/80 rounded-2xl p-5 hover:border-primary/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">{item.name}</span>
                      {item.number && (
                        <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          #{item.number}
                        </span>
                      )}
                      {item.rating && (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 inline" /> {item.rating}
                        </span>
                      )}
                    </div>
                    
                    {/* Train/Bus Timings */}
                    {item.departure && (
                      <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground">{item.departure}</span>
                        <span>→</span>
                        <span className="text-foreground">{item.arrival}</span>
                        <span className="text-xs font-normal">({item.duration})</span>
                      </div>
                    )}

                    {/* Cab Details */}
                    {item.details && (
                      <p className="text-xs text-muted-foreground">{item.details}</p>
                    )}
                    
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 pt-1">
                      {item.type && <span>Class: <strong className="text-foreground">{item.type}</strong></span>}
                      {item.duration && !item.departure && <span>Duration: <strong className="text-foreground">{item.duration}</strong></span>}
                      {item.status && (
                        <span className={item.status.includes("AVAILABLE") ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-border/60">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total Fare</div>
                      <div className="text-xl font-bold text-primary">{item.price}</div>
                    </div>
                    <button
                      type="button"
                      disabled={bookingLoadingId !== null}
                      onClick={() => handleBook(item)}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition shadow-sm disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
                    >
                      {bookingLoadingId === item.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        "Book Now"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 flex justify-end bg-muted/20">
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="px-4 py-2 border border-border rounded-xl hover:bg-muted text-sm font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Premium Booked Ticket Confirmation Modal */}
      {bookedTicket && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-6 max-w-sm w-full animate-in zoom-in-95 duration-300">
            {/* The Ticket Container */}
            <div className="premium-ticket select-none border border-white/10">
              <div className="top">
                <div className="premium-badge">
                  {bookedTicket.mode === "trains" ? "TRAIN JOURNEY" : "BUS JOURNEY"}
                </div>
                
                <div className="movie-name">
                  {bookedTicket.service}
                </div>

                <div className="info-grid">
                  <div className="info-box">
                    <div className="label">FROM</div>
                    <div className="value truncate">{bookedTicket.from}</div>
                  </div>

                  <div className="info-box">
                    <div className="label">TO</div>
                    <div className="value truncate">{bookedTicket.to}</div>
                  </div>

                  <div className="info-box">
                    <div className="label">DATE</div>
                    <div className="value">{bookedTicket.date}</div>
                  </div>
                </div>
              </div>

              <div className="middle">
                <div className="dashed"></div>
              </div>

              <div className="bottom">
                <div className="qr">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookedTicket.qrData)}`}
                    alt="QR Code"
                  />
                </div>

                <div className="ticket-info">
                  <div className="cinema">
                    {bookedTicket.operator}
                  </div>
                  <div className="ticket-id font-mono text-sm">
                    {bookedTicket.id}
                  </div>
                  <div className="note font-semibold text-white/90 text-[10px] mt-1">
                    {bookedTicket.seat}<br />
                    Departure: {bookedTicket.time}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full justify-center">
              <button
                onClick={() => {
                  toast.success("Ticket saved to local device!");
                }}
                className="flex-1 px-5 py-2.5 rounded-2xl bg-card border border-border text-foreground hover:bg-muted font-bold text-sm transition cursor-pointer shadow-sm"
              >
                Save Ticket
              </button>
              <button
                onClick={() => setBookedTicket(null)}
                className="flex-1 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm transition cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="h-[62px] rounded-2xl border border-border bg-background px-4 flex items-center hover:border-primary/50 focus-within:border-primary transition">
        {children}
      </div>
    </label>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-primary hover:bg-accent transition cursor-pointer"
    >
      {children}
    </button>
  );
}

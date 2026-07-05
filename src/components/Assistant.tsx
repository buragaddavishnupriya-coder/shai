import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, HelpCircle, X, Terminal, CornerDownLeft, Maximize2, ArrowLeft } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { updateDbWalletBalance } from "@/lib/db-server";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface BookingState {
  isActive: boolean;
  mode: "trains" | "buses" | "cabs";
  from?: string;
  to?: string;
  date?: string;
  members?: number;
  travelClass?: string;
  cabType?: string;
  currentField?: "from" | "to" | "date" | "members" | "travelClass" | "cabType";
}

const parseInitialEntities = (text: string) => {
  let from: string | undefined;
  let to: string | undefined;
  let date: string | undefined;
  let members: number | undefined;
  let travelClass: string | undefined;
  let cabType: string | undefined;

  // Extract from [city]
  const fromMatch = text.match(/(?:from|pickup\s+from|pickup\s+at|starting\s+at)\s+([a-zA-Z\s]+?)(?:\s+to|\s+on|\s+for|\s+in|$|\b)/i);
  if (fromMatch) {
    from = fromMatch[1].trim();
    from = from.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // Extract to [city]
  const toMatch = text.match(/(?:to|heading\s+to|going\s+to|destination\s+is|drop\s+at|drop\s+off\s+at)\s+([a-zA-Z\s]+?)(?:\s+from|\s+on|\s+for|\s+in|$|\b)/i);
  if (toMatch) {
    to = toMatch[1].trim();
    to = to.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // Extract date
  if (text.includes("tomorrow")) {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    date = tom.toISOString().slice(0, 10);
  } else if (text.includes("today")) {
    date = new Date().toISOString().slice(0, 10);
  } else if (text.includes("day after tomorrow")) {
    const dat = new Date();
    dat.setDate(dat.getDate() + 2);
    date = dat.toISOString().slice(0, 10);
  } else {
    const dateMatch = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (dateMatch) {
      date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
    } else {
      const shortDateMatch = text.match(/(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      if (shortDateMatch) {
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const m = monthNames.indexOf(shortDateMatch[2].toLowerCase());
        const d = parseInt(shortDateMatch[1]);
        const yr = new Date().getFullYear();
        if (m !== -1) {
          date = `${yr}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }
    }
  }

  // Extract members
  const membersMatch = text.match(/(\d+)\s*(?:member|people|passenger|ticket|seat|person)/i);
  if (membersMatch) {
    members = parseInt(membersMatch[1]);
  } else {
    const wordMap: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    for (const word in wordMap) {
      if (text.includes(word + " member") || text.includes(word + " people") || text.includes(word + " passenger") || text.includes(word + " ticket") || text.includes(word + " seat")) {
        members = wordMap[word];
        break;
      }
    }
  }

  // Extract Class
  if (text.includes("sleeper") || text.includes("sl ")) {
    travelClass = "Sleeper (SL)";
  } else if (text.includes("ac 3") || text.includes("3tier") || text.includes("3 tier") || text.includes("3a")) {
    travelClass = "AC 3-Tier (3A)";
  } else if (text.includes("ac 2") || text.includes("2tier") || text.includes("2 tier") || text.includes("2a")) {
    travelClass = "AC 2-Tier (2A)";
  } else if (text.includes("first class") || text.includes("1a")) {
    travelClass = "AC First (1A)";
  } else if (text.includes("chair car") || text.includes("cc")) {
    travelClass = "Chair Car (CC)";
  }

  // Extract Cab Type
  if (text.includes("hatchback")) {
    cabType = "Hatchback";
  } else if (text.includes("sedan")) {
    cabType = "Sedan";
  } else if (text.includes("suv")) {
    cabType = "SUV";
  } else if (text.includes("premium")) {
    cabType = "Premium";
  }

  return { from, to, date, members, travelClass, cabType };
};

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export function Assistant({ layout = "popup" }: { layout?: "popup" | "page" }) {
  const [isOpen, setIsOpen] = useState(layout === "page");
  const [activeTab, setActiveTab] = useState<"voice" | "text">("voice");
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [textCommand, setTextCommand] = useState("");
  const [status, setStatus] = useState<string>("Click the mic or type a command below.");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingState, setBookingState] = useState<BookingState | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "assistant", text: "Hello! I am your SHAI Assistant. Where would you like to travel today?", timestamp: new Date() }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = (text: string) => {
    if (!soundEnabled) return;
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis?.speak(utterance);
  };

  const respond = (text: string) => {
    setStatus(text);
    speak(text);
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(), sender: "assistant", text, timestamp: new Date() }
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(), sender: "user", text, timestamp: new Date() }
    ]);
  };

  const processBookingState = (state: BookingState) => {
    if (!state.from) {
      state.currentField = "from";
      setBookingState(state);
      respond("Where are you traveling from?");
      return;
    }

    if (!state.to) {
      state.currentField = "to";
      setBookingState(state);
      respond(`Traveling from ${state.from}. Where is your destination?`);
      return;
    }

    if (!state.date) {
      state.currentField = "date";
      setBookingState(state);
      respond("On what date would you like to travel?");
      return;
    }

    if (state.mode !== "cabs" && !state.members) {
      state.currentField = "members";
      setBookingState(state);
      respond("How many passengers are traveling?");
      return;
    }

    if (state.mode !== "cabs" && !state.travelClass) {
      state.currentField = "travelClass";
      setBookingState(state);
      respond("Which class would you prefer? Sleeper, AC 3-Tier, AC 2-Tier, AC First Class, or Chair Car?");
      return;
    }

    if (state.mode === "cabs" && !state.cabType) {
      state.currentField = "cabType";
      setBookingState(state);
      respond("What type of cab? Hatchback, Sedan, SUV, or Premium?");
      return;
    }

    // All fields complete! Execute booking
    setBookingState(null);
    const summary = `Excellent! Booking a ${
      state.mode === "cabs" ? "cab" : state.mode === "buses" ? "bus" : "train"
    } from ${state.from} to ${state.to} on ${state.date} for ${state.members || 1} traveler(s). Initiating automatic booking and payment...`;
    
    respond(summary);

    if (layout === "page") {
      setTimeout(() => {
        navigate({
          to: "/",
          search: (prev: any) => ({
            ...prev,
            autoBookMode: state.mode,
            autoBookFrom: state.from,
            autoBookTo: state.to,
            autoBookDate: state.date,
            autoBookClass: state.travelClass,
            autoBookCabType: state.cabType,
            autoBookMembers: state.members || 1,
          })
        });
      }, 3000);
    } else {
      window.dispatchEvent(new CustomEvent("autofill-booking", {
        detail: {
          mode: state.mode,
          from: state.from,
          to: state.to,
          date: state.date,
          travelClass: state.travelClass,
          cabType: state.cabType,
          members: state.members || 1,
          autoSubmit: true,
          autoBook: true
        }
      }));

      const el = document.getElementById("booking-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, any>;
  
  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN"; // Set to Indian English for better recognition of local names
      
      rec.onstart = () => {
        setIsListening(true);
        setTranscript("");
        setStatus("Listening...");
        setErrorMsg(null);
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleCommand(text);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMsg("Microphone permission denied.");
        } else {
          setErrorMsg(`Error: ${event.error}`);
        }
        setIsListening(false);
        setStatus("Click the mic to try again.");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setErrorMsg("Web Speech API is not supported in this browser.");
    }
  }, []);

  // Listen to booking completion voice notifications
  useEffect(() => {
    const handleVoiceBookingCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.success) {
        const response = `Booking confirmed! Successfully booked ${detail.itemName} for ${detail.price} rupees.`;
        respond(response);
      }
    };
    window.addEventListener("booking-completed-voice", handleVoiceBookingCompleted);
    return () => window.removeEventListener("booking-completed-voice", handleVoiceBookingCompleted);
  }, [soundEnabled]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMsg("Voice recognition not supported.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleCommand = (command: string) => {
    const text = command.toLowerCase().trim();
    addUserMessage(command);
    setStatus(`Executing: "${command}"`);

    // Check cancel/stop
    if (bookingState && (text === "cancel" || text === "exit" || text === "stop" || text === "abort" || text === "stop booking")) {
      setBookingState(null);
      respond("Booking cancelled.");
      return;
    }

    // If active booking flow is in progress
    if (bookingState && bookingState.isActive) {
      const updatedState = { ...bookingState };
      const currentField = updatedState.currentField;

      if (currentField === "from") {
        updatedState.from = command.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      } else if (currentField === "to") {
        updatedState.to = command.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      } else if (currentField === "date") {
        if (text.includes("tomorrow")) {
          const tom = new Date();
          tom.setDate(tom.getDate() + 1);
          updatedState.date = tom.toISOString().slice(0, 10);
        } else if (text.includes("today")) {
          updatedState.date = new Date().toISOString().slice(0, 10);
        } else if (text.includes("day after tomorrow")) {
          const dat = new Date();
          dat.setDate(dat.getDate() + 2);
          updatedState.date = dat.toISOString().slice(0, 10);
        } else {
          const dateMatch = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
          if (dateMatch) {
            updatedState.date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
          } else {
            const shortDateMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
            if (shortDateMatch) {
              const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
              const m = monthNames.indexOf(shortDateMatch[2].toLowerCase());
              const d = parseInt(shortDateMatch[1]);
              const yr = new Date().getFullYear();
              if (m !== -1) {
                updatedState.date = `${yr}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              }
            } else {
              updatedState.date = new Date().toISOString().slice(0, 10);
            }
          }
        }
      } else if (currentField === "members") {
        const num = parseInt(text.replace(/\D/g, ""));
        if (!isNaN(num)) {
          updatedState.members = num;
        } else {
          const wordMap: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
          let found = false;
          for (const word in wordMap) {
            if (text.includes(word)) {
              updatedState.members = wordMap[word];
              found = true;
              break;
            }
          }
          if (!found) {
            respond("Please state the number of members as a digit.");
            return;
          }
        }
      } else if (currentField === "travelClass") {
        if (text.includes("sleeper") || text.includes("sl")) {
          updatedState.travelClass = "Sleeper (SL)";
        } else if (text.includes("ac 3") || text.includes("3tier") || text.includes("3 tier") || text.includes("3a")) {
          updatedState.travelClass = "AC 3-Tier (3A)";
        } else if (text.includes("ac 2") || text.includes("2tier") || text.includes("2 tier") || text.includes("2a")) {
          updatedState.travelClass = "AC 2-Tier (2A)";
        } else if (text.includes("first class") || text.includes("1a")) {
          updatedState.travelClass = "AC First (1A)";
        } else if (text.includes("chair car") || text.includes("cc")) {
          updatedState.travelClass = "Chair Car (CC)";
        } else {
          updatedState.travelClass = "Sleeper (SL)";
        }
      } else if (currentField === "cabType") {
        if (text.includes("hatchback")) {
          updatedState.cabType = "Hatchback";
        } else if (text.includes("sedan")) {
          updatedState.cabType = "Sedan";
        } else if (text.includes("suv")) {
          updatedState.cabType = "SUV";
        } else if (text.includes("premium")) {
          updatedState.cabType = "Premium";
        } else {
          updatedState.cabType = "Sedan";
        }
      }

      processBookingState(updatedState);
      return;
    }

    // Check if the user wants to book something (e.g. train, bus, cab ticket)
    const isBookingRequest = text.includes("book") || text.includes("ticket") || text.includes("reserve") || text.includes("travel") || text.includes("cab") || text.includes("train") || text.includes("bus") || text.includes("journey") || text.includes("ride") || text.includes("flight");
    const isShowCommand = text.includes("show") || text.includes("display") || text.includes("list") || text.includes("balance") || text.includes("history") || text.includes("billing") || text.includes("transaction");

    if (isBookingRequest && !isShowCommand) {
      let mode: "trains" | "buses" | "cabs" = "trains";
      if (text.includes("bus")) {
        mode = "buses";
      } else if (text.includes("cab") || text.includes("taxi") || text.includes("car") || text.includes("uber") || text.includes("ola") || text.includes("ride")) {
        mode = "cabs";
      }

      const initialEntities = parseInitialEntities(text);
      const newState: BookingState = {
        isActive: true,
        mode,
        ...initialEntities
      };

      processBookingState(newState);
      return;
    }

    // Match patterns
    
    // 1. SWITCH CITY: switch/change city to [city], go to [city]
    const cityMatch = text.match(/(?:switch|change|go to)(?:\s+city)?\s+to\s+([a-zA-Z\s]+)/) || 
                      text.match(/go\s+to\s+(gurugram|delhi|mumbai|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|ahmedabad)/);
    
    if (cityMatch) {
      const cityName = cityMatch[1].trim();
      const matchedCity = CITIES.find(
        (c) => c.name.toLowerCase() === cityName || c.slug.toLowerCase() === cityName
      );
      
      if (matchedCity) {
        navigate({ to: "/", search: (prev: any) => ({ ...prev, city: matchedCity.slug }) });
        const response = `Switched city to ${matchedCity.name}`;
        respond(response);
        return;
      }
    }

    // 2. CHECK BALANCE
    if (text.includes("balance") || text.includes("how much money") || text.includes("my wallet balance")) {
      const local = localStorage.getItem("wallet_profile");
      if (local) {
        const w = JSON.parse(local);
        const bal = parseFloat(w.wallet_balance).toLocaleString('en-IN', { maximumFractionDigits: 2 });
        const response = `Your current wallet balance is ${bal} rupees.`;
        respond(response);
        return;
      }
    }

    // 3. TOP UP WALLET
    const topupMatch = text.match(/(?:add|top up|deposit|load)\s*(?:₹|rs\.?|rupees)?\s*(\d+)/) ||
                       text.match(/(\d+)\s*(?:rupees|rs\.?)\s*(?:add|top up|deposit|load)/);
    if (topupMatch) {
      const amount = parseFloat(topupMatch[1]);
      const local = localStorage.getItem("wallet_profile");
      if (local && !isNaN(amount)) {
        const w = JSON.parse(local);
        const newBal = parseFloat(w.wallet_balance) + amount;
        const updatedWallet = { ...w, wallet_balance: newBal };
        localStorage.setItem("wallet_profile", JSON.stringify(updatedWallet));
        
        // Keep DB in sync
        const session = localStorage.getItem("user_session");
        let email: string | undefined = undefined;
        if (session && session !== "undefined") {
          try {
            email = JSON.parse(session)?.email;
          } catch (e) {
            console.error("Failed to parse session", e);
          }
        }
        updateDbWalletBalance({ data: { newBalance: newBal, email } }).catch(console.error);

        // Record transaction
        const transactionsLocal = localStorage.getItem("user_transactions");
        const transactions = transactionsLocal ? JSON.parse(transactionsLocal) : [];
        const newTx = {
          id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          service: "Wallet Top-up",
          details: "Voice command wallet top-up",
          amount: amount,
          timestamp: new Date().toLocaleString(),
          status: "Approved",
          type: "credit"
        };
        transactions.unshift(newTx);
        localStorage.setItem("user_transactions", JSON.stringify(transactions));

        window.dispatchEvent(new CustomEvent("wallet-updated"));
        
        const response = `Added ${amount} rupees to your wallet. Your new balance is ${newBal.toLocaleString('en-IN')} rupees.`;
        respond(response);
        return;
      }
    }

    // 4. TRANSACTION HISTORY
    if (text.includes("transaction") || text.includes("history") || text.includes("billing") || text.includes("records")) {
      window.dispatchEvent(new CustomEvent("open-profile-tab", { detail: { tab: "transactions" } }));
      const response = "Opening your transaction logs.";
      respond(response);
      return;
    }

    // 5. SCROLL TO SECTIONS: go to/show [movies|trains|buses|cabs]
    if (text.includes("movie") || text.includes("cinema") || text.includes("film")) {
      const el = document.getElementById("movies-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        respond("Showing movies near you");
        return;
      }
    }

    if (text.includes("train")) {
      window.dispatchEvent(new CustomEvent("autofill-booking", { detail: { mode: "trains" } }));
      const el = document.getElementById("trains-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      respond("Showing popular train routes");
      return;
    }

    if (text.includes("bus")) {
      window.dispatchEvent(new CustomEvent("autofill-booking", { detail: { mode: "buses" } }));
      const el = document.getElementById("buses-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      respond("Showing popular bus routes");
      return;
    }

    if (text.includes("cab") || text.includes("taxi") || text.includes("car")) {
      window.dispatchEvent(new CustomEvent("autofill-booking", { detail: { mode: "cabs" } }));
      const el = document.getElementById("cabs-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      respond("Showing available cabs");
      return;
    }


    // 7. SEARCH QUERY: search for [X], find [X]
    const searchMatch = text.match(/(?:search for|find|look up)\s+(.+)/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      navigate({ to: "/", search: (prev: any) => ({ ...prev, search: query }) });
      const response = `Searching for "${query}"`;
      respond(response);
      return;
    }

    if (text === "clear search" || text === "reset search" || text === "reset") {
      navigate({ to: "/", search: (prev: any) => ({ ...prev, search: undefined }) });
      respond("Search filter cleared");
      return;
    }

    // Fallback: search for whatever the user said
    navigate({ to: "/", search: (prev: any) => ({ ...prev, search: command }) });
    respond(`Searching for "${command}"`);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textCommand.trim()) return;
    handleCommand(textCommand);
    setTextCommand("");
  };

  const handleSuggestionClick = (cmd: string) => {
    setTextCommand("");
    handleCommand(cmd);
  };

  const suggestions = [
    "Switch city to Bengaluru",
    "Show trains",
    "Show cabs",
    "Book train from Delhi to Mumbai",
    "Search Neon Alpha",
    "Clear search",
  ];

  const chatPanel = (
    <div className={
      layout === "page"
        ? "w-full h-full bg-card border border-border/80 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in fade-in duration-300"
        : "fixed bottom-24 right-6 w-[360px] md:w-[380px] h-[520px] bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-3xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
    }>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-violet-600/10 px-5 py-4 flex items-center justify-between border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          {layout === "page" && (
            <button
              onClick={() => navigate({ to: "/" })}
              className="mr-1 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <img src="/logo-symbol-purple.png" alt="SHAI logo" className="h-5 w-auto object-contain" />
          <span className="font-bold text-sm tracking-tight">SHAI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
            title={soundEnabled ? "Mute audio feedback" : "Enable audio feedback"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          {layout === "popup" && (
            <>
              <Link
                to="/assistant"
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                title="Expand to Full Page"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-border bg-muted/30 p-1 m-2 rounded-xl shrink-0">
        <button
          onClick={() => {
            setActiveTab("voice");
            setErrorMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === "voice" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          Voice Mode
        </button>
        <button
          onClick={() => {
            setActiveTab("text");
            setErrorMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === "text" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Text Console
        </button>
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-muted/10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs md:text-sm font-medium shadow-sm leading-relaxed border ${
              msg.sender === "user"
                ? "bg-gradient-to-r from-primary to-violet-600 text-primary-foreground border-transparent"
                : "bg-card text-foreground border-border/40"
            }`}>
              {msg.text}
              <div className={`text-[9px] mt-1 text-right select-none ${
                msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Action / Form Inputs Area */}
      <div className="border-t border-border p-4 bg-muted/20 flex flex-col gap-3 shrink-0">
        {activeTab === "voice" ? (
          <div className="flex items-center gap-4 py-1">
            <div className="relative">
              {isListening && (
                <>
                  <span className="absolute -inset-2 rounded-full bg-primary/20 animate-ping" />
                  <span className="absolute -inset-4 rounded-full bg-primary/10 animate-pulse duration-1000" />
                </>
              )}
              <button
                onClick={toggleListening}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white shadow-lg scale-105 cursor-pointer"
                    : "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 cursor-pointer"
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex-1 text-left min-w-0">
              {isListening ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-muted-foreground font-semibold italic ml-1 select-none">Listening...</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-medium select-none">Click the mic button to speak</span>
              )}
              
              {transcript && (
                <p className="text-xs text-foreground italic mt-1 font-semibold truncate max-w-[210px] md:max-w-[270px]">
                  "{transcript}"
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Quick Suggestions scroll row */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/50 text-muted-foreground hover:text-primary transition font-medium cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input fields form */}
            <form onSubmit={handleTextSubmit} className="flex gap-2 shrink-0">
              <div className="flex-1 bg-background rounded-xl px-3 h-10 border border-border focus-within:border-primary/50 transition flex items-center shadow-sm">
                <input
                  placeholder="Type a command... (e.g. 'book train')"
                  value={textCommand}
                  onChange={(e) => setTextCommand(e.target.value)}
                  className="bg-transparent outline-none text-xs w-full placeholder:text-muted-foreground font-medium"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition shrink-0 shadow-sm cursor-pointer"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Status / Error Message */}
        <div className="text-center select-none">
          {errorMsg ? (
            <p className="text-[10px] text-red-500 font-semibold">{errorMsg}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground font-medium truncate max-w-full">
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {layout === "popup" && (
        <>
          {/* Floating Action Button */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-[0_8px_30px_rgb(168,85,247,0.4)] hover:shadow-[0_8px_30px_rgb(168,85,247,0.7)] flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none cursor-pointer"
            title="Voice & Text Assistant"
            aria-label="Assistant"
          >
            {isOpen ? <X className="w-6 h-6 animate-in fade-in zoom-in-75 duration-200" /> : <Mic className="w-6 h-6 animate-pulse" />}
          </button>

          {/* Popover Card */}
          {isOpen && chatPanel}
        </>
      )}

      {layout === "page" && chatPanel}
    </>
  );
}

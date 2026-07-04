import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, HelpCircle, X, Terminal, CornerDownLeft } from "lucide-react";
import { CITIES } from "@/lib/cities";

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

export function Assistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"voice" | "text">("voice");
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [textCommand, setTextCommand] = useState("");
  const [status, setStatus] = useState<string>("Click the mic or type a command below.");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
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

  // Text synthesis for feedback
  const speak = (text: string) => {
    if (!soundEnabled) return;
    window.speechSynthesis?.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis?.speak(utterance);
  };

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
    setStatus(`Executing: "${command}"`);

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
        setStatus(response);
        speak(response);
        return;
      }
    }

    // 2. SCROLL TO SECTIONS: go to/show [movies|trains|buses|cabs]
    if (text.includes("movie") || text.includes("cinema") || text.includes("film")) {
      const el = document.getElementById("movies-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setStatus("Showing movies near you");
        speak("Showing movies");
        return;
      }
    }

    if (text.includes("train")) {
      // Set travel booking widget to trains and scroll
      window.dispatchEvent(new CustomEvent("autofill-booking", { detail: { mode: "trains" } }));
      const el = document.getElementById("trains-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      setStatus("Showing popular train routes");
      speak("Showing popular trains");
      return;
    }

    if (text.includes("bus")) {
      // Set travel booking widget to buses and scroll
      window.dispatchEvent(new CustomEvent("autofill-booking", { detail: { mode: "buses" } }));
      const el = document.getElementById("buses-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      setStatus("Showing popular bus routes");
      speak("Showing popular buses");
      return;
    }

    if (text.includes("cab") || text.includes("taxi") || text.includes("car")) {
      // Set travel booking widget to cabs and scroll
      window.dispatchEvent(new CustomEvent("autofill-booking", { detail: { mode: "cabs" } }));
      const el = document.getElementById("cabs-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      setStatus("Showing available cabs");
      speak("Showing cabs");
      return;
    }

    // 3. BOOK JOURNEY: book [train|bus|cab] from [A] to [B]
    const bookingMatch = text.match(/book\s+(train|bus|cab)?\s*(?:from)?\s*([a-zA-Z\s]+)\s+to\s+([a-zA-Z\s]+)/);
    if (bookingMatch) {
      const mode = (bookingMatch[1] || "trains") === "cab" ? "cabs" : (bookingMatch[1] || "trains") === "bus" ? "buses" : "trains";
      const from = bookingMatch[2].replace(/\bfrom\b/g, "").trim();
      const to = bookingMatch[3].trim();

      window.dispatchEvent(new CustomEvent("autofill-booking", { 
        detail: { mode, from, to } 
      }));
      
      const el = document.getElementById("booking-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });

      const modeSingular = mode === "cabs" ? "cab" : mode === "buses" ? "bus" : "train";
      const response = `Fitted details for ${modeSingular} from ${from} to ${to}`;
      setStatus(response);
      speak(`Booking details added for ${from} to ${to}`);
      return;
    }

    // 4. SEARCH QUERY: search for [X], find [X]
    const searchMatch = text.match(/(?:search for|find|look up)\s+(.+)/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      navigate({ to: "/", search: (prev: any) => ({ ...prev, search: query }) });
      const response = `Searching for "${query}"`;
      setStatus(response);
      speak(response);
      return;
    }

    if (text === "clear search" || text === "reset search" || text === "reset") {
      navigate({ to: "/", search: (prev: any) => ({ ...prev, search: undefined }) });
      setStatus("Search filter cleared");
      speak("Search cleared");
      return;
    }

    // Fallback: search for whatever the user said
    navigate({ to: "/", search: (prev: any) => ({ ...prev, search: command }) });
    setStatus(`Searching page for: "${command}"`);
    speak(`Searching for ${command}`);
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

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-[0_8px_30px_rgb(168,85,247,0.4)] hover:shadow-[0_8px_30px_rgb(168,85,247,0.7)] flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none"
        title="Voice & Text Assistant"
        aria-label="Assistant"
      >
        {isOpen ? <X className="w-6 h-6 animate-in fade-in zoom-in-75 duration-200" /> : <Mic className="w-6 h-6 animate-pulse" />}
      </button>

      {/* Popover Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] md:w-[380px] bg-card/90 backdrop-blur-md border border-border/80 shadow-2xl rounded-3xl z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-violet-600/10 px-5 py-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="font-bold text-sm tracking-tight">SHAI Assistant</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title={soundEnabled ? "Mute audio feedback" : "Enable audio feedback"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex border-b border-border bg-muted/30 p-1 m-2 rounded-xl">
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

          {/* Main Content Area */}
          <div className="p-5 min-h-[180px] flex flex-col justify-between">
            {activeTab === "voice" ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-2">
                {/* Voice Visualizer / Mic Button */}
                <div className="relative mb-6">
                  {isListening && (
                    <>
                      <span className="absolute -inset-4 rounded-full bg-primary/20 animate-ping" />
                      <span className="absolute -inset-8 rounded-full bg-primary/10 animate-pulse duration-1000" />
                    </>
                  )}
                  <button
                    onClick={toggleListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? "bg-red-500 text-white shadow-lg hover:bg-red-600 scale-105"
                        : "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                    }`}
                  >
                    {isListening ? <MicOff className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
                  </button>
                </div>

                {/* Transcript Display */}
                <div className="w-full min-h-[44px] max-h-[80px] overflow-y-auto px-4 py-2 bg-muted/40 rounded-xl mb-3">
                  {transcript ? (
                    <p className="text-sm font-medium italic">"{transcript}"</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Speak after clicking the button.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 gap-4">
                {/* Suggestion Chips */}
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Quick suggestions
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/50 text-muted-foreground hover:text-primary transition font-medium text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text input form */}
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-xl px-3 h-10 border border-transparent focus-within:border-primary/50 transition flex items-center">
                    <input
                      placeholder="Type a command... (e.g. 'show trains')"
                      value={textCommand}
                      onChange={(e) => setTextCommand(e.target.value)}
                      className="bg-transparent outline-none text-xs w-full placeholder:text-muted-foreground font-medium"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition shrink-0 shadow-sm"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Error or Success Feedback Status */}
            <div className="mt-3 pt-3 border-t border-border/50 text-center">
              {errorMsg ? (
                <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>
              ) : (
                <p className="text-xs text-muted-foreground font-medium">{status}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

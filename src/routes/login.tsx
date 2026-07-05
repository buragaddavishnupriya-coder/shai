import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, Mail, Lock } from "lucide-react";
import { loginDbUser, registerDbUser, getDbWallet } from "@/lib/db-server";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const res = await loginDbUser({ data: { email, password } });
      if (res.success) {
        localStorage.setItem("user_session", JSON.stringify({ email }));
        
        // Fetch wallet details from DB and cache locally
        try {
          const dbWallet = await getDbWallet({ data: { email } });
          if (dbWallet) {
            localStorage.setItem("wallet_profile", JSON.stringify(dbWallet));
          }
        } catch (dbErr) {
          console.error("Failed to load wallet profile:", dbErr);
        }

        window.dispatchEvent(new CustomEvent("wallet-updated"));
        toast.success("Welcome back!", {
          description: `Signed in as ${email}`,
        });
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerDbUser({ data: { email, password } });
      if (res.success) {
        // Automatically login the user upon registration
        localStorage.setItem("user_session", JSON.stringify({ email }));
        
        // Fetch newly created wallet
        try {
          const dbWallet = await getDbWallet({ data: { email } });
          if (dbWallet) {
            localStorage.setItem("wallet_profile", JSON.stringify(dbWallet));
          }
        } catch (dbErr) {
          console.error("Failed to load wallet profile:", dbErr);
        }

        window.dispatchEvent(new CustomEvent("wallet-updated"));
        toast.success("Account created successfully!", {
          description: `Logged in as ${email}`,
        });
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    const providerEmail = `guest.${provider.toLowerCase()}@shai.com`;
    localStorage.setItem("user_session", JSON.stringify({ email: providerEmail }));
    
    // Create local mock wallet if it doesn't exist
    const mockWallet = {
      full_name: `Guest (${provider})`,
      email: providerEmail,
      phone: "9999999999",
      wallet_balance: 5000.00,
      transaction_limit: 2000.00,
      daily_limit: 3000.00,
    };
    localStorage.setItem("wallet_profile", JSON.stringify(mockWallet));

    window.dispatchEvent(new CustomEvent("wallet-updated"));
    toast.success("Connected successfully!", {
      description: `Logged in using your ${provider} account.`,
    });
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-950/20 flex flex-col items-center justify-center p-4">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition cursor-pointer bg-transparent border-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="w-full max-w-[380px] flex flex-col gap-6 animate-in fade-in duration-300">
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-2">
          <img src="/logo-symbol-purple.png" alt="SHAI" className="h-12 w-auto object-contain" />
          <div className="text-2xl font-extrabold tracking-tight text-primary">SHAI</div>
          <p className="text-xs text-muted-foreground font-semibold">Agent Payment Platform</p>
        </div>

        {/* Auth Box */}
        <div className="bg-card border border-border/80 shadow-2xl rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden backdrop-blur-md">
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/30 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("signin");
                setEmail("");
                setPassword("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === "signin" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === "signup" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {activeTab === "signin" ? (
            <form onSubmit={handleSignIn} className="auth-form">
              <div className="auth-heading hidden">Sign In</div>
              
              <div className="relative">
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input pl-10"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>

              <div className="relative">
                <input
                  required
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input pl-10"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>

              <span className="auth-forgot-password cursor-pointer hover:underline text-right block">
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Password recovery is not implemented in this demo."); }}>Forgot Password ?</a>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="auth-login-button flex items-center justify-center gap-2 cursor-pointer shadow-md border-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="relative">
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input pl-10"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>

              <div className="relative">
                <input
                  required
                  type="password"
                  placeholder="Create Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input pl-10"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>

              <div className="relative">
                <input
                  required
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input pl-10"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-login-button flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 border-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}

          {/* Social Logins */}
          <div className="auth-social-container">
            <span className="auth-title">Or connect with</span>
            <div className="auth-social-accounts">
              <button onClick={() => handleSocialLogin("Google")} className="auth-social-button google cursor-pointer border-0">
                <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 488 512">
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              </button>
              <button onClick={() => handleSocialLogin("Apple")} className="auth-social-button apple cursor-pointer border-0">
                <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
                </svg>
              </button>
              <button onClick={() => handleSocialLogin("Twitter")} className="auth-social-button twitter cursor-pointer border-0">
                <svg className="svg" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

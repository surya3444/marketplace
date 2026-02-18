import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; 
import { useNavigate, Link } from "react-router-dom"; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role;

        if (role === "admin") {
            navigate("/admin/dashboard");
        } else if (role === "vendor") {
            navigate("/vendor/dashboard");
        } else {
            navigate("/"); 
        }
      } else {
        setError("Account exists, but no profile found. Contact support.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      
      {/* Custom Animation Style for Floating Effect */}
      <style>{`
        @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>

      {/* --- 1. REALISTIC BACKGROUND IMAGE --- */}
      <div 
        className="absolute inset-0 z-0"
        style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1535732820275-9e91055fa63a?q=80&w=2070&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      ></div>

      {/* --- 2. OVERLAYS --- */}
      <div className="absolute inset-0 z-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-[3px]"></div>

      {/* Blueprint Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
               backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), 
                                 linear-gradient(to right, #ffffff 1px, transparent 1px)`, 
               backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* --- 3. FLOATING BACKGROUND SYMBOLS (The "Filling") --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          
          {/* Top Left: Hard Hat (Safety) */}
          <div className="absolute top-[15%] left-[10%] text-yellow-400/20 text-7xl" style={{ animation: 'float 6s ease-in-out infinite' }}>
             <i className="fas fa-hard-hat"></i>
          </div>

          {/* Bottom Right: Truck (Logistics) */}
          <div className="absolute bottom-[15%] right-[10%] text-blue-400/20 text-8xl" style={{ animation: 'float 8s ease-in-out infinite 1s' }}>
             <i className="fas fa-truck-pickup"></i>
          </div>

          {/* Top Right: Shopping Bag (Marketplace) */}
          <div className="absolute top-[20%] right-[15%] text-purple-400/20 text-6xl" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
             <i className="fas fa-shopping-bag"></i>
          </div>

          {/* Bottom Left: Tools (Construction) */}
          <div className="absolute bottom-[20%] left-[15%] text-gray-100/10 text-6xl" style={{ animation: 'float 9s ease-in-out infinite 0.5s' }}>
             <i className="fas fa-tools"></i>
          </div>

          {/* Center Left: Materials/Cubes */}
          <div className="absolute top-[50%] left-[5%] text-white/10 text-5xl" style={{ animation: 'float 10s ease-in-out infinite 3s' }}>
             <i className="fas fa-cubes"></i>
          </div>

          {/* Center Right: Drafting Tools */}
          <div className="absolute top-[40%] right-[8%] text-white/10 text-5xl" style={{ animation: 'float 11s ease-in-out infinite 1.5s' }}>
             <i className="fas fa-drafting-compass"></i>
          </div>

          {/* Extra Filler Circles */}
          <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-primary/20 rounded-full blur-[60px]"></div>
          <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-secondary/20 rounded-full blur-[60px]"></div>
      </div>

      {/* --- 4. LOGIN CARD --- */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-96 border border-white/60 dark:border-white/10 relative z-10 animate-fade-in-up">
        
        {/* Decorative Construction Tape Top Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 rounded-t-xl opacity-80"></div>
        
        {/* LOGO SECTION */}
        <div className="flex justify-center mb-8 mt-4">
            <div className="bg-slate-900 p-3.5 rounded-2xl shadow-xl shadow-slate-900/30 transform hover:scale-105 transition duration-300 border border-white/10">
                <img 
                    src="/logo.png" 
                    alt="Rajchavin Logo" 
                    className="h-10 w-auto object-contain" 
                />
            </div>
        </div>

        <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-1">Welcome Back</h2>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Construction Marketplace</p>
        </div>
        
        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-xs font-bold text-center flex items-center justify-center gap-2">
                <i className="fas fa-exclamation-circle"></i> {error}
            </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="group">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 ml-1 group-focus-within:text-primary transition-colors">Email Address</label>
            <div className="relative">
                <input 
                    type="email" 
                    className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition dark:text-white font-medium"
                    placeholder="name@company.com"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"></i>
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 ml-1 group-focus-within:text-primary transition-colors">Password</label>
            <div className="relative">
                <input 
                    type="password" 
                    className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition dark:text-white font-medium"
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"></i>
            </div>
            <div className="flex justify-end mt-1">
                <Link to="/forgot-password" class="text-[10px] font-bold text-gray-400 hover:text-secondary transition">Forgot Password?</Link>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-primary/30 mt-6 flex items-center justify-center gap-2"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-arrow-right"></i>}
            {loading ? "Verifying..." : "Login to Dashboard"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          New Vendor or Buyer? <Link to="/signup" className="text-primary font-bold hover:text-secondary transition underline decoration-2 decoration-transparent hover:decoration-secondary underline-offset-4">Create Account</Link>
        </p>
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-4 text-[10px] text-white/60 font-medium z-10">
        &copy; {new Date().getFullYear()} Rajchavin Construction Marketplace
      </div>
    </div>
  );
};

export default Login;
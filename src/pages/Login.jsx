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
            navigate("/"); // Customer goes home
        }
      } else {
        setError("Account exists, but no profile found. Contact support.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Invalid email or password.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pearl dark:bg-dark transition-colors duration-300">
      <div className="bg-white dark:bg-surface p-8 rounded-2xl shadow-xl w-96 border border-gray-100 dark:border-white/10 relative overflow-hidden">
        
        {/* Decorative Background Blur */}
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
        
        {/* LOGO SECTION */}
        <div className="flex justify-center mb-6">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-lg shadow-slate-900/20 animate-fade-in-up">
                <img 
                    src="/logo.png" 
                    alt="Rajchavin Logo" 
                    className="h-12 w-auto object-contain" 
                />
            </div>
        </div>

        <h2 className="text-3xl font-serif font-bold mb-2 text-center text-slate-900 dark:text-white">Welcome Back</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Sign in to your dashboard</p>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm font-bold text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
            <input 
                type="email" 
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white"
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
            <input 
                type="password" 
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition shadow-lg shadow-primary/30 mt-4 flex items-center justify-center gap-2">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>}
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
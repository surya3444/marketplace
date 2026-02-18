import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { auth } from "../firebase";

const Navbar = () => {
  const { user, role } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();

  // Helper to determine Dashboard Path
  const getDashboardPath = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/customer/dashboard";
  };

  // NEW: Helper to get a display friendly name
  const getUserName = () => {
    if (!user) return "Guest";
    
    // 1. Try to get the First Name from the Display Name
    if (user.displayName) {
        return user.displayName.split(' ')[0]; 
    }
    
    // 2. Fallback: Use the part of the email before '@' and capitalize it
    if (user.email) {
        const emailName = user.email.split('@')[0];
        return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return "User";
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LOGO SECTION */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-slate-900 p-1.5 rounded-xl shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300">
               <img 
                 src="/logo.png" 
                 alt="Rajchavin Logo" 
                 className="h-8 w-auto object-contain" 
               />
            </div>
          </Link>

          {/* Right Side Icons */}
          <div className="flex items-center gap-6">
            
            {/* CART ICON */}
            <Link to="/cart" className="relative group">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-primary hover:text-white transition shadow-sm">
                <i className="fas fa-shopping-cart"></i>
              </div>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Dynamic Dashboard / Login Button */}
            {user ? (
              <div className="flex items-center gap-3">
                  {/* UPDATED: Shows "Hi, [Name]" instead of "My Account" */}
                  <Link to={getDashboardPath()} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition shadow-lg">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <i className="fas fa-user"></i>
                        )}
                    </div>
                    <span className="truncate max-w-[100px]">Hi, {getUserName()}</span>
                  </Link>

                  {/* Logout Icon for mobile/quick access */}
                  <button 
                    onClick={() => { auth.signOut(); navigate('/login'); }} 
                    className="text-gray-400 hover:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full"
                    title="Logout"
                  >
                    <i className="fas fa-sign-out-alt text-xl"></i>
                  </button>
              </div>
            ) : (
              <Link to="/login" className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-secondary transition shadow-lg shadow-primary/30">
                Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
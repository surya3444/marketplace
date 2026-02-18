import { useState, useEffect } from "react"; // Import hooks
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase"; // Import db
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions

const VendorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State to store vendor details
  const [vendorProfile, setVendorProfile] = useState({
    businessName: "Vendor Portal",
    vendorName: ""
  });

  // Fetch Vendor Data on Mount
  useEffect(() => {
    const fetchVendorData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setVendorProfile({
              businessName: data.businessName || "Vendor Portal",
              vendorName: data.vendorName || "Store Owner"
            });
          }
        } catch (error) {
          console.error("Error fetching vendor profile:", error);
        }
      }
    };

    fetchVendorData();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/vendor/dashboard", icon: "fa-chart-line" },
    { name: "My Products", path: "/vendor/products", icon: "fa-box-open" },
    { name: "Orders", path: "/vendor/orders", icon: "fa-clipboard-list" }, 
    { name: "My Profile", path: "/vendor/profile", icon: "fa-store" },
  ];

  return (
    <div className="flex h-screen bg-pearl dark:bg-dark text-slate-900 dark:text-gray-300 transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-r-white/20 flex flex-col z-20 h-full">
        
        {/* HEADER: Updated to show Vendor Name */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-secondary/30 shrink-0">
            <i className="fas fa-store"></i>
          </div>
          <div className="overflow-hidden">
            <h2 className="font-serif font-bold text-lg tracking-wide text-slate-900 dark:text-white leading-tight truncate">
                {vendorProfile.businessName}
            </h2>
            <p className="text-xs text-gray-500 truncate">
                Hi, {vendorProfile.vendorName.split(' ')[0]}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? "bg-secondary text-white shadow-lg shadow-secondary/30" 
                    : "hover:bg-white/50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary"
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center ${isActive ? "text-white" : "text-gray-400 group-hover:text-secondary transition-colors"}`}></i>
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl w-full transition duration-200 group"
          >
            <i className="fas fa-sign-out-alt w-5 text-center group-hover:scale-110 transition-transform"></i>
            <span className="text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-8 scroll-smooth">
        {/* Background Gradients for visuals */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
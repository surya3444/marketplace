import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "fa-chart-pie" },
    { name: "All Orders", path: "/admin/orders", icon: "fa-shopping-cart" }, // <--- Add this
    { name: "All Products", path: "/admin/products", icon: "fa-shopping-cart" }, // <--- Add this
    { name: "Onboard Vendor", path: "/admin/onboard-vendor", icon: "fa-user-plus" },
    { name: "Manage Vendors", path: "/admin/manage-vendors", icon: "fa-users-cog" }, // <--- New Link Added
    { name: "Manage Categories", path: "/admin/categories", icon: "fa-tags" },
  ];

  return (
    <div className="flex h-screen bg-pearl dark:bg-dark text-slate-900 dark:text-gray-300 transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-r-white/20 flex flex-col z-20 h-full">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h2 className="font-serif font-bold text-xl tracking-wide text-slate-900 dark:text-white">Admin Panel</h2>
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
                    ? "bg-primary text-white shadow-lg shadow-primary/30" 
                    : "hover:bg-white/50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center ${isActive ? "text-white" : "text-gray-400 group-hover:text-primary transition-colors"}`}></i>
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
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
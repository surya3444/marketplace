import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext"; 
import { Link } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import logo from "../../assets/logo.png"; // Make sure logo.png is in src/assets/

const VendorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  
  // Real Metrics State
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    activeProducts: 0,
    pendingOrders: 0,
    rating: 5.0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) return;

      try {
        // 1. Fetch Active Products Count
        // We assume products have 'vendorId' field
        const productsQuery = query(
            collection(db, "products"), 
            where("vendorId", "==", user.uid)
        );
        const productsSnap = await getDocs(productsQuery);
        const productCount = productsSnap.size;

        // 2. Fetch Orders (For Sales & Pending Count)
        // We assume orders have 'vendorId' field
        const ordersQuery = query(
            collection(db, "orders"), 
            where("vendorId", "==", user.uid)
        );
        const ordersSnap = await getDocs(ordersQuery);

        let salesSum = 0;
        let pendingCount = 0;

        ordersSnap.docs.forEach(doc => {
            const data = doc.data();
            // Calculate Total Revenue (excluding rejected/cancelled)
            if (data.status !== 'rejected' && data.status !== 'cancelled') {
                salesSum += Number(data.totalAmount) || 0;
            }
            // Count Pending Orders
            if (data.status === 'pending') {
                pendingCount++;
            }
        });

        // 3. Fetch Vendor Rating (From User Profile)
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};
        
        setMetrics({
            totalSales: salesSum,
            activeProducts: productCount,
            pendingOrders: pendingCount,
            rating: userData.stars || 5.0
        });

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);
  
  // Stats Configuration
  const stats = [
    { 
        title: "Total Revenue", 
        value: `₹${metrics.totalSales.toLocaleString()}`, 
        icon: "fa-wallet", 
        color: "text-green-500", 
        bg: "bg-green-500/10" 
    },
    { 
        title: "Active Listings", 
        value: metrics.activeProducts, 
        icon: "fa-boxes", 
        color: "text-blue-500", 
        bg: "bg-blue-500/10" 
    },
    { 
        title: "Pending Orders", 
        value: metrics.pendingOrders, 
        icon: "fa-bell", 
        color: "text-orange-500", 
        bg: "bg-orange-500/10" 
    },
    { 
        title: "My Rating", 
        value: metrics.rating, 
        icon: "fa-star", 
        color: "text-yellow-500", 
        bg: "bg-yellow-500/10" 
    },
  ];

  if (loading) return <div className="p-10 text-gray-500 animate-pulse">Loading Dashboard...
  <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.9] dark:opacity-[0.05]">
        <img src={logo} alt="Brand Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
      </div>
  </div>;

  return (
    <div className="relative min-h-[80vh]">
      
      {/* --- BACKGROUND LOGO --- */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.9] dark:opacity-[0.05]">
        <img src={logo} alt="Brand Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
      </div>

      {/* --- FOREGROUND CONTENT --- */}
      <div className="relative z-10">
        <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">Vendor Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back! Manage your store performance here.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-default bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/20">
                <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl`}>
                <i className={`fas ${stat.icon}`}></i>
                </div>
            </div>
            ))}
        </div>

            
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/vendor/add-product" className="group">
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-300 dark:border-white/10 hover:border-secondary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition cursor-pointer h-full">
                <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition duration-300 shadow-sm">
                    <i className="fas fa-plus"></i>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add New Product</h3>
                <p className="text-sm text-gray-500 mt-1">List a new item for sale in the marketplace</p>
                </div>
            </Link>
            
            <div className="glass-panel p-8 rounded-2xl text-center flex flex-col justify-center items-center h-full bg-white/60 dark:bg-black/40 backdrop-blur-md">
                {metrics.pendingOrders > 0 ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-2xl mb-4 animate-bounce">
                            <i className="fas fa-exclamation"></i>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Action Required</h3>
                        <p className="text-sm text-gray-500 mt-1">You have {metrics.pendingOrders} pending orders to process.</p>
                        <Link to="/vendor/orders" className="mt-4 text-primary font-bold hover:underline">Go to Orders &rarr;</Link>
                    </>
                ) : (
                    <>
                        <i className="fas fa-clipboard-check text-4xl text-gray-300 mb-3"></i>
                        <p className="text-gray-500">No pending orders. You are all caught up!</p>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
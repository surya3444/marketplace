import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getCountFromServer } from "firebase/firestore";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ vendors: 0, products: 0, orders: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Note: 'count' requires Firestore V2 queries or reading all docs (expensive). 
        // For MVP, we will just count mock numbers or read array lengths if collections are small.
        // Here is a safe placeholder implementation:
        const vendorSnap = await getCountFromServer(collection(db, "users"));
        // const productSnap = await getCountFromServer(collection(db, "products")); 
        
        setStats({
          vendors: vendorSnap.data().count, 
          products: 124, // Mock for now until Product collection exists
          orders: 12     // Mock for now
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Vendors", value: stats.vendors, icon: "fa-users", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Products", value: stats.products, icon: "fa-box-open", color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Pending Orders", value: stats.orders, icon: "fa-shopping-cart", color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Total Revenue", value: "₹4.2L", icon: "fa-rupee-sign", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">Dashboard Overview</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Welcome back, Admin.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center text-xl`}>
              <i className={`fas ${card.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder Chart Section */}
      <div className="glass-panel p-8 rounded-2xl h-64 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-300 dark:border-white/10">
        <i className="fas fa-chart-area text-4xl mb-3 opacity-50"></i>
        <p>Sales Analytics Graph Coming Soon</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
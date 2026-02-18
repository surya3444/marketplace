import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext"; // To get current Vendor ID
import { Link } from "react-router-dom";
// Note: We will fetch real data later. For now, placeholders.

const VendorDashboard = () => {
  const { user } = useContext(AuthContext);
  
  // Mock Stats
  const stats = [
    { title: "Total Sales", value: "₹0", icon: "fa-wallet", color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Active Products", value: "0", icon: "fa-boxes", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "New Orders", value: "0", icon: "fa-bell", color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Rating", value: "5.0", icon: "fa-star", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">Vendor Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back! Manage your store performance here.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-default">
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
        <Link to="/vendor/add-product" className="glass-panel ...">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-300 dark:border-white/10 hover:border-secondary transition cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
            <i className="fas fa-plus"></i>
          </div>
          <h3 className="font-bold text-lg dark:text-white">Add New Product</h3>
          <p className="text-sm text-gray-500 mt-1">List a new item for sale</p>
        </div>
        </Link>
        
        <div className="glass-panel p-8 rounded-2xl text-center flex flex-col justify-center">
            <i className="fas fa-clipboard-check text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">No recent orders found.</p>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
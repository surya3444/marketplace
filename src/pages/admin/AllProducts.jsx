import { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase"; 
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

// --- SUB-COMPONENT: PRODUCT ANALYTICS MODAL ---
const ProductAnalyticsModal = ({ product, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Orders for this Product
  useEffect(() => {
    const fetchProductHistory = async () => {
      try {
        // Fetch ALL orders (Optimized: In a real app, you'd filter by 'items.productId' in Firestore)
        // For now, we fetch all and filter client-side to ensure we catch every instance
        const q = query(collection(db, "orders")); 
        const snapshot = await getDocs(q);
        
        const relevantOrders = [];
        
        snapshot.docs.forEach(doc => {
          const orderData = doc.data();
          // Check if this product exists in the order's 'items' array
          // We assume items have a 'productId' or we match by Name strictly
          const itemMatch = orderData.items?.find(item => 
             item.productId === product.id || item.name === product.name
          );

          if (itemMatch) {
            relevantOrders.push({
              id: doc.id,
              customer: orderData.customerName || "Unknown",
              status: orderData.status,
              date: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date(),
              qtyPurchased: itemMatch.quantity || 1,
              itemTotal: (itemMatch.price || product.price) * (itemMatch.quantity || 1)
            });
          }
        });

        setOrders(relevantOrders);
      } catch (error) {
        console.error("Error fetching product history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductHistory();
  }, [product]);

  // 2. Calculate Deep Metrics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const accepted = orders.filter(o => o.status === "accepted" || o.status === "delivered" || o.status === "shipped").length;
    const rejected = orders.filter(o => o.status === "rejected" || o.status === "cancelled").length;
    const pending = totalOrders - accepted - rejected;
    
    // Revenue from this product only (not total order value)
    const totalRevenue = orders
        .filter(o => o.status !== "rejected" && o.status !== "cancelled")
        .reduce((acc, curr) => acc + Number(curr.itemTotal), 0);

    const totalUnitsSold = orders
        .filter(o => o.status !== "rejected" && o.status !== "cancelled")
        .reduce((acc, curr) => acc + Number(curr.qtyPurchased), 0);

    return { totalOrders, accepted, rejected, pending, totalRevenue, totalUnitsSold };
  }, [orders]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-start bg-gray-50 dark:bg-white/5">
          <div className="flex gap-5">
            <img 
              src={product.images?.[0] || product.image || "https://via.placeholder.com/100"} 
              alt={product.name} 
              className="w-24 h-24 rounded-xl object-cover border border-gray-200 shadow-sm"
            />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{product.name}</h2>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                  {product.category}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                  Vendor: {product.vendorName}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">Current Price: <strong className="text-slate-900 dark:text-white">₹{product.price}</strong> | Stock: <strong className={product.stock < 10 ? "text-red-500" : "text-green-500"}>{product.stock}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition">
            <i className="fas fa-times text-xl text-gray-500"></i>
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div className="overflow-y-auto p-8 bg-gray-50/50 dark:bg-black/20">
            {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse">Analyzing Order History...</div>
            ) : (
                <div className="space-y-8">
                    
                    {/* 1. KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue Generated</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Units Sold</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalUnitsSold}</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase">Success Rate</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                    {stats.totalOrders > 0 ? Math.round((stats.accepted / stats.totalOrders) * 100) : 0}%
                                </p>
                                <span className="text-xs text-gray-500 mb-1">Acceptance</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                             <p className="text-xs font-bold text-gray-400 uppercase">Current Inventory Val.</p>
                             <p className="text-3xl font-bold text-purple-600 mt-1">
                                ₹{((Number(product.price) * (Number(product.stock) || 0))).toLocaleString()}
                             </p>
                        </div>
                    </div>

                    {/* 2. CHARTS & GRAPHS AREA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Order Status Breakdown */}
                        <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 dark:text-white">Order Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-green-600 font-bold">Accepted/Delivered</span>
                                        <span>{stats.accepted}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div style={{width: `${(stats.accepted / stats.totalOrders) * 100}%`}} className="h-full bg-green-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-red-600 font-bold">Rejected/Cancelled</span>
                                        <span>{stats.rejected}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div style={{width: `${(stats.rejected / stats.totalOrders) * 100}%`}} className="h-full bg-red-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-yellow-600 font-bold">Pending Action</span>
                                        <span>{stats.pending}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div style={{width: `${(stats.pending / stats.totalOrders) * 100}%`}} className="h-full bg-yellow-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders List */}
                        <div className="md:col-span-2 bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 dark:text-white">Who ordered this?</h3>
                            <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                                <table className="w-full text-left text-sm text-gray-500">
                                    <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">Customer</th>
                                            <th className="px-4 py-2">Qty</th>
                                            <th className="px-4 py-2">Value</th>
                                            <th className="px-4 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length > 0 ? orders.map(order => (
                                            <tr key={order.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                                                <td className="px-4 py-3 text-xs">{order.date.toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{order.customer}</td>
                                                <td className="px-4 py-3">{order.qtyPurchased}</td>
                                                <td className="px-4 py-3 font-bold">₹{order.itemTotal}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${
                                                        order.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                                                        order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="p-4 text-center text-gray-400 italic">No orders for this product yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT: ALL PRODUCTS ---
const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null); // STATE FOR MODAL

  // Analysis State
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortConfig, setSortConfig] = useState("newest"); 

  // 1. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Vendors Map
        const vendorsQuery = query(collection(db, "users"), where("role", "==", "vendor"));
        const vendorSnapshot = await getDocs(vendorsQuery);
        const vendorMap = {};
        vendorSnapshot.docs.forEach(doc => {
          const data = doc.data();
          vendorMap[doc.id] = data.businessName || data.name || "Unknown Vendor";
        });

        // Fetch Products
        const productsRef = collection(db, "products");
        const productSnapshot = await getDocs(productsRef);
        
        const allProducts = productSnapshot.docs.map(doc => {
          const data = doc.data();
          const vId = data.vendorId || "unknown";
          return {
            id: doc.id,
            path: "products/" + doc.id,
            vendorId: vId,
            vendorName: vendorMap[vId] || "Unknown",
            ...data
          };
        });

        setProducts(allProducts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle Delete
  const handleDelete = async (e, productId, path) => {
    e.stopPropagation(); // Prevent opening modal when clicking delete
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, path));
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.vendorName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (selectedVendor !== "All") result = result.filter(p => p.vendorName === selectedVendor);
    if (selectedCategory !== "All") result = result.filter(p => p.category === selectedCategory);

    switch (sortConfig) {
      case "price-high": result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price-low": result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "stock-low": 
        result.sort((a, b) => (isNaN(a.stock) ? 100 : Number(a.stock)) - (isNaN(b.stock) ? 100 : Number(b.stock))); 
        break;
      default: result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
    return result;
  }, [products, search, selectedVendor, selectedCategory, sortConfig]);

  // Stats
  const stats = useMemo(() => {
    const totalValue = processedProducts.reduce((acc, curr) => acc + (Number(curr.price) * (isNaN(curr.stock) ? 0 : Number(curr.stock))), 0);
    const avgPrice = processedProducts.length > 0 ? processedProducts.reduce((acc, curr) => acc + Number(curr.price), 0) / processedProducts.length : 0;
    const uniqueVendors = [...new Set(products.map(p => p.vendorName).filter(n => n !== "Unknown"))].sort();
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    return { totalValue, avgPrice, uniqueVendors, uniqueCategories };
  }, [processedProducts, products]);

  if (loading) return <div className="p-10 text-slate-900 dark:text-white animate-pulse">Running Analytics Engine...</div>;

  return (
    <div className="p-8 pb-20 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Product Intelligence</h1>
          <p className="text-gray-500">Click on any product to see detailed performance analytics.</p>
        </div>
        <div className="flex gap-4">
            {/* Summary Cards */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 text-center min-w-[120px]">
                <p className="text-xs text-blue-500 font-bold uppercase">Total Listings</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{processedProducts.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 text-center min-w-[120px]">
                <p className="text-xs text-green-500 font-bold uppercase">Inv. Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
            </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 bg-gray-50 dark:bg-black/20 border border-gray-200 rounded-lg p-2.5 dark:text-white"
          />
        </div>
        <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="bg-gray-50 dark:bg-black/20 border border-gray-200 rounded-lg p-2.5 dark:text-white">
          <option value="All">All Vendors</option>
          {stats.uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-50 dark:bg-black/20 border border-gray-200 rounded-lg p-2.5 dark:text-white">
          <option value="All">All Categories</option>
          {stats.uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortConfig} onChange={(e) => setSortConfig(e.target.value)} className="bg-gray-50 dark:bg-black/20 border border-gray-200 rounded-lg p-2.5 dark:text-white">
          <option value="newest">Newest First</option>
          <option value="price-high">Price: High to Low</option>
          <option value="stock-low">Stock: Low (Risk)</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-white/5 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-white/10">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Vendor</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedProducts.map((product) => (
              <tr 
                key={product.id} 
                onClick={() => setSelectedProduct(product)} // OPEN MODAL ON CLICK
                className="border-b border-gray-200 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={product.images?.[0] || product.image || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-200" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">{product.vendorName}</span>
                </td>
                <td className="px-6 py-4">{product.category}</td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">₹{Number(product.price).toLocaleString()}</td>
                <td className="px-6 py-4">
                  {(!isNaN(product.stock) && Number(product.stock) < 10) ? (
                    <span className="text-red-500 font-bold"><i className="fas fa-exclamation-circle"></i> {product.stock}</span>
                  ) : (<span className="text-green-500 font-bold">{product.stock}</span>)}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={(e) => handleDelete(e, product.id, product.path)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition z-10 relative"
                    title="Delete Product"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RENDER MODAL IF PRODUCT SELECTED */}
      {selectedProduct && (
        <ProductAnalyticsModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
        />
      )}

    </div>
  );
};

export default AllProducts;
import { useState, useEffect, useContext } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";

const VendorOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // 'pending', 'accepted', 'rejected'
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Orders
  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), where("vendorId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      // Sort by Date (Newest First)
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
      
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // 2. Filter Logic (Search + Tab)
  useEffect(() => {
    let result = orders;

    // A. Filter by Tab Status
    if (activeTab === "pending") {
        result = result.filter(o => o.status === "pending");
    } else if (activeTab === "accepted") {
        result = result.filter(o => o.status === "accepted" || o.status === "shipped");
    } else if (activeTab === "rejected") {
        result = result.filter(o => o.status === "rejected");
    }

    // B. Filter by Search (Order ID or Customer Name)
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(o => 
            o.id.toLowerCase().includes(lowerTerm) || 
            (o.customerName && o.customerName.toLowerCase().includes(lowerTerm))
        );
    }

    setFilteredOrders(result);
  }, [orders, activeTab, searchTerm]);


  // 3. Helper: Group Orders by Date
  const groupOrdersByDate = (orderList) => {
    const groups = {};
    
    orderList.forEach(order => {
        if (!order.createdAt) return;
        
        const date = order.createdAt.toDate();
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (date.toDateString() === today.toDateString()) {
            dateKey = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateKey = "Yesterday";
        }

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(order);
    });

    return groups;
  };

  // 4. Actions
  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        // Optimistic Update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
        alert("Error updating order");
    }
  };

  const simulateOrder = async () => {
    await addDoc(collection(db, "orders"), {
      vendorId: user.uid,
      customerName: "Suresh Patil",
      customerPhone: "9876543210",
      customerAddress: "Station Road, Gadag",
      items: [{ name: "Sand (River)", qty: 2, unit: "Trip", price: 4500 }],
      totalAmount: 9000,
      status: "pending",
      createdAt: serverTimestamp()
    });
    fetchOrders();
  };

  const groupedOrders = groupOrdersByDate(filteredOrders);
  const dateKeys = Object.keys(groupedOrders); // Since orders are already sorted, keys will be roughly in order, but objects don't guarantee order. 
  // Let's rely on the input array sort order which `groupOrdersByDate` preserves in the arrays.

  return (
    <div className="pb-20 max-w-6xl mx-auto px-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Order Management</h1>
            <p className="text-gray-500 text-sm">Manage incoming requests and shipments.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={simulateOrder} className="text-xs bg-gray-200 dark:bg-white/10 px-3 py-1 rounded hover:bg-gray-300 transition">
                 + Test Order
            </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="sticky top-0 z-30 bg-pearl dark:bg-dark pt-4 pb-2 mb-6 space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
                type="text" 
                placeholder="Search by Order ID or Customer Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-primary transition shadow-sm"
            />
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-white/10">
            {['pending', 'accepted', 'rejected'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-full text-sm font-bold capitalize transition whitespace-nowrap ${
                        activeTab === tab 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                        : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                >
                    {tab} 
                    <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-md text-xs">
                        {orders.filter(o => o.status === tab).length}
                    </span>
                </button>
            ))}
        </div>
      </div>

      {/* ORDERS LIST (Grouped by Date) */}
      <div className="space-y-8">
        {dateKeys.length === 0 ? (
           <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
             <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
             <p className="text-gray-500">No {activeTab} orders found.</p>
           </div>
        ) : (
          dateKeys.map(date => (
            <div key={date} className="animate-fade-in-up">
              
              {/* Date Header */}
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 ml-2 tracking-wider flex items-center gap-2">
                <i className="far fa-calendar"></i> {date}
              </h3>

              <div className="space-y-4">
                {groupedOrders[date].map(order => (
                  <div key={order.id} className="glass-panel p-0 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-primary/50 transition duration-300">
                    
                    {/* Top Bar: ID & Total */}
                    <div className="bg-gray-50 dark:bg-white/5 px-4 py-2 flex justify-between items-center text-xs text-gray-500 border-b border-gray-100 dark:border-white/5">
                        <span className="font-mono">#{order.id.slice(0, 8)}</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300">Total: ₹{order.totalAmount}</span>
                    </div>

                    <div className="p-4 flex flex-col md:flex-row gap-6">
                        
                        {/* 1. Items List */}
                        <div className="flex-1 space-y-2">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {item.qty}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-gray-400">{item.unit} • ₹{item.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 2. Customer Info (Blurred if Pending) */}
                        <div className="md:w-1/3 border-l border-gray-100 dark:border-white/5 md:pl-6 pl-0">
                             {order.status === "pending" ? (
                                <div className="relative p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                                    <div className="filter blur-[3px] opacity-60 select-none text-sm space-y-1">
                                        <p>Rajesh Kumar</p>
                                        <p>+91 99000 00000</p>
                                        <p>Gadag, Karnataka</p>
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-yellow-700 text-xs font-bold">
                                        <i className="fas fa-lock mb-1"></i>
                                        <span>Accept to Reveal</span>
                                    </div>
                                </div>
                             ) : (
                                <div className="text-sm space-y-1 animate-fade-in">
                                    <p className="font-bold text-slate-900 dark:text-white"><i className="fas fa-user text-gray-400 mr-2 w-4"></i>{order.customerName}</p>
                                    <p className="text-blue-500 hover:underline"><i className="fas fa-phone text-gray-400 mr-2 w-4"></i><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></p>
                                    <p className="text-gray-500 text-xs"><i className="fas fa-map-marker-alt text-gray-400 mr-2 w-4"></i>{order.customerAddress}</p>
                                </div>
                             )}
                        </div>

                        {/* 3. Action Buttons */}
                        <div className="flex flex-col gap-2 justify-center md:w-32">
                            {order.status === "pending" && (
                                <>
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, "accepted")}
                                        className="w-full bg-green-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition shadow-lg shadow-green-500/20"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, "rejected")}
                                        className="w-full bg-red-50 text-red-500 border border-red-100 py-2 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            
                            {order.status === "accepted" && (
                                <button className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-xs font-bold cursor-default">
                                    <i className="fas fa-check-circle text-green-500 mr-1"></i> Accepted
                                </button>
                            )}

                            {order.status === "rejected" && (
                                <button className="w-full bg-red-50 text-red-400 py-2 rounded-lg text-xs font-bold cursor-default">
                                    Rejected
                                </button>
                            )}
                        </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorOrders;
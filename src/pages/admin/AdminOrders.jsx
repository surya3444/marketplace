import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, orderBy, limit, getDocs, startAfter, where } from "firebase/firestore";

// --- SUB-COMPONENT: LIFECYCLE MODAL (Drill Down) ---
const LifecycleModal = ({ type, id, name, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalVal: 0, count: 0, successRate: 0, rejectedVal: 0 });

  useEffect(() => {
    const fetchLifecycle = async () => {
      // Query specific to the actor (Vendor or Customer)
      const field = type === "vendor" ? "vendorId" : "customerName"; // Using Name for customer for demo (UID is better in prod)
      const q = query(collection(db, "orders"), where(field, "==", id), orderBy("createdAt", "desc"));
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate Deep Metrics
      const total = data.length;
      const accepted = data.filter(o => o.status === 'accepted' || o.status === 'shipped').length;
      const totalMoney = data.reduce((acc, curr) => acc + (curr.status !== 'rejected' ? curr.totalAmount : 0), 0);
      const lostMoney = data.reduce((acc, curr) => acc + (curr.status === 'rejected' ? curr.totalAmount : 0), 0);

      setMetrics({
        totalVal: totalMoney,
        count: total,
        successRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0,
        rejectedVal: lostMoney
      });
      setHistory(data);
      setLoading(false);
    };
    fetchLifecycle();
  }, [type, id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-white/10">
        
        {/* Modal Header */}
        <div className={`p-6 text-white flex justify-between items-start ${type === 'vendor' ? 'bg-gradient-to-r from-purple-600 to-indigo-700' : 'bg-gradient-to-r from-orange-500 to-pink-600'}`}>
           <div>
             <span className="text-xs font-bold uppercase tracking-widest opacity-80">{type === 'vendor' ? 'VENDOR INTELLIGENCE' : 'CUSTOMER DOSSIER'}</span>
             <h2 className="text-3xl font-bold mt-1">{name}</h2>
             <p className="text-sm opacity-80 font-mono mt-1">ID: {id}</p>
           </div>
           <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition"><i className="fas fa-times"></i></button>
        </div>

        {/* Vital Stats Grid */}
        <div className="grid grid-cols-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            <div className="p-4 text-center border-r border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 uppercase font-bold">Total Orders</p>
                <p className="text-2xl font-bold dark:text-white">{metrics.count}</p>
            </div>
            <div className="p-4 text-center border-r border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 uppercase font-bold">Success Rate</p>
                <p className={`text-2xl font-bold ${metrics.successRate > 80 ? 'text-green-500' : 'text-yellow-500'}`}>{metrics.successRate}%</p>
            </div>
            <div className="p-4 text-center border-r border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 uppercase font-bold">Lifetime Value</p>
                <p className="text-2xl font-bold text-emerald-500">₹{metrics.totalVal.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center">
                <p className="text-xs text-gray-500 uppercase font-bold">Lost Revenue</p>
                <p className="text-2xl font-bold text-red-500">₹{metrics.rejectedVal.toLocaleString()}</p>
            </div>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/20">
           {loading ? <div className="text-center py-10">Loading Lifecycle...</div> : (
             <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-4 space-y-8">
                {history.map((order, idx) => (
                    <div key={order.id} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                            order.status === 'accepted' ? 'bg-green-500' : 
                            order.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        
                        {/* Event Card */}
                        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                        order.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                                        order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>{order.status}</span>
                                    <span className="text-xs text-gray-400 ml-2">{order.createdAt?.toDate().toLocaleString()}</span>
                                </div>
                                <span className="font-bold font-mono dark:text-white">#{order.id.slice(0,6)}</span>
                            </div>
                            
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-bold dark:text-gray-300">{order.items.length} Items</p>
                                    <p className="text-xs text-gray-500 truncate w-48">{order.items.map(i => i.name).join(", ")}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">₹{order.totalAmount.toLocaleString()}</p>
                                    {type === 'vendor' && <p className="text-[10px] text-emerald-500 font-bold">Comm: ₹{(order.totalAmount * 0.05).toFixed(0)}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE ---
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Drill Down State
  const [lifecycleView, setLifecycleView] = useState(null); // { type: 'vendor'|'customer', id: string, name: string }

  // Global Dashboard Stats (Derived from loaded orders)
  const [stats, setStats] = useState({
    totalProcessed: 0,
    acceptedValue: 0,
    rejectedValue: 0,
    pendingValue: 0,
    commissionEarned: 0
  });

  const fetchOrders = async (isNextPage = false) => {
    setLoading(true);
    try {
      let q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50)); // Load 50 for better stats
      if (isNextPage && lastDoc) {
        q = query(collection(db, "orders"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(50));
      }

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        
        const updatedList = isNextPage ? [...orders, ...newOrders] : newOrders;
        setOrders(updatedList);
        calculateStats(updatedList);
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const calculateStats = (data) => {
    const s = { totalProcessed: 0, acceptedValue: 0, rejectedValue: 0, pendingValue: 0, commissionEarned: 0 };
    
    data.forEach(o => {
        s.totalProcessed += o.totalAmount;
        if (o.status === 'accepted' || o.status === 'shipped') {
            s.acceptedValue += o.totalAmount;
            s.commissionEarned += (o.totalAmount * 0.05);
        } else if (o.status === 'rejected') {
            s.rejectedValue += o.totalAmount;
        } else {
            s.pendingValue += o.totalAmount;
        }
    });
    setStats(s);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 pb-20 min-h-screen bg-gray-50 dark:bg-dark">
      
      {/* 1. FINANCIAL INTELLIGENCE DASHBOARD */}
      <div className="mb-8">
         <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-6">Financial Intelligence</h1>
         
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Accepted (Real Revenue) */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-green-500 flex flex-col justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Realized GMV (Accepted)</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.acceptedValue.toLocaleString()}</h2>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(stats.acceptedValue / stats.totalProcessed) * 100}%` }}></div>
                </div>
            </div>

            {/* Commission (Your Cut) */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-surface">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Projected Commission</p>
                <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">₹{stats.commissionEarned.toLocaleString()}</h2>
                <p className="text-[10px] text-gray-400 mt-2">Based on 5% take rate</p>
            </div>

            {/* Pending (Pipeline) */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-yellow-400">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pipeline (Pending)</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.pendingValue.toLocaleString()}</h2>
                <div className="mt-4 flex items-center text-xs text-yellow-600 font-bold">
                    <i className="fas fa-clock mr-1"></i> Action Required
                </div>
            </div>

            {/* Rejected (Lost) */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-red-500 opacity-80 hover:opacity-100 transition">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Lost Volume (Rejected)</p>
                <h2 className="text-2xl font-bold text-red-500">₹{stats.rejectedValue.toLocaleString()}</h2>
                <p className="text-[10px] text-red-400 mt-2">Potential revenue leakage</p>
            </div>
         </div>
      </div>


      {/* 2. ORDER COMMAND CENTER */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl min-h-[500px] flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
            <h3 className="font-bold text-slate-700 dark:text-gray-200">Transaction Logs</h3>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search Logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none focus:border-primary"
                />
                <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400"></i>
            </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Vendor (Lifecycle)</th>
                        <th className="px-4 py-3">Customer (History)</th>
                        <th className="px-4 py-3 text-right">Value</th>
                        <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-blue-50/50 dark:hover:bg-white/5 transition group">
                            
                            {/* Date */}
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-slate-900 dark:text-white font-bold">{order.createdAt?.toDate().toLocaleDateString()}</div>
                                <div className="text-[10px]">{order.createdAt?.toDate().toLocaleTimeString()}</div>
                                <div className="text-[10px] font-mono text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition">#{order.id.slice(0,6)}</div>
                            </td>

                            {/* Vendor (Clickable) */}
                            <td className="px-4 py-3">
                                <button 
                                    onClick={() => setLifecycleView({ type: 'vendor', id: order.vendorId, name: 'Vendor ' + order.vendorId.slice(0,5) })}
                                    className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-2 py-1 rounded-md -ml-2 transition cursor-pointer"
                                >
                                    <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                                        <i className="fas fa-store"></i>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-purple-700 dark:text-purple-400">Vendor ID: {order.vendorId.slice(0,5)}</div>
                                        <div className="text-[10px] text-gray-400">View Lifecycle &rarr;</div>
                                    </div>
                                </button>
                            </td>

                            {/* Customer (Clickable) */}
                            <td className="px-4 py-3">
                                <button 
                                    onClick={() => setLifecycleView({ type: 'customer', id: order.customerName, name: order.customerName })}
                                    className="flex items-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 px-2 py-1 rounded-md -ml-2 transition cursor-pointer"
                                >
                                    <div className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-slate-800 dark:text-white">{order.customerName}</div>
                                        <div className="text-[10px] text-gray-400">View History &rarr;</div>
                                    </div>
                                </button>
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-3 text-right">
                                <div className="font-bold text-slate-900 dark:text-white">₹{order.totalAmount.toLocaleString()}</div>
                                <div className="text-[10px] text-emerald-500 font-bold">Comm: ₹{(order.totalAmount * 0.05).toFixed(0)}</div>
                            </td>

                            {/* Status Badge */}
                            <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    order.status === 'accepted' ? 'bg-green-50 border-green-200 text-green-700' :
                                    order.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                                    'bg-yellow-50 border-yellow-200 text-yellow-700'
                                }`}>
                                    {order.status}
                                </span>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <button onClick={() => fetchOrders(true)} className="w-full py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 border-t border-gray-200 dark:border-white/10 transition">
            LOAD MORE RECORDS
        </button>
      </div>

      {/* RENDER MODAL IF OPEN */}
      {lifecycleView && (
        <LifecycleModal 
            type={lifecycleView.type} 
            id={lifecycleView.id} 
            name={lifecycleView.name} 
            onClose={() => setLifecycleView(null)} 
        />
      )}

    </div>
  );
};

export default AdminOrders;
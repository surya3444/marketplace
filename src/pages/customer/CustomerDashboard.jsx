import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const CustomerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        // Query orders where customerId matches logged in user
        const q = query(
            collection(db, "orders"), 
            where("customerId", "==", user.uid)
        );
        const snap = await getDocs(q);
        // Sort manually by date (newest first) since Firestore requires an index for orderBy
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.createdAt - a.createdAt);
        
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-pearl dark:bg-dark">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">My Account</h1>
            <p className="text-gray-500">Welcome back, <span className="font-bold text-primary">{user?.displayName}</span></p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 rounded-xl border border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <i className="fas fa-sign-out-alt mr-2"></i> Logout
          </button>
        </div>

        {/* Orders Section */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
            Order History
          </h2>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
              <button onClick={() => navigate('/')} className="text-primary font-bold hover:underline">Browse Products</button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition">
                  
                  {/* Order Header */}
                  <div className="bg-gray-50 dark:bg-white/5 p-4 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase">Order Placed</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                            {order.createdAt?.toDate().toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase">Total Amount</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">₹{order.totalAmount}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold w-fit ${
                            order.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-600'
                        }`}>
                            {order.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">ID: {order.id.slice(0, 8)}</div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 bg-white dark:bg-black/20">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 mb-4 last:mb-0">
                            <img 
                                src={item.image || 'https://via.placeholder.com/80'} 
                                alt={item.name} 
                                className="w-16 h-16 object-cover rounded-lg border border-gray-100 dark:border-white/5"
                            />
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-500">Qty: {item.qty} {item.unit}</p>
                                <p className="text-xs text-primary font-bold mt-1">₹ {item.price}</p>
                            </div>
                        </div>
                    ))}
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

export default CustomerDashboard;
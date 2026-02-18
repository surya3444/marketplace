import { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    line1: "",
    city: "",
    pincode: "",
    phone: user?.phoneNumber || "" // Pre-fill if available
  });

  // Redirect if cart is empty
  if (cart.length === 0) {
    navigate("/");
    return null;
  }

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. GROUP ITEMS BY VENDOR
      // We cannot send one big order if items belong to different vendors.
      const ordersByVendor = {};

      cart.forEach((item) => {
        if (!ordersByVendor[item.vendorId]) {
          ordersByVendor[item.vendorId] = [];
        }
        ordersByVendor[item.vendorId].push(item);
      });

      // 2. CREATE ORDERS IN FIRESTORE
      const orderPromises = Object.keys(ordersByVendor).map(async (vendorId) => {
        const vendorItems = ordersByVendor[vendorId];
        const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

        await addDoc(collection(db, "orders"), {
          vendorId: vendorId,
          customerId: user.uid,
          customerName: user.displayName || "Valued Customer",
          customerPhone: address.phone,
          customerAddress: `${address.line1}, ${address.city} - ${address.pincode}`,
          items: vendorItems.map(item => ({
            productId: item.id,
            name: item.name,
            qty: item.qty,
            unit: item.unit,
            price: item.price,
            image: item.images?.[0] || ""
          })),
          totalAmount: vendorTotal,
          status: "pending", // Vendor needs to accept this
          createdAt: serverTimestamp()
        });
      });

      await Promise.all(orderPromises);

      // 3. SUCCESS
      clearCart();
      alert("Order Placed Successfully! You can track it in your profile.");
      navigate("/"); // Or navigate to an 'Order Success' page

    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-pearl dark:bg-dark">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT: Shipping Form */}
          <div className="md:col-span-2">
            <div className="glass-panel p-6 rounded-2xl mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                <i className="fas fa-map-marker-alt mr-2 text-primary"></i> Delivery Address
              </h2>
              
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Street Address / Site Location</label>
                  <input required name="line1" onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white" placeholder="Plot No. 45, Near Temple..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">City</label>
                    <input required name="city" onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white" placeholder="Gadag" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Pincode</label>
                    <input required name="pincode" onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white" placeholder="582101" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Contact Number</label>
                  <input required type="tel" name="phone" value={address.phone} onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white" placeholder="9876543210" />
                  <p className="text-xs text-gray-400 mt-1">Vendors will call this number for delivery coordination.</p>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div>
            <div className="glass-panel p-6 rounded-2xl sticky top-24">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Order Summary</h3>
              
              <div className="max-h-60 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 truncate w-32">{item.name} <span className="text-xs text-gray-400">x{item.qty}</span></span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-900 dark:text-white">Total to Pay</span>
                  <span className="font-bold text-primary text-xl">₹ {cartTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Cash on Delivery (COD) / Pay on Site</p>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-500/30 flex justify-center items-center gap-2"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                {loading ? "Placing Order..." : "Confirm Order"}
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
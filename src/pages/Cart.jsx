import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";

const Cart = () => {
  const { cart, updateQty, removeFromCart, cartTotal } = useContext(CartContext);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex flex-col items-center justify-center text-center px-4 bg-pearl dark:bg-dark">
        <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
            <i className="fas fa-shopping-basket text-4xl text-gray-400"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Looks like you haven't added any construction materials yet.</p>
        <Link to="/" className="px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-secondary transition shadow-lg shadow-primary/30">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-pearl dark:bg-dark">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8">Shopping Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: Cart Items */}
          <div className="flex-1 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center group transition hover:border-primary/30">
                
                {/* Top Section on Mobile: Image + Details */}
                <div className="flex items-center gap-4 flex-1 w-full">
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Details (min-w-0 added to prevent flexbox blowout on truncate) */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate pr-2 sm:pr-4">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-1 sm:mb-2">{item.category} • {item.unit}</p>
                    <div className="font-bold text-primary text-sm sm:text-base">₹ {item.price}</div>
                  </div>
                </div>

                {/* Bottom Section on Mobile: Quantity + Remove */}
                <div className="flex items-center justify-between w-full sm:w-auto border-t sm:border-none pt-3 sm:pt-0 border-gray-100 dark:border-white/10 mt-1 sm:mt-0">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
                    <button 
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-black/20 hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition"
                    >
                      <i className="fas fa-minus text-xs"></i>
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white w-6 text-center">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-black/20 hover:bg-gray-200 text-gray-600 transition"
                    >
                      <i className="fas fa-plus text-xs"></i>
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition sm:ml-2"
                  >
                      <i className="fas fa-trash-alt text-sm sm:text-base"></i>
                  </button>
                </div>
                
              </div>
            ))}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:w-96">
            <div className="glass-panel p-6 rounded-2xl sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₹ {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Charges</span>
                  <span className="text-green-500 font-bold">Notifyed By vendor</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-900 dark:text-white text-lg">Total</span>
                  <span className="font-bold text-primary text-2xl">₹ {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate("/checkout")}
                className="w-full bg-secondary text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition shadow-lg shadow-secondary/30 flex justify-center items-center gap-2 text-lg"
              >
                Checkout <i className="fas fa-arrow-right"></i>
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-4">
                <i className="fas fa-shield-alt mr-1"></i> Secure Checkout
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;
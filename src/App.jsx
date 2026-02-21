import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // <--- 1. Import Cart Provider

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup"; // <--- Import
import Home from "./pages/Home";
import Cart from "./pages/Cart"; // <--- Import this
import Checkout from "./pages/Checkout"; // <--- Import
import ProductDetails from "./pages/ProductDetails"; // <--- 2. Import Product Details

// Admin Components
import AdminLayout from "./pages/admin/AdminLayout"; 
import AdminDashboard from "./pages/admin/AdminDashboard"; 
import VendorOnboarding from "./pages/admin/VendorOnboarding"; 
import VendorList from "./pages/admin/VendorList"; 
import CategoryManager from "./pages/admin/CategoryManager"; 
import AdminOrders from "./pages/admin/AdminOrders"; // <--- Import
import AllProducts from "./pages/admin/AllProducts";
import AdminPromotions from "./pages/admin/AdminPromotions"; // Import the page
import AdminCustomers from "./pages/admin/AdminCustomers";

// Vendor Components
import VendorLayout from "./pages/vendor/VendorLayout";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import AddProduct from "./pages/vendor/AddProduct"; 
import MyProducts from "./pages/vendor/MyProducts"; 
import VendorOrders from "./pages/vendor/VendorOrders"; 
import VendorProfile from "./pages/vendor/VendorProfile";

// Customer Components
import CustomerDashboard from "./pages/customer/CustomerDashboard"; // <--- Import

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; 

// --- 1. Protected Route Component ---
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) return null; 
  
  if (!user) return <Navigate to="/login" replace />;
  if (roleRequired && role !== roleRequired) return <Navigate to="/" replace />;

  return children;
};

// --- 2. Layout Wrapper (Handles Theme, Loader & Nav) ---
const Layout = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Hide Public Navbar/Footer on Admin & Vendor pages
  const isPublicPage = !location.pathname.startsWith("/admin") && !location.pathname.startsWith("/vendor");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`font-sans antialiased text-slate-900 dark:bg-dark dark:text-gray-300 ${loading ? '' : 'loaded'}`}>
      
      {/* Shutter Loader Animation */}
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <div className="shutter shutter-top"></div>
        <div className="shutter shutter-bottom"></div>
        <div className={`loader-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] flex flex-col items-center transition-opacity duration-500 ${loading ? 'opacity-100' : 'opacity-0'}`}>
          <div className="cube-loader">
            {[...Array(6)].map((_, i) => <div key={i} className="cube-face"></div>)}
          </div>
          <div className="mt-10 font-sans text-sm tracking-[0.3em] text-secondary uppercase animate-pulse">
            Constructing Ecosystem
          </div>
        </div>
      </div>

      {/* Navigation */}
      {isPublicPage && <Navbar />}

      {/* Main Content */}
      <main className={isPublicPage ? "min-h-screen" : "h-screen"}>
        {children}
      </main>

      {/* Footer */}
      {isPublicPage && <Footer />}
    </div>
  );
};

// --- 3. Main App Component ---
function App() {
  return (
    <AuthProvider>
      <CartProvider> {/* <--- 3. Wrap everything in CartProvider */}
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} /> {/* <--- Add this Route */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/product/:id" element={<ProductDetails />} /> {/* <--- 4. New Product Route */}

              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute roleRequired="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="onboard-vendor" element={<VendorOnboarding />} />
                <Route path="manage-vendors" element={<VendorList />} />
                <Route path="categories" element={<CategoryManager />} />
                <Route path="orders" element={<AdminOrders />} /> {/* <--- Add this */}
                <Route path="/admin/products" element={<AllProducts />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="promotions" element={<AdminPromotions />} />
              </Route>

              {/* Protected Vendor Routes */}
              <Route path="/vendor" element={
                <ProtectedRoute roleRequired="vendor">
                    <VendorLayout />
                  </ProtectedRoute>
                }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="add-product" element={<AddProduct />} />
                <Route path="products" element={<MyProducts />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="/vendor/profile" element={<VendorProfile />} />
              </Route>


              {/* CUSTOMER ROUTES */}
                <Route path="/customer/dashboard" element={
                  <ProtectedRoute roleRequired="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

              {/* Protected Checkout Route */}
                <Route path="/checkout" element={
                    <ProtectedRoute> {/* Defaults to requiring just "user" login */}
                        <Checkout />
                    </ProtectedRoute>
                } />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";
import HeroSection from "../components/Home/HeroSection";

// --- PRODUCT CARD COMPONENT (Same as before) ---
const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];

  return (
    <div className="glass-panel rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition duration-300 flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="h-64 relative bg-white dark:bg-white/5 block group/slider">
        <img 
          src={images[currentImageIndex] || 'https://via.placeholder.com/300'} 
          alt={product.name} 
          className="w-full h-full object-cover transition duration-500" 
        />
        {/* ... (Existing image slider logic) ... */}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/product/${product.id}`}>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 truncate hover:text-primary transition">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-400 mb-3">{product.category}</p>
        <div className="mt-auto flex items-center justify-between">
            <div>
                <span className="text-xl font-bold text-primary">₹{product.price}</span>
                <span className="text-xs text-gray-400 ml-1">/ {product.unit}</span>
            </div>
            <button 
                onClick={(e) => { e.preventDefault(); addToCart(product); }}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center transition"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN HOME COMPONENT ---
const Home = () => {
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]); // Store Vendors
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          // 1. Fetch Categories
          const catSnap = await getDocs(collection(db, "categories"));
          setCategories(["All", ...catSnap.docs.map(doc => doc.data().name)]);
  
          // 2. Fetch Products
          const prodQuery = query(collection(db, "products"), where("status", "==", "active"));
          const prodSnap = await getDocs(prodQuery);
          setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // 3. Fetch Vendors (Shops)
          const vendorQuery = query(collection(db, "users"), where("role", "==", "vendor"));
          const vendorSnap = await getDocs(vendorQuery);
          setVendors(vendorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);
  
    // Filter Products for Grid
    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // --- NEW: MIXED SEARCH RESULTS (Vendors + Products) ---
    const productResults = searchTerm 
      ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : [];
    
    const vendorResults = searchTerm
      ? vendors.filter(v => v.businessName?.toLowerCase().includes(searchTerm.toLowerCase()))
      : [];
  
    return (
      <div className="bg-pearl dark:bg-dark min-h-screen transition-colors duration-300 pb-20">
        
        {/* 1. HERO SLIDER */}
        <HeroSection />

        {/* 2. FLOATING SEARCH BAR (With Multi-Search) */}
        <div className="px-4 relative z-30 -mt-10 mb-16"> {/* Adjusted margin for better overlap */}
            <div className="max-w-3xl mx-auto relative">
                <div className="relative group">
                    <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:blur-2xl transition duration-500"></div>
                    <input 
                        type="text"
                        placeholder="Search for products, shops, or brands..."
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-5 rounded-full shadow-2xl outline-none focus:ring-4 ring-primary/30 text-lg border border-gray-100 dark:border-white/10 relative z-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="absolute right-3 top-3 bg-primary text-white w-12 h-12 rounded-full font-bold hover:bg-secondary transition shadow-lg z-20 flex items-center justify-center text-xl">
                        <i className="fas fa-search"></i>
                    </button>
                </div>

                {/* --- LIVE DROPDOWN RESULTS --- */}
                {searchTerm && (
                    <div className="absolute top-full left-4 right-4 mt-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[400px] overflow-y-auto z-50 text-left border border-gray-100 dark:border-white/10 animate-fade-in-up scrollbar-hide p-2">
                        
                        {/* A. SHOPS SECTION */}
                        {vendorResults.length > 0 && (
                            <div className="mb-2">
                                <h5 className="px-4 py-2 text-xs font-bold uppercase text-gray-400 tracking-wider">Shops & Vendors</h5>
                                {vendorResults.map(vendor => (
                                    <Link to={`/vendor-profile/${vendor.id}`} key={vendor.id} className="flex items-center gap-4 p-3 hover:bg-secondary/10 rounded-xl transition group">
                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-lg">
                                            {vendor.profilePic ? <img src={vendor.profilePic} className="w-full h-full rounded-full object-cover"/> : <i className="fas fa-store"></i>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-secondary">{vendor.businessName}</h4>
                                            <p className="text-[10px] text-gray-500">Verified Seller</p>
                                        </div>
                                        <i className="fas fa-chevron-right text-gray-300"></i>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* B. PRODUCTS SECTION */}
                        {productResults.length > 0 && (
                            <div>
                                <h5 className="px-4 py-2 text-xs font-bold uppercase text-gray-400 tracking-wider">Products</h5>
                                {productResults.map(product => (
                                    <Link to={`/product/${product.id}`} key={product.id} className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition">
                                        <img src={product.images?.[0]} alt={product.name} className="w-10 h-10 object-cover rounded-lg bg-gray-200"/>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{product.name}</h4>
                                            <span className="text-primary font-bold text-xs">₹{product.price}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {vendorResults.length === 0 && productResults.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <i className="fas fa-search text-2xl mb-2 opacity-50"></i>
                                <p>No results found for "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
  
        {/* 3. CATEGORIES & PRODUCTS GRID (Same as before) */}
        <section className="px-4 mb-12 max-w-7xl mx-auto">
             {/* ... (Existing Category Filter Code) ... */}
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {categories.map((cat, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`snap-start px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition border ${
                            selectedCategory === cat 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' 
                            : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
             </div>
        </section>

        <section className="px-4 mb-20 max-w-7xl mx-auto">
             {/* ... (Existing Product Grid Code) ... */}
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
             </div>
        </section>
  
      </div>
    );
  };
  
  export default Home;
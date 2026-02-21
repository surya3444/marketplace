import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import HeroSection from "../components/Home/HeroSection";

// --- PRODUCT CARD COMPONENT (More Compact) ---
const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];

  return (
    <div className="glass-panel rounded-xl overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition duration-300 flex flex-col h-full border border-gray-100 dark:border-white/5">
      <Link to={`/product/${product.id}`} className="h-48 relative bg-gray-100 dark:bg-white/5 block group/slider">
        <img 
          src={images[currentImageIndex] || 'https://via.placeholder.com/300'} 
          alt={product.name} 
          className="w-full h-full object-cover transition duration-500" 
        />
        {/* Simplified Out of Stock Badge */}
        {product.stock !== 'Available' && (
            <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur text-white px-2 py-0.5 text-[10px] font-bold rounded">Out of Stock</div>
        )}
      </Link>
      
      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/product/${product.id}`}>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-0.5 line-clamp-2 hover:text-primary transition leading-tight">{product.name}</h3>
        </Link>
        <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">{product.category}</p>
        
        <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-lg font-bold text-primary leading-none">₹{product.price}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">per {product.unit}</span>
            </div>
            <button 
                onClick={(e) => { e.preventDefault(); addToCart(product); }}
                className="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition shadow-sm"
            >
                <i className="fas fa-plus text-sm"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN HOME COMPONENT ---
const Home = () => {
    const { user, role } = useContext(AuthContext); // Brought in AuthContext for mobile nav
    const navigate = useNavigate();
    
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const catSnap = await getDocs(collection(db, "categories"));
          setCategories(["All", ...catSnap.docs.map(doc => doc.data().name)]);
  
          const prodQuery = query(collection(db, "products"), where("status", "==", "active"));
          const prodSnap = await getDocs(prodQuery);
          setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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
  
    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const productResults = searchTerm ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) : [];
    const vendorResults = searchTerm ? vendors.filter(v => v.businessName?.toLowerCase().includes(searchTerm.toLowerCase())) : [];

    // Helper for Mobile Dashboard Navigation
    const getDashboardPath = () => {
        if (role === "admin") return "/admin/dashboard";
        if (role === "vendor") return "/vendor/dashboard";
        return "/customer/dashboard";
    };

    // Testimonial Data
    const testimonials = [
        { name: "Rahul S.", role: "Builder", text: "Found all my cement and steel suppliers in one place. Saved 15% on my last project.", rating: 5 },
        { name: "Priya M.", role: "Homeowner", text: "The interior design vendors verified here are top-notch. Highly recommend!", rating: 5 },
        { name: "Amit K.", role: "Contractor", text: "Easy ordering, transparent pricing. It completely changed how I source materials.", rating: 4 }
    ];
  
    return (
      <div className="bg-pearl dark:bg-dark min-h-screen transition-colors duration-300 pb-20 relative">
        
        {/* MOBILE ONLY DASHBOARD ACCESS FLOATING BUTTON */}
        {user && (
            <button 
                onClick={() => navigate(getDashboardPath())}
                className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce"
            >
                <i className="fas fa-user-circle text-2xl"></i>
            </button>
        )}

        {/* 1. HERO SLIDER */}
        <HeroSection />

        {/* 2. FLOATING SEARCH BAR & TAGLINE */}
        <div className="px-4 relative z-30 -mt-8 mb-8">
            <div className="max-w-3xl mx-auto relative">
                <div className="relative group">
                    <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:blur-2xl transition duration-500"></div>
                    <input 
                        type="text"
                        placeholder="Search materials, shops, or brands..."
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-4 rounded-full shadow-2xl outline-none focus:ring-4 ring-primary/30 text-base md:text-lg border border-gray-100 dark:border-white/10 relative z-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="absolute right-2 top-2 bg-primary text-white w-10 h-10 md:w-12 md:h-12 rounded-full font-bold hover:bg-secondary transition shadow-lg z-20 flex items-center justify-center text-lg">
                        <i className="fas fa-search"></i>
                    </button>
                </div>

                {/* Tagline */}
                <div className="text-center mt-6 px-4">
                    <p className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300 tracking-wide">
                        Connect with Verified Real-Estate Vendors, Designers, and Construction Partners — <span className="text-primary font-bold">All in One Marketplace.</span>
                    </p>
                </div>

                {/* --- LIVE DROPDOWN RESULTS --- */}
                {searchTerm && (
                    <div className="absolute top-16 left-4 right-4 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[300px] overflow-y-auto z-50 text-left border border-gray-100 dark:border-white/10 animate-fade-in-up scrollbar-hide p-2">
                        {vendorResults.length > 0 && (
                            <div className="mb-2">
                                <h5 className="px-4 py-2 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Shops</h5>
                                {vendorResults.map(vendor => (
                                    <Link to={`/vendor-profile/${vendor.id}`} key={vendor.id} className="flex items-center gap-3 p-2 hover:bg-secondary/10 rounded-xl transition group">
                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm"><i className="fas fa-store"></i></div>
                                        <div className="flex-1"><h4 className="font-bold text-sm text-slate-900 dark:text-white">{vendor.businessName}</h4></div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {productResults.length > 0 && (
                            <div>
                                <h5 className="px-4 py-2 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Products</h5>
                                {productResults.map(product => (
                                    <Link to={`/product/${product.id}`} key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition">
                                        <img src={product.images?.[0]} className="w-8 h-8 object-cover rounded bg-gray-200"/>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{product.name}</h4>
                                            <span className="text-primary font-bold text-xs">₹{product.price}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
  
        {/* 3. CATEGORIES FILTER */}
        <section className="px-4 mb-8 max-w-7xl mx-auto">
             <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {categories.map((cat, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`snap-start px-5 py-2 rounded-full whitespace-nowrap font-bold text-xs md:text-sm transition border ${
                            selectedCategory === cat 
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/30' 
                            : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
             </div>
        </section>

        {/* 4. COMPACT PRODUCT GRID */}
        <section className="px-4 mb-20 max-w-7xl mx-auto">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
             </div>
             
             {filteredProducts.length === 0 && !loading && (
                 <div className="col-span-full py-20 text-center text-gray-500 bg-white/50 dark:bg-white/5 rounded-2xl">
                     <i className="fas fa-box-open text-4xl mb-3 text-gray-300"></i>
                     <p>No products found.</p>
                 </div>
             )}
        </section>

        {/* 5. TESTIMONIALS SECTION */}
        <section className="bg-white/50 dark:bg-surface/50 py-16 border-t border-gray-200 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">Trusted by Builders</h2>
                    <p className="text-sm text-gray-500 mt-2">Hear what our community has to say</p>
                </div>
                
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide">
                    {testimonials.map((t, idx) => (
                        <div key={idx} className="min-w-[280px] md:min-w-[350px] snap-center bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                            <div>
                                <div className="flex text-yellow-400 text-xs mb-3">
                                    {[...Array(t.rating)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm italic leading-relaxed">"{t.text}"</p>
                            </div>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
  
      </div>
    );
  };
  
  export default Home;
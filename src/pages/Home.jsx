import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

// --- SUB-COMPONENT: Product Card with Slider ---
const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition duration-300 flex flex-col">
      <Link to={`/product/${product.id}`} className="h-64 relative bg-white dark:bg-white/5 block group/slider">
        <img 
          src={images[currentImageIndex] || 'https://via.placeholder.com/300'} 
          alt={product.name} 
          className="w-full h-full object-cover transition duration-500" 
        />
        {product.stock !== 'Available' && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-20">
                <span className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded">Out of Stock</span>
            </div>
        )}
        {hasMultipleImages && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition z-10">
                <i className="fas fa-chevron-left text-xs"></i>
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition z-10">
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full shadow-sm ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}></div>
                ))}
              </div>
            </>
        )}
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
                onClick={(e) => {
                    e.preventDefault();
                    addToCart(product);
                }}
                disabled={product.stock !== 'Available'}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-primary hover:text-white text-slate-900 dark:text-white flex items-center justify-center transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const HERO_SLIDES = [
    { img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070", title: "Build Your Legacy", sub: "Premium materials for your dream projects." },
    { img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2089", title: "Structural Excellence", sub: "Steel, Cement, and more at wholesale prices." },
    { img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070", title: "Engineering Grade", sub: "Approved by top architects." },
];
  
const Home = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const catSnap = await getDocs(collection(db, "categories"));
          setCategories(["All", ...catSnap.docs.map(doc => doc.data().name)]);
  
          const q = query(collection(db, "products"), where("status", "==", "active"));
          const prodSnap = await getDocs(q);
          setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);
  
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentHeroSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(timer);
    }, []);
  
    // Filter Logic
    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // NEW: Search-specific filter (To ensure dropdown only shows text matches, ignoring category tabs)
    const searchResults = searchTerm 
      ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : [];
  
    return (
      <div className="bg-pearl dark:bg-dark min-h-screen transition-colors duration-300 pt-20 pb-20">
        
        {/* 1. HERO SLIDER */}
        <section className="relative h-[500px] mb-12 overflow-hidden group">
          {HERO_SLIDES.map((slide, index) => (
              <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentHeroSlide ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={slide.img} alt="Hero" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
          ))}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 drop-shadow-lg animate-fade-in-up">
                  {HERO_SLIDES[currentHeroSlide].title}
              </h1>
              <p className="text-gray-200 text-lg mb-8 max-w-2xl drop-shadow-md animate-fade-in-up delay-100">
                  {HERO_SLIDES[currentHeroSlide].sub}
              </p>
              
              {/* SEARCH BAR CONTAINER */}
              <div className="w-full max-w-2xl relative animate-fade-in-up delay-200">
                  <input 
                      type="text"
                      placeholder="What are you building today?"
                      className="w-full bg-white/90 backdrop-blur text-slate-900 px-6 py-4 rounded-full shadow-2xl outline-none focus:ring-4 ring-primary/50 text-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="absolute right-2 top-2 bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-secondary transition">
                      Search
                  </button>

                  {/* --- NEW: LIVE SEARCH DROPDOWN --- */}
                  {searchTerm && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 text-left border border-gray-100 dark:border-white/10 scrollbar-hide">
                        {searchResults.length > 0 ? (
                            searchResults.map(product => (
                                <Link 
                                    to={`/product/${product.id}`} 
                                    key={product.id}
                                    className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-white/10 transition border-b border-gray-100 dark:border-white/5 last:border-0"
                                >
                                    <img 
                                        src={product.images?.[0] || 'https://via.placeholder.com/50'} 
                                        alt={product.name} 
                                        className="w-12 h-12 object-cover rounded-lg bg-gray-200"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white">{product.name}</h4>
                                        <p className="text-xs text-gray-500">{product.category}</p>
                                    </div>
                                    <span className="font-bold text-primary">₹{product.price}</span>
                                </Link>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500 italic">No products found matching "{searchTerm}"</div>
                        )}
                    </div>
                  )}

              </div>
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {HERO_SLIDES.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentHeroSlide(idx)} className={`h-2 rounded-full transition-all duration-300 ${idx === currentHeroSlide ? 'w-8 bg-primary' : 'w-2 bg-white/50'}`}></button>
              ))}
          </div>
        </section>
  
        {/* 2. CATEGORIES FILTER */}
        <section className="px-4 mb-12 max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Browse by Category</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat, index) => (
              <button 
                  key={index} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition ${
                      selectedCategory === cat 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
  
        {/* 3. PRODUCT GRID */}
        <section className="px-4 mb-20 max-w-7xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-8">
              {selectedCategory === "All" ? "Featured Products" : `${selectedCategory} Products`}
          </h2>
          
          {loading ? (
              <div className="text-center py-20 text-gray-500">Loading Marketplace...</div>
          ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl">No products found.</div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
              </div>
          )}
        </section>
  
      </div>
    );
  };
  
  export default Home;
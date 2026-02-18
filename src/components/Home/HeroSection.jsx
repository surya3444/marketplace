import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const HeroSection = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch Slides
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const q = query(collection(db, "hero_slides"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length > 0) setSlides(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // Dynamic Timer
  useEffect(() => {
    if (slides.length === 0) return;
    const currentDuration = slides[currentIndex]?.duration || 5;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, currentDuration * 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, slides]);

  if (loading) return <div className="h-[500px] bg-gray-200 animate-pulse rounded-3xl m-4"></div>;
  if (slides.length === 0) return null;

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden group">
      
      {/* 1. PROGRESS BAR */}
      <div className="absolute top-0 left-0 h-1.5 bg-white/20 z-40 w-full">
         <div 
            key={currentIndex}
            className="h-full bg-secondary shadow-[0_0_15px_#D4AF37]"
            style={{ 
                width: '100%',
                animation: `progress ${slides[currentIndex]?.duration || 5}s linear`
            }}
         ></div>
      </div>

      {/* 2. BACKGROUND IMAGES */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
        </div>
      ))}

      {/* 3. CONTENT */}
      <div className="absolute inset-0 z-20 flex items-center px-8 md:px-20 container mx-auto pointer-events-none">
        <div className="max-w-3xl text-white pointer-events-auto mt-[-50px]"> 
            
            {/* ANIMATED CONTENT CONTAINER */}
            <div key={currentIndex} className="animate-slide-up">
                
                {/* BADGES ROW */}
                <div className="flex flex-wrap gap-3 mb-4">
                    <span className="inline-block px-3 py-1 border border-white/30 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-md bg-white/10">
                        Featured
                    </span>
                </div>
                {/* NEW: VENDOR NAME BADGE (Only shows if vendorName exists) */}
                    {slides[currentIndex].vendorName && (
                        <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-4 drop-shadow-2xl text-secondary">
                            <i className="fas fa-store"></i>
                            {slides[currentIndex].vendorName}
                        </h1>
                    )}
                <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-4 drop-shadow-2xl">
                    {slides[currentIndex].title}
                </h1>
                
                <p className="text-lg md:text-xl text-gray-200 mb-8 font-light max-w-lg drop-shadow-lg leading-relaxed">
                    {slides[currentIndex].subtitle}
                </p>
                
                <Link 
                    to={slides[currentIndex].link}
                    className="inline-flex items-center gap-2 bg-secondary hover:bg-white hover:text-slate-900 text-white px-8 py-4 rounded-full font-bold transition-all duration-300 transform hover:translate-x-2 shadow-lg shadow-secondary/50"
                >
                    Explore Now <i className="fas fa-arrow-right"></i>
                </Link>
            </div>
        </div>
      </div>

      <style>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default HeroSection;
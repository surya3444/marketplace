import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate("/"); // Product not found
        }
      } catch (error) {
        console.error("Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!product) return null;

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
      
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500">
         <span onClick={() => navigate("/")} className="cursor-pointer hover:text-primary">Home</span> 
         <i className="fas fa-chevron-right mx-2 text-xs"></i>
         <span>{product.category}</span>
         <i className="fas fa-chevron-right mx-2 text-xs"></i>
         <span className="text-primary font-bold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left: Image Gallery */}
        <div>
           <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden mb-4 border border-gray-200 dark:border-white/10 h-96">
              <img 
                 src={product.images?.[selectedImage]} 
                 alt={product.name} 
                 className="w-full h-full object-contain"
              />
           </div>
           {/* Thumbnails */}
           <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images?.map((img, idx) => (
                 <img 
                   key={idx} 
                   src={img} 
                   onClick={() => setSelectedImage(idx)}
                   className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition ${selectedImage === idx ? 'border-primary' : 'border-transparent'}`}
                 />
              ))}
           </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
           <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2">{product.name}</h1>
           <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">{product.stock}</span>
              <span className="text-gray-400 text-sm">| Sold by Verified Vendor</span>
           </div>

           <div className="mb-8">
              <span className="text-4xl font-bold text-primary">₹{product.price}</span>
              <span className="text-gray-500 text-lg ml-2">/ {product.unit}</span>
           </div>

           <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 mb-8">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                 {product.description}
              </p>
           </div>

           <div className="mt-auto flex gap-4">
              <button 
                 onClick={() => {
                     addToCart(product);
                     alert("Product added to cart!");
                 }}
                 className="flex-1 bg-primary text-white font-bold py-4 rounded-xl hover:bg-secondary transition shadow-lg shadow-primary/30 text-lg"
              >
                 <i className="fas fa-shopping-cart mr-2"></i> Add to Cart
              </button>
              <button className="w-16 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white rounded-xl hover:bg-gray-200 transition flex items-center justify-center text-xl">
                 <i className="far fa-heart"></i>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
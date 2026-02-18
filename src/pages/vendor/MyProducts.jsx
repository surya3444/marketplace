import { useState, useEffect, useContext } from "react";
import { db, storage } from "../../firebase";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

// --- SUB-COMPONENT: Product Card with Image Slider ---
const ProductCardWithSlider = ({ product, onDelete, onEdit, onToggleStock }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = product.images || [];
    const hasMultipleImages = images.length > 1;
  
    const nextImage = (e) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };
  
    const prevImage = (e) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };
  
    return (
      <div className="glass-panel rounded-2xl overflow-hidden group hover:shadow-xl transition flex flex-col">
        {/* Image Slider Section */}
        <div className="h-48 relative bg-white dark:bg-black/20 group/slider">
          <img 
            src={images[currentImageIndex] || 'https://via.placeholder.com/300'} 
            alt={product.name} 
            className={`w-full h-full object-cover transition duration-500 ${product.stock !== 'Available' ? 'grayscale opacity-50' : ''}`} 
          />
          
          {/* Stock Badge */}
          <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-bold rounded-full z-10 ${
            product.stock === 'Available' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {product.stock}
          </span>
  
          {/* Slider Controls (Only if > 1 image) */}
          {hasMultipleImages && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition">
                <i className="fas fa-chevron-left"></i>
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition">
                <i className="fas fa-chevron-right"></i>
              </button>
              {/* Dots Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}></div>
                ))}
              </div>
            </>
          )}
        </div>
  
        {/* Details Section */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate pr-2">{product.name}</h3>
            <p className="font-bold text-secondary whitespace-nowrap">₹ {product.price} <span className="text-xs text-gray-500 font-normal">/ {product.unit}</span></p>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>
          
          <div className="mt-auto flex gap-2">
            <button 
              onClick={() => onToggleStock(product.id, product.stock)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
                product.stock === 'Available' 
                ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                : 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              {product.stock === 'Available' ? 'Mark Out of Stock' : 'Mark Available'}
            </button>
  
            {/* Edit Button */}
            <button 
              onClick={() => onEdit(product)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition dark:bg-blue-900/20 dark:hover:bg-blue-600"
            >
              <i className="fas fa-edit"></i>
            </button>
            
            {/* Delete Button */}
            <button 
              onClick={() => onDelete(product.id, product.images)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition dark:bg-red-900/20 dark:hover:bg-red-600"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    );
};


// --- MAIN COMPONENT ---
const MyProducts = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null); // State for the edit modal

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "products"), 
          where("vendorId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user]);

  // Handle Delete
  const handleDelete = async (productId, imageUrls) => {
    if (!window.confirm("Permanently delete this product?")) return;

    try {
      // 1. Delete Firestore Doc
      await deleteDoc(doc(db, "products", productId));

      // 2. Delete Images from Storage
      if (imageUrls && imageUrls.length > 0) {
        imageUrls.forEach(async (url) => {
           try {
             const fileRef = ref(storage, url);
             await deleteObject(fileRef);
           } catch (err) {
             console.warn("Could not delete image from storage:", err.message);
           }
        });
      }

      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      alert("Error deleting product.");
    }
  };

  // Toggle Stock Status
  const toggleStock = async (productId, currentStatus) => {
    const newStatus = currentStatus === "Available" ? "Out of Stock" : "Available";
    try {
      await updateDoc(doc(db, "products", productId), { stock: newStatus });
      setProducts(products.map(p => 
        p.id === productId ? { ...p, stock: newStatus } : p
      ));
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

   // Handle Edit Form Submit
   const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { id, name, price, description, stock, unit } = editingProduct;

    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, {
        name,
        price: parseFloat(price),
        description,
        stock,
        unit
      });

      // Update local state
      setProducts(products.map(p => p.id === id ? editingProduct : p));
      setEditingProduct(null); // Close modal
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product.");
    }
  };


  if (loading) return <div className="p-10 text-gray-500 dark:text-gray-400">Loading Inventory...</div>;

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">My Inventory</h1>
        <Link to="/vendor/add-product" className="bg-secondary text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-secondary/20">
          <i className="fas fa-plus mr-2"></i> Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
          <i className="fas fa-box-open text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400">You haven't added any products yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCardWithSlider 
                key={product.id} 
                product={product}
                onDelete={handleDelete}
                onToggleStock={toggleStock}
                onEdit={setEditingProduct} // Open modal
            />
          ))}
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Product</h2>
                    <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-red-500 transition">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                {/* Modal Body - Scrollable Form */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="editForm" onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Product Name</label>
                                <input 
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                    className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 dark:text-white outline-none focus:border-secondary"
                                    required
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Price (₹)</label>
                                <input 
                                    type="number"
                                    value={editingProduct.price}
                                    onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                                    className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 dark:text-white outline-none focus:border-secondary"
                                    required
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Unit</label>
                                <input 
                                    value={editingProduct.unit}
                                    onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}
                                    className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 dark:text-white outline-none focus:border-secondary"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Stock Status</label>
                                <select 
                                    value={editingProduct.stock}
                                    onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                                    className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 dark:text-white outline-none focus:border-secondary appearance-none cursor-pointer"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Out of Stock">Out of Stock</option>
                                </select>
                            </div>
                             <div className="col-span-2">
                                <div className="flex justify-between">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                                    <span className={`text-xs ${editingProduct.description.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {editingProduct.description.length}/500
                                    </span>
                                </div>
                                <textarea 
                                    value={editingProduct.description}
                                    onChange={(e) => {
                                        if(e.target.value.length <= 500) {
                                            setEditingProduct({...editingProduct, description: e.target.value})
                                        }
                                    }}
                                    className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 dark:text-white outline-none focus:border-secondary h-32 resize-none"
                                    required
                                />
                            </div>
                        </div>
                        
                        {/* Read-only Images View */}
                        <div>
                             <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Current Images (Read-only)</label>
                             <div className="flex gap-2 overflow-x-auto pb-2">
                                 {editingProduct.images && editingProduct.images.map((url, idx) => (
                                     <img key={idx} src={url} alt="product" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-white/10" />
                                 ))}
                             </div>
                             <p className="text-xs text-gray-400 mt-1">To change images, delete and recreate the product.</p>
                        </div>

                    </form>
                </div>
                
                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
                    <button onClick={() => setEditingProduct(null)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 font-bold transition">Cancel</button>
                    <button type="submit" form="editForm" className="px-6 py-2 rounded-lg bg-secondary text-white font-bold hover:bg-blue-600 transition shadow-md">Save Changes</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default MyProducts;
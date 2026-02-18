import { useState, useEffect, useContext } from "react";
import { db, storage } from "../../firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, where } from "firebase/firestore"; // Added query, where
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [categories, setCategories] = useState([]); 
  
  // Custom Unit Logic
  const [customUnit, setCustomUnit] = useState(""); 
  const [standardUnits, setStandardUnits] = useState(["Piece", "Bag", "Trip", "Kg", "Ton", "Sq. Ft"]);
  const [vendorCustomUnits, setVendorCustomUnits] = useState([]); // Store fetched custom units

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    unit: "Piece", 
    category: "", 
    stock: "Available"
  });

  // 1. Fetch Categories & Vendor's Previous Units
  useEffect(() => {
    const fetchData = async () => {
      try {
        // A. Fetch Categories
        const catSnap = await getDocs(collection(db, "categories"));
        const cats = catSnap.docs.map(doc => doc.data().name);
        setCategories(cats);
        if (cats.length > 0) setFormData(prev => ({ ...prev, category: cats[0] }));

        // B. Fetch Vendor's Used Units
        if (user?.uid) {
            const q = query(collection(db, "products"), where("vendorId", "==", user.uid));
            const productSnap = await getDocs(q);
            
            const usedUnits = new Set();
            productSnap.docs.forEach(doc => {
                const u = doc.data().unit;
                // If it's not a standard unit, add to custom list
                if (u && !standardUnits.includes(u)) {
                    usedUnits.add(u);
                }
            });
            setVendorCustomUnits(Array.from(usedUnits));
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [user, standardUnits]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > 500) return;
    
    // If user selects a previously used custom unit, handle it
    if (name === "unit" && vendorCustomUnits.includes(value)) {
        setFormData({ ...formData, unit: value }); // Set it directly
        setCustomUnit(""); // Clear manual input
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(file => file.size <= 15 * 1024 * 1024);
      setImages([...images, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    const newPreviews = [...previewUrls];
    newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return alert("Please upload at least one image.");
    setLoading(true);

    try {
      // Resolve Unit: If "Custom" is selected, use the input box. Otherwise use dropdown value.
      const finalUnit = formData.unit === "Custom" ? customUnit : formData.unit;

      if (!finalUnit) {
          alert("Please specify a unit.");
          setLoading(false);
          return;
      }

      // Upload Images
      const imageUrls = [];
      for (const file of images) {
        const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      // Save to Firestore
      await addDoc(collection(db, "products"), {
        vendorId: user.uid,
        ...formData,
        unit: finalUnit, 
        price: parseFloat(formData.price),
        images: imageUrls,
        createdAt: serverTimestamp(),
        status: "active"
      });

      alert("Product added successfully!");
      navigate("/vendor/products");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 p-4">
      <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">Add New Product</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">List your item on the Rajchavin Marketplace.</p>

      <div className="glass-panel p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl bg-white/50 dark:bg-surface/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
              <input 
                required 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition dark:text-white" 
                placeholder="e.g. UltraTech Cement 50kg" 
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <div className="relative">
                <select 
                    required
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange} 
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition dark:text-white appearance-none cursor-pointer"
                >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Price (₹)</label>
              <input 
                required 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition dark:text-white" 
                placeholder="0.00" 
              />
            </div>

            {/* Unit Logic */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Unit Type</label>
              <div className="relative">
                <select 
                    name="unit" 
                    value={formData.unit} 
                    onChange={handleChange} 
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition dark:text-white appearance-none cursor-pointer"
                >
                    <optgroup label="Standard Units">
                        {standardUnits.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </optgroup>
                    
                    {/* Render Previous Custom Units if they exist */}
                    {vendorCustomUnits.length > 0 && (
                        <optgroup label="My Custom Units">
                            {vendorCustomUnits.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </optgroup>
                    )}

                    <option value="Custom">+ Add New Unit...</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>

            {/* Conditional Custom Unit Input */}
            {formData.unit === "Custom" && (
                <div className="md:col-span-2 animate-fade-in bg-secondary/5 p-4 rounded-xl border border-secondary/20">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Define New Unit</label>
                    <div className="flex gap-2">
                        <input 
                            required 
                            type="text" 
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                            className="flex-1 bg-white dark:bg-white/5 border border-secondary rounded-xl px-4 py-3 outline-none focus:border-secondary transition dark:text-white" 
                            placeholder="e.g. Truckload, Packet, Box" 
                        />
                        <div className="text-xs text-gray-500 flex items-center max-w-[150px]">
                            <i className="fas fa-info-circle mr-1"></i>
                            This will be saved for future use.
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="md:col-span-2">
              <div className="flex justify-between">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <span className={`text-xs ${formData.description.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formData.description.length}/500
                </span>
              </div>
              <textarea 
                required 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition h-32 dark:text-white resize-none" 
                placeholder="Describe your product features, specifications, etc..." 
              />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-white/10" />

          {/* Image Upload Section (Unchanged) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Product Images (Max 15MB each)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer relative h-32">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <i className="fas fa-camera text-2xl text-secondary mb-2"></i>
                <span className="text-xs font-bold text-gray-500">Add Photos</span>
              </div>
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition opacity-0 group-hover:opacity-100"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-white/10">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition font-bold">Cancel</button>
            <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-secondary text-white font-bold hover:bg-blue-600 shadow-lg shadow-secondary/30 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
              {loading ? "Uploading..." : "Publish Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
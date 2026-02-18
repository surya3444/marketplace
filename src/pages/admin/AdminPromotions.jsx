import { useState, useEffect } from "react";
import { db, storage } from "../../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AdminPromotions = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 1. UPDATE STATE: Added vendorName
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    vendorName: "", // New field
    link: "/shop",
    duration: 5, 
    image: null
  });

  // Fetch Slides
  const fetchSlides = async () => {
    const q = query(collection(db, "hero_slides"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // Handle Upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return alert("Please select an image");

    setLoading(true);
    try {
      // Upload Image
      const storageRef = ref(storage, `hero_slides/${Date.now()}_${formData.image.name}`);
      await uploadBytes(storageRef, formData.image);
      const url = await getDownloadURL(storageRef);

      // 2. SAVE TO FIRESTORE: Include vendorName
      await addDoc(collection(db, "hero_slides"), {
        title: formData.title,
        subtitle: formData.subtitle,
        vendorName: formData.vendorName, // Saving the new field
        link: formData.link,
        duration: Number(formData.duration),
        imageUrl: url,
        createdAt: new Date()
      });

      // Reset
      setFormData({ title: "", subtitle: "", vendorName: "", link: "/shop", duration: 5, image: null });
      document.getElementById("fileInput").value = "";
      fetchSlides();
      alert("Slide added successfully!");
    } catch (error) {
      console.error(error);
      alert("Error adding slide");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this slide?")) return;
    try {
        await deleteDoc(doc(db, "hero_slides", id));
        fetchSlides();
    } catch (error) {
        console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-white">Promotional Hero Manager</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-bold mb-4">Add New Slide</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Slide Title</label>
              <input 
                type="text" 
                className="w-full p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus:border-secondary outline-none"
                placeholder="e.g. Summer Sale"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            
            {/* 3. NEW INPUT: Vendor Name */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Vendor / Shop Name</label>
              <input 
                type="text" 
                className="w-full p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus:border-secondary outline-none"
                placeholder="e.g. Rajchavin Traders"
                value={formData.vendorName}
                onChange={e => setFormData({...formData, vendorName: e.target.value})}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Subtitle / Description</label>
              <input 
                type="text" 
                className="w-full p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus:border-secondary outline-none"
                placeholder="e.g. Up to 50% Off"
                value={formData.subtitle}
                onChange={e => setFormData({...formData, subtitle: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Link To</label>
                    <input 
                        type="text" 
                        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus:border-secondary outline-none"
                        value={formData.link}
                        onChange={e => setFormData({...formData, link: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Duration (Sec)</label>
                    <input 
                        type="number" 
                        min="2" max="20"
                        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus:border-secondary outline-none"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                    />
                </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Hero Image</label>
              <input 
                id="fileInput"
                type="file" 
                accept="image/*"
                className="w-full p-2 text-sm"
                onChange={e => setFormData({...formData, image: e.target.files[0]})}
              />
            </div>
            <button 
                disabled={loading}
                className="w-full py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/80 transition shadow-lg shadow-secondary/30"
            >
                {loading ? "Uploading..." : "Publish Slide"}
            </button>
          </form>
        </div>

        {/* PREVIEW LIST */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold">Active Slides</h2>
            {slides.length === 0 && <p className="text-gray-400">No slides active.</p>}
            
            <div className="grid grid-cols-1 gap-4">
                {slides.map(slide => (
                    <div key={slide.id} className="flex gap-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 items-center">
                        <img src={slide.imageUrl} alt="" className="w-32 h-20 object-cover rounded-lg" />
                        <div className="flex-1">
                            <h3 className="font-bold text-lg leading-none">{slide.title}</h3>
                            
                            {/* 4. DISPLAY VENDOR NAME */}
                            {slide.vendorName && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">
                                    {slide.vendorName}
                                </span>
                            )}
                            
                            <p className="text-sm text-gray-500 mt-1">{slide.subtitle}</p>
                            <div className="flex gap-4 mt-2 text-xs font-mono text-gray-400">
                                <span><i className="fas fa-clock mr-1"></i>{slide.duration}s</span>
                                <span><i className="fas fa-link mr-1"></i>{slide.link}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(slide.id)}
                            className="w-10 h-10 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center"
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPromotions;
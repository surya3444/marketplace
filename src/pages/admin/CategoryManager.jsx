import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      const snap = await getDocs(collection(db, "categories"));
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchCats();
  }, []);

  // Add Category
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    
    try {
      const docRef = await addDoc(collection(db, "categories"), { name: newCat });
      setCategories([...categories, { id: docRef.id, name: newCat }]);
      setNewCat("");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  // Delete Category
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
    setCategories(categories.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-6">Product Categories</h1>

      {/* Add Category Bar */}
      <div className="glass-panel p-4 rounded-xl mb-8 flex gap-4 items-center">
        <input 
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="e.g. Cement, Sand, Electronics"
          className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 outline-none focus:border-primary transition dark:text-white"
        />
        <button onClick={handleAdd} className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-secondary transition shadow-lg shadow-primary/20">
          <i className="fas fa-plus mr-2"></i> Add
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="text-gray-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="glass-panel p-4 rounded-xl flex justify-between items-center group hover:bg-white/80 dark:hover:bg-white/5 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300">
                    <i className="fas fa-tag text-xs"></i>
                </div>
                <span className="font-bold text-slate-700 dark:text-gray-200">{cat.name}</span>
              </div>
              <button 
                onClick={() => handleDelete(cat.id)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
              >
                <i className="fas fa-trash-alt text-sm"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {categories.length === 0 && !loading && (
        <div className="text-center py-10 text-gray-400">
            <i className="fas fa-cubes text-4xl mb-3 opacity-30"></i>
            <p>No categories found. Add one above.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  doc,
  query,
  where,
  writeBatch // 1. Import writeBatch
} from "firebase/firestore";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
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
    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // Start Editing
  const startEditing = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  // --- CRITICAL FIX: UPDATE CATEGORY & PRODUCTS ---
  const handleUpdate = async (id) => {
    if (!editName.trim()) return;

    try {
      setLoading(true);

      // 1. Get the Old Name (to find products that need updating)
      const oldCategory = categories.find(c => c.id === id);
      const oldName = oldCategory.name;

      // 2. Update the Category Document itself
      const catRef = doc(db, "categories", id);
      await updateDoc(catRef, { name: editName });

      // 3. BULK UPDATE: If name changed, find ALL products with old name
      if (oldName !== editName) {
        console.log(`Renaming products from ${oldName} to ${editName}...`);
        
        // Find products matching the old category string
        const q = query(collection(db, "products"), where("category", "==", oldName));
        const productsSnap = await getDocs(q);

        // Use a Batch Write to update them all at once (Atomic & Fast)
        const batch = writeBatch(db);
        
        productsSnap.docs.forEach((productDoc) => {
            const productRef = doc(db, "products", productDoc.id);
            batch.update(productRef, { category: editName });
        });

        await batch.commit(); // Execute all updates
        console.log(`Updated ${productsSnap.size} products.`);
      }

      // 4. Update UI
      setCategories(categories.map(cat => 
        cat.id === id ? { ...cat, name: editName } : cat
      ));
      
      setEditingId(null);
      setEditName("");
      alert("Category updated successfully!");

    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
        setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
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
        <div className="text-gray-500 animate-pulse">Processing updates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="glass-panel p-4 rounded-xl flex justify-between items-center group hover:bg-white/80 dark:hover:bg-white/5 transition min-h-[80px]">
              
              {editingId === cat.id ? (
                // EDIT MODE
                <div className="flex items-center gap-2 w-full animate-fade-in">
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-white dark:bg-black/20 border border-primary rounded px-2 py-1 text-sm outline-none dark:text-white"
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(cat.id)} className="text-green-500 hover:bg-green-50 p-2 rounded-full transition">
                    <i className="fas fa-check"></i>
                  </button>
                  <button onClick={cancelEdit} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-full transition">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                // VIEW MODE
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300">
                        <i className="fas fa-tag text-xs"></i>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-gray-200">{cat.name}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEditing(cat)} 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      <i className="fas fa-pen text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)} 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </>
              )}
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
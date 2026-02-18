import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Signup = () => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "",
    lookingFor: "" // Selected Category
  });
  
  const [idFile, setIdFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 1. Fetch Categories for Dropdown
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        const catList = snap.docs.map(doc => doc.data().name);
        setCategories(catList);
        if (catList.length > 0) setFormData(prev => ({ ...prev, lookingFor: catList[0] }));
      } catch (err) {
        console.error("Error loading categories", err);
      }
    };
    fetchCats();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
        setIdFile(e.target.files[0]);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");
    if (!idFile) return setError("Please upload an ID Proof (Aadhaar/PAN)");

    setLoading(true);
    setError("");

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Upload ID Proof
      const storageRef = ref(storage, `customers/${user.uid}/id_proof_${idFile.name}`);
      await uploadBytes(storageRef, idFile);
      const idProofUrl = await getDownloadURL(storageRef);

      // 3. Update Display Name
      await updateProfile(user, { displayName: formData.name });

      // 4. Create Firestore Document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: "customer",
        interestedIn: formData.lookingFor,
        idProofUrl: idProofUrl,
        verified: false, // Default to unverified until Admin checks ID
        createdAt: serverTimestamp(),
      });

      alert("Account created successfully! Welcome to RajChavin.");
      navigate("/"); 
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pearl dark:bg-dark py-20 px-4">
      <div className="bg-white dark:bg-surface p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Join RajChavin</h1>
          <p className="text-gray-500 text-sm">Create an account to start building.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 text-sm font-bold border border-red-200">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                <input required name="name" onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white transition" placeholder="Rajesh Kumar" />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Interested In</label>
                <div className="relative">
                    <select 
                        name="lookingFor" 
                        onChange={handleChange} 
                        value={formData.lookingFor}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white appearance-none cursor-pointer transition"
                    >
                        <option value="" disabled>Select Material</option>
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
            <input required type="email" name="email" onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white transition" placeholder="rajesh@example.com" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
                <input required type="password" name="password" onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white transition" placeholder="••••••••" />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Confirm Password</label>
                <input required type="password" name="confirmPassword" onChange={handleChange} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary dark:text-white transition" placeholder="••••••••" />
            </div>
          </div>

          {/* ID Proof Upload */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Upload ID Proof (Aadhaar / PAN)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer relative group">
                <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                <i className={`fas ${idFile ? 'fa-check-circle text-green-500' : 'fa-id-card text-gray-400'} text-3xl mb-2 group-hover:scale-110 transition`}></i>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    {idFile ? idFile.name : "Click to Upload ID"}
                </span>
                <span className="text-xs text-gray-400 mt-1">Max 5MB (JPG, PNG, PDF)</span>
            </div>
          </div>

          <button disabled={loading} className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-secondary transition shadow-lg shadow-primary/30 mt-6 flex items-center justify-center gap-2">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-user-plus"></i>}
            {loading ? "Creating Profile..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
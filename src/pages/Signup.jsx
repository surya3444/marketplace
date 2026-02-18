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
    lookingFor: "" 
  });
  
  const [idFile, setIdFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const storageRef = ref(storage, `customers/${user.uid}/id_proof_${idFile.name}`);
      await uploadBytes(storageRef, idFile);
      const idProofUrl = await getDownloadURL(storageRef);

      await updateProfile(user, { displayName: formData.name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: "customer",
        interestedIn: formData.lookingFor,
        idProofUrl: idProofUrl,
        verified: false,
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300 py-10 px-4">
      
      {/* Custom Animation Style for Floating Effect */}
      <style>{`
        @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>

      {/* --- 1. REALISTIC BACKGROUND IMAGE --- */}
      <div 
        className="absolute inset-0 z-0"
        style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1535732820275-9e91055fa63a?q=80&w=2070&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      ></div>

      {/* --- 2. OVERLAYS --- */}
      <div className="absolute inset-0 z-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-[3px]"></div>

      {/* Blueprint Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
               backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), 
                                 linear-gradient(to right, #ffffff 1px, transparent 1px)`, 
               backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* --- 3. FLOATING BACKGROUND SYMBOLS --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Top Left: Hard Hat */}
          <div className="absolute top-[15%] left-[5%] text-yellow-400/20 text-7xl" style={{ animation: 'float 6s ease-in-out infinite' }}>
             <i className="fas fa-hard-hat"></i>
          </div>
          {/* Bottom Right: Truck */}
          <div className="absolute bottom-[15%] right-[5%] text-blue-400/20 text-8xl" style={{ animation: 'float 8s ease-in-out infinite 1s' }}>
             <i className="fas fa-truck-pickup"></i>
          </div>
          {/* Top Right: Cart */}
          <div className="absolute top-[20%] right-[10%] text-purple-400/20 text-6xl" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
             <i className="fas fa-shopping-bag"></i>
          </div>
          {/* Bottom Left: Tools */}
          <div className="absolute bottom-[20%] left-[10%] text-gray-100/10 text-6xl" style={{ animation: 'float 9s ease-in-out infinite 0.5s' }}>
             <i className="fas fa-tools"></i>
          </div>
          {/* Center Left: Materials */}
          <div className="absolute top-[50%] left-[3%] text-white/10 text-5xl" style={{ animation: 'float 10s ease-in-out infinite 3s' }}>
             <i className="fas fa-cubes"></i>
          </div>
      </div>

      {/* --- 4. SIGNUP CARD --- */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-white/60 dark:border-white/10 relative z-10 animate-fade-in-up">
        
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 rounded-t-xl opacity-80"></div>
        
        <div className="text-center mb-8 mt-4">
          <div className="bg-slate-900 p-3 inline-block rounded-2xl shadow-xl shadow-slate-900/30 mb-4 border border-white/10">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Join RajChavin</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Start Building Today</p>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg mb-6 text-sm font-bold border border-red-200 dark:border-red-500/30 text-center">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Full Name</label>
                <div className="relative">
                    <input required name="name" onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-4 py-3 outline-none focus:border-primary dark:text-white transition font-medium" placeholder="Rajesh Kumar" />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Interested In</label>
                <div className="relative">
                    <select 
                        name="lookingFor" 
                        onChange={handleChange} 
                        value={formData.lookingFor}
                        className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-4 py-3 outline-none focus:border-primary dark:text-white appearance-none cursor-pointer transition font-medium"
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
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Email Address</label>
            <div className="relative">
                <input required type="email" name="email" onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary dark:text-white transition font-medium" placeholder="rajesh@example.com" />
                <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Password</label>
                <div className="relative">
                    <input required type="password" name="password" onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary dark:text-white transition font-medium" placeholder="••••••••" />
                    <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Confirm</label>
                <div className="relative">
                    <input required type="password" name="confirmPassword" onChange={handleChange} className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary dark:text-white transition font-medium" placeholder="••••••••" />
                    <i className="fas fa-check-circle absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>
          </div>

          {/* ID Proof Upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 ml-1">Upload ID Proof (Aadhaar / PAN)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-black/20 transition cursor-pointer relative group bg-gray-50 dark:bg-black/10">
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

          <button disabled={loading} className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-primary/30 mt-6 flex items-center justify-center gap-2">
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
import { useState } from "react";
// 1. Import the config along with other services
import { db, storage, firebaseConfig } from "../../firebase"; 
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp, getApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const VendorOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    businessName: "", 
    gstNo: "", 
    businessType: "Construction Materials",
    contactNumber: "", 
    email: "", 
    address: "",
    vendorName: "", 
    password: "", 
    remarks: "", 
    stars: 5
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    setLoading(true);

    let secondaryApp = null;
    const appName = "secondaryApp";

    try {
        // --- 1. Initialize Secondary App (To keep Admin logged in) ---
        // We use the imported firebaseConfig here
        if (getApps().length > 0 && getApps().find(app => app.name === appName)) {
            secondaryApp = getApp(appName);
        } else {
            secondaryApp = initializeApp(firebaseConfig, appName);
        }
        
        const secondaryAuth = getAuth(secondaryApp);

        // --- 2. Create Auth User for Vendor ---
        console.log("Creating user with secondary app...");
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
        const uid = userCredential.user.uid;
        console.log("User created:", uid);

        // --- 3. Upload Documents (Using Main App Storage) ---
        const docUrls = [];
        for (const file of files) {
            const storageRef = ref(storage, `vendors/${uid}/documents/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            docUrls.push({ name: file.name, url });
        }

        // --- 4. Save to Firestore (Using Main App DB) ---
        // We strip the password before saving to DB for security
        const { password, ...safeData } = formData;

        await setDoc(doc(db, "users", uid), {
            uid: uid,
            role: "vendor",
            ...safeData,
            documents: docUrls,
            createdAt: new Date(),
            status: "active",
            walletBalance: 0 // Initialize wallet
        });

        alert("Vendor Onboarded Successfully!");
        
        // Reset Form
        setFormData({
            businessName: "", gstNo: "", businessType: "Construction Materials",
            contactNumber: "", email: "", address: "",
            vendorName: "", password: "", remarks: "", stars: 5
        });
        setFiles([]);

    } catch (error) {
        console.error("Error onboarding vendor:", error);
        alert(`Error: ${error.message}`);
    } finally {
        // --- 5. Cleanup Secondary App ---
        if (secondaryApp) {
            try {
                await deleteApp(secondaryApp);
                console.log("Secondary app deleted.");
            } catch (err) {
                console.warn("Secondary app cleanup warning:", err);
            }
        }
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Onboard New Vendor</h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1">Create account and upload verification documents.</p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl bg-white/50 dark:bg-surface/50 backdrop-blur-md">
        <form onSubmit={handleOnboard} className="space-y-8">
            
            {/* --- Section 1: Business Details --- */}
            <div>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <i className="fas fa-briefcase"></i> Business Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input required name="businessName" value={formData.businessName} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" placeholder="Rajchavin Supplies" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">GST Number</label>
                        <input required name="gstNo" value={formData.gstNo} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" placeholder="29ABCDE1234F1Z5" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Business Type</label>
                        <div className="relative">
                            <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer">
                                <option>Construction Materials</option>
                                <option>Interiors & Decor</option>
                                <option>Electronics</option>
                                <option>Plumbing & Sanitary</option>
                                <option>Paints & Chemicals</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <i className="fas fa-chevron-down"></i>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Initial Rating (Stars)</label>
                        <input type="number" max="5" min="1" name="stars" value={formData.stars} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" />
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-white/10" />

            {/* --- Section 2: Contact & Login --- */}
            <div>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <i className="fas fa-user-lock"></i> Account & Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Vendor Name (Person)</label>
                        <input required name="vendorName" value={formData.vendorName} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" placeholder="Surya Varma" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contact Mobile</label>
                        <input required name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" placeholder="9876543210" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Login Email</label>
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" placeholder="vendor@rajchavin.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Login Password</label>
                        <input required type="text" name="password" value={formData.password} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" placeholder="Create a strong password" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Business Address</label>
                        <textarea required name="address" value={formData.address} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition h-24 dark:text-white resize-none" placeholder="#391, Basaveshwara Nagar..."></textarea>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-white/10" />

            {/* --- Section 3: Documents --- */}
            <div>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <i className="fas fa-file-upload"></i> Documents
                </h3>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer relative group">
                    <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    
                    <div className="flex flex-col items-center justify-center transition-transform group-hover:scale-105 duration-300">
                        <i className="fas fa-cloud-upload-alt text-5xl text-primary/50 mb-3 group-hover:text-primary transition-colors"></i>
                        <p className="text-gray-700 dark:text-gray-300 font-bold text-lg">Drag & Drop or Click to Upload</p>
                        <p className="text-xs text-gray-400 mt-1">Supports PDF, JPG, PNG</p>
                    </div>
                </div>
                
                {files.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                    <i className="fas fa-file"></i>
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-200 truncate font-medium">{f.name}</span>
                                <span className="ml-auto text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

             {/* Remarks */}
             <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Admin Remarks (Internal)</label>
                <input name="remarks" value={formData.remarks} onChange={handleChange} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition dark:text-white" placeholder="Any internal notes..." />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-secondary transition shadow-lg shadow-primary/30 flex justify-center items-center gap-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? (
                    <>
                        <i className="fas fa-circle-notch fa-spin"></i>
                        Processing...
                    </>
                ) : (
                    <>
                        <i className="fas fa-check-circle"></i>
                        Create Vendor Account
                    </>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default VendorOnboarding;
import { useState, useEffect, useContext } from "react";
import { db, storage } from "../../firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"; // Added arrayUnion
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AuthContext } from "../../context/AuthContext";

const VendorProfile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false); // State for doc upload

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

  // Handle Profile Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
    }

    setUploading(true);
    try {
        const storageRef = ref(storage, `vendors/${user.uid}/profile_pic`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { profilePic: downloadURL });
        setProfile({ ...profile, profilePic: downloadURL });
        alert("Profile picture updated!");
    } catch (error) {
        console.error(error);
        alert("Failed to upload image.");
    } finally {
        setUploading(false);
    }
  };

  // --- NEW: Handle General Document Upload ---
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDocUploading(true);
    try {
      // 1. Create a unique path for the document
      const storageRef = ref(storage, `vendors/${user.uid}/documents/${Date.now()}_${file.name}`);
      
      // 2. Upload to Storage
      await uploadBytes(storageRef, file);
      
      // 3. Get URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // 4. Update Firestore array
      const newDoc = {
        name: file.name,
        url: downloadURL,
        uploadedAt: new Date()
      };
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        documents: arrayUnion(newDoc)
      });

      // 5. Update local state
      setProfile(prev => ({
        ...prev,
        documents: prev.documents ? [...prev.documents, newDoc] : [newDoc]
      }));

      alert("Document uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Document upload failed.");
    } finally {
      setDocUploading(false);
    }
  };

  if (loading) return <div className="p-10 text-gray-500 animate-pulse">Loading Profile...</div>;
  if (!profile) return <div className="p-10 text-red-500">Profile not found.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">My Store Profile</h1>
        <p className="text-gray-500">View and verify your official business registration details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Store Branding */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-3xl text-center border border-white/20 shadow-xl relative">
            <div className="relative w-32 h-32 mx-auto mb-4 group">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-secondary/20 shadow-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    {uploading ? (
                        <i className="fas fa-circle-notch fa-spin text-2xl text-secondary"></i>
                    ) : profile.profilePic ? (
                        <img src={profile.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <i className="fas fa-store text-4xl text-secondary/40"></i>
                    )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-secondary transition-all transform hover:scale-110 border-2 border-white dark:border-slate-900">
                    <i className="fas fa-camera text-sm"></i>
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={uploading} />
                </label>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.businessName}</h2>
            <p className="text-sm text-gray-500 mb-4">{profile.businessType}</p>
            
            <div className="flex justify-center gap-1 text-yellow-500 mb-6">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < (profile.stars || 5) ? "opacity-100" : "opacity-20"}`}></i>
              ))}
            </div>

            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
              profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {profile.status || 'Active'}
            </span>
          </div>

          {/* Verification Documents Section */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase">Verification Documents</h3>
              
              {/* NEW: ADD DOCUMENT BUTTON */}
              <label className="cursor-pointer text-primary hover:text-secondary transition text-sm flex items-center gap-1 font-bold">
                {docUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus-circle"></i>}
                <span>Add</span>
                <input type="file" className="hidden" onChange={handleDocumentUpload} disabled={docUploading} />
              </label>
            </div>

            <div className="space-y-3">
              {profile.documents && profile.documents.length > 0 ? (
                profile.documents.map((doc, idx) => (
                  <a 
                    key={idx} 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary transition group"
                  >
                    <i className="fas fa-file-alt text-secondary group-hover:scale-110 transition"></i>
                    <span className="text-xs font-medium truncate flex-1 dark:text-gray-300">{doc.name}</span>
                    <i className="fas fa-external-link-alt text-[10px] text-gray-400"></i>
                  </a>
                ))
              ) : (
                <p className="text-[10px] text-gray-500 italic text-center py-2">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <i className="fas fa-id-card text-primary"></i> Registration Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Business Owner</label>
                <p className="font-semibold text-slate-800 dark:text-gray-200">{profile.vendorName}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">GST Number</label>
                <p className="font-mono font-bold text-primary">{profile.gstNo || "Not Provided"}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Email Address</label>
                <p className="font-semibold text-slate-800 dark:text-gray-200">{profile.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Contact Number</label>
                <p className="font-semibold text-slate-800 dark:text-gray-200">+91 {profile.contactNumber}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Business Address</label>
                <p className="text-slate-700 dark:text-gray-300 leading-relaxed">{profile.address}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/20 bg-gradient-to-br from-primary/5 to-transparent">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Account Remarks</h3>
             <p className="text-sm text-gray-500 italic">
               "{profile.remarks || "Your account is in good standing. Maintain quality listings to boost your rating."}"
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorProfile;
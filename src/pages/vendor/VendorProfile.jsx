import { useState, useEffect, useContext } from "react";
import { db, auth } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";

const VendorProfile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-10 text-gray-500 animate-pulse">Loading Profile...</div>;
  if (!profile) return <div className="p-10 text-red-500">Profile not found.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">My Store Profile</h1>
        <p className="text-gray-500">View and verify your official business registration details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Store Branding */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-3xl text-center border border-white/20 shadow-xl">
            <div className="w-24 h-24 bg-secondary/10 text-secondary rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-secondary/20 shadow-inner">
              <i className="fas fa-store"></i>
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

          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Verification Documents</h3>
            <div className="space-y-3">
              {profile.documents?.map((doc, idx) => (
                <a 
                  key={idx} 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary transition group"
                >
                  <i className="fas fa-file-pdf text-red-500 group-hover:scale-110 transition"></i>
                  <span className="text-xs font-medium truncate flex-1">{doc.name}</span>
                  <i className="fas fa-external-link-alt text-[10px] text-gray-400"></i>
                </a>
              ))}
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
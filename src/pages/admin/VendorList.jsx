import { useState, useEffect } from "react";
import { db, storage, auth } from "../../firebase"; // Import auth
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayRemove, 
  deleteDoc, 
  arrayUnion 
} from "firebase/firestore";
import { 
  ref, 
  deleteObject, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth"; // Import this

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVendor, setEditingVendor] = useState(null);
  const [newPassword, setNewPassword] = useState(""); 
  
  // NEW: State for file upload
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Vendors
  const fetchVendors = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "vendor"));
      const querySnapshot = await getDocs(q);
      const vendorData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorData);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // NEW: Handle Delete Vendor (Entire Account)
  const handleDeleteVendor = async (vendorId, businessName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${businessName}? This cannot be undone.`)) return;

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "users", vendorId));
      
      alert("Vendor deleted successfully.");
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor.");
    }
  };

  // 2. Handle Delete Single Document
  const handleDeleteDoc = async (vendorId, fileUrl, fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      const storageRef = ref(storage, `vendors/${vendorId}/documents/${fileName}`);
      
      try {
        await deleteObject(storageRef);
      } catch (err) {
        console.warn("File might not exist in storage, removing from DB only", err);
      }

      const vendorRef = doc(db, "users", vendorId);
      const vendor = vendors.find(v => v.id === vendorId);
      const docToRemove = vendor.documents.find(d => d.name === fileName);

      if (docToRemove) {
        await updateDoc(vendorRef, {
          documents: arrayRemove(docToRemove)
        });
      }

      alert("Document deleted.");
      const updatedVendor = {
        ...editingVendor,
        documents: editingVendor.documents.filter(d => d.name !== fileName)
      };
      setEditingVendor(updatedVendor); 
      fetchVendors(); 
    } catch (error) {
      console.error("Error deleting doc:", error);
      alert("Failed to delete document.");
    }
  };

  // NEW: Handle File Upload
  const handleFileUpload = async () => {
    if (!uploadFile || !editingVendor) return;

    setIsUploading(true);
    try {
      const fileName = uploadFile.name;
      const storageRef = ref(storage, `vendors/${editingVendor.id}/documents/${fileName}`);

      await uploadBytes(storageRef, uploadFile);
      const downloadURL = await getDownloadURL(storageRef);

      const newDocObject = { name: fileName, url: downloadURL };
      const vendorRef = doc(db, "users", editingVendor.id);
      
      await updateDoc(vendorRef, {
        documents: arrayUnion(newDocObject)
      });

      alert("File uploaded successfully!");
      setUploadFile(null); 
      
      const currentDocs = editingVendor.documents || [];
      setEditingVendor({
        ...editingVendor,
        documents: [...currentDocs, newDocObject]
      });
      
      fetchVendors(); 

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Handle Update Vendor Details
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const vendorRef = doc(db, "users", editingVendor.id);
      
      // Update Firestore Data
      await updateDoc(vendorRef, {
        businessName: editingVendor.businessName,
        gstNo: editingVendor.gstNo,
        businessType: editingVendor.businessType,
        contactNumber: editingVendor.contactNumber,
        email: editingVendor.email,
        address: editingVendor.address,
        vendorName: editingVendor.vendorName,
        remarks: editingVendor.remarks,
        stars: editingVendor.stars,
        status: editingVendor.status
      });

      // --- PASSWORD HANDLING ---
      if (newPassword) {
         // Option A: Send Reset Email (No backend needed)
         try {
            await sendPasswordResetEmail(auth, editingVendor.email);
            alert("Vendor details updated. A password reset email has been sent to " + editingVendor.email);
         } catch (err) {
            console.error(err);
            alert("Updated details, but failed to send reset email: " + err.message);
         }
         
         // Option B: Call Cloud Function (If you deployed one)
         /*
         const functions = getFunctions();
         const updatePassword = httpsCallable(functions, 'updateUserPassword');
         await updatePassword({ uid: editingVendor.id, newPassword: newPassword });
         alert("Password updated!");
         */
      } else {
         alert("Vendor details updated successfully!");
      }

      setEditingVendor(null);
      setNewPassword(""); 
      fetchVendors();
    } catch (error) {
      console.error(error);
      alert("Error updating vendor.");
    }
  };

  const handleEditClick = (vendor) => {
      setEditingVendor(vendor);
      setNewPassword("");
      setUploadFile(null); 
  };

  if (loading) return <div className="p-10 text-white">Loading Vendors...</div>;

  return (
    <div className="p-8 pb-20">
      <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-6">Manage Vendors</h1>

      {/* VENDOR TABLE */}
      <div className="glass-panel overflow-hidden rounded-2xl shadow-xl">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3">Business Name</th>
              <th className="px-6 py-3">Owner</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{vendor.businessName}</td>
                <td className="px-6 py-4">{vendor.vendorName}</td>
                <td className="px-6 py-4">{vendor.businessType}</td>
                <td className="px-6 py-4">{vendor.contactNumber}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {vendor.status || 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button 
                    onClick={() => handleEditClick(vendor)}
                    className="text-primary hover:text-secondary font-bold"
                  >
                    Manage
                  </button>
                  <button 
                    onClick={() => handleDeleteVendor(vendor.id, vendor.businessName)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Vendor"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface w-full max-w-4xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10">
            
            <div className="flex justify-between items-center mb-6">
              <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Vendor Profile</h2>
                  <p className="text-sm text-gray-500">Update details or manage documents</p>
              </div>
              <button onClick={() => setEditingVendor(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-red-100 text-gray-500 hover:text-red-500 transition">
                  <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              
              {/* SECTION 1: Business Details */}
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <h3 className="text-sm font-bold text-primary uppercase mb-4 tracking-wider">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Business Name</label>
                        <input 
                            value={editingVendor.businessName} 
                            onChange={(e) => setEditingVendor({...editingVendor, businessName: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">GST Number</label>
                        <input 
                            value={editingVendor.gstNo} 
                            onChange={(e) => setEditingVendor({...editingVendor, gstNo: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Business Type</label>
                        <select 
                            value={editingVendor.businessType} 
                            onChange={(e) => setEditingVendor({...editingVendor, businessType: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        >
                            <option>Construction Materials</option>
                            <option>Interiors & Decor</option>
                            <option>Electronics</option>
                            <option>Plumbing & Sanitary</option>
                            <option>Paints & Chemicals</option>
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Full Address</label>
                        <textarea 
                            value={editingVendor.address} 
                            onChange={(e) => setEditingVendor({...editingVendor, address: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white h-20"
                        />
                    </div>
                </div>
              </div>

              {/* SECTION 2: Owner & Login */}
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <h3 className="text-sm font-bold text-primary uppercase mb-4 tracking-wider">Owner & Login Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Vendor Name</label>
                        <input 
                            value={editingVendor.vendorName} 
                            onChange={(e) => setEditingVendor({...editingVendor, vendorName: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Contact Number</label>
                        <input 
                            value={editingVendor.contactNumber} 
                            onChange={(e) => setEditingVendor({...editingVendor, contactNumber: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Email (Login ID)</label>
                        <input 
                            value={editingVendor.email} 
                            onChange={(e) => setEditingVendor({...editingVendor, email: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-red-500 mb-1">
                            Reset Password <span className="text-[10px] font-normal text-gray-500">(Type anything to trigger reset email)</span>
                        </label>
                        <input 
                            type="text"
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Type here to send reset email..."
                            className="w-full bg-white dark:bg-black/20 border border-red-200 dark:border-red-900/30 rounded p-2 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>
              </div>

              {/* SECTION 3: Admin Controls */}
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <h3 className="text-sm font-bold text-primary uppercase mb-4 tracking-wider">Admin Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Account Status</label>
                        <select 
                            value={editingVendor.status || 'active'} 
                            onChange={(e) => setEditingVendor({...editingVendor, status: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Rating (Stars)</label>
                        <input 
                            type="number" max="5" min="1"
                            value={editingVendor.stars} 
                            onChange={(e) => setEditingVendor({...editingVendor, stars: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Remarks</label>
                        <input 
                            value={editingVendor.remarks} 
                            onChange={(e) => setEditingVendor({...editingVendor, remarks: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 dark:text-white"
                        />
                    </div>
                </div>
              </div>

              {/* SECTION 4: Documents */}
              <div>
                <h3 className="text-lg font-bold text-primary mb-3">Documents</h3>
                
                {/* Existing Documents List */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-4">
                  {editingVendor.documents && editingVendor.documents.length > 0 ? (
                    editingVendor.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <i className="fas fa-file-pdf text-red-500 text-xl"></i>
                          <span className="text-sm font-medium dark:text-gray-300">{doc.name}</span>
                        </div>
                        <div className="flex gap-3">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1">
                            <i className="fas fa-download"></i> View
                          </a>
                          <button 
                            type="button"
                            onClick={() => handleDeleteDoc(editingVendor.id, doc.url, doc.name)}
                            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm italic border-dashed border border-gray-300 p-4 rounded text-center">No documents uploaded.</p>
                  )}
                </div>

                {/* Upload Section */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <input 
                    type="file" 
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button 
                    type="button"
                    onClick={handleFileUpload}
                    disabled={!uploadFile || isUploading}
                    className={`px-4 py-2 rounded-lg text-white font-bold text-sm ${!uploadFile || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    {isUploading ? "Uploading..." : "Upload New"}
                  </button>
                </div>

              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-white/10">
                <button type="button" onClick={() => setEditingVendor(null)} className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition font-bold">Cancel</button>
                <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/30 transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;
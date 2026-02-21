import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [docModal, setDocModal] = useState({ isOpen: false, url: null, name: "" });

  // 1. Fetch Customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "customer"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by newest first (assuming createdAt exists)
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 2. Actions
  const toggleBlockStatus = async (customerId, currentStatus) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    const confirmMessage = newStatus === "blocked" 
        ? "Are you sure you want to block this customer? They will not be able to log in." 
        : "Unblock this customer?";
        
    if (!window.confirm(confirmMessage)) return;

    try {
      await updateDoc(doc(db, "users", customerId), { status: newStatus });
      setCustomers(customers.map(c => c.id === customerId ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const makeVendor = async (customerId, customerName) => {
    if (!window.confirm(`Are you sure you want to upgrade ${customerName} to a Vendor?`)) return;

    try {
      await updateDoc(doc(db, "users", customerId), { 
          role: "vendor",
          businessType: "General", // Default required vendor fields
          status: "active",
          walletBalance: 0 
      });
      // Remove them from the customer list locally
      setCustomers(customers.filter(c => c.id !== customerId));
      alert(`${customerName} has been successfully upgraded to a Vendor.`);
    } catch (error) {
      console.error("Error upgrading to vendor:", error);
      alert("Failed to upgrade customer.");
    }
  };

  // 3. Search and Pagination Logic
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactNumber?.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Customer Directory</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage all registered buyers ({filteredCustomers.length})</p>
        </div>

        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full pl-10 pr-4 py-2.5 outline-none focus:border-primary transition dark:text-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                <th className="p-4 pl-6">Customer Info</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4">ID Proof</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500"><i className="fas fa-spinner fa-spin mr-2"></i> Loading customers...</td></tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">No customers found matching "{searchTerm}"</td></tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    
                    {/* INFO */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                          {customer.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{customer.name}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td className="p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{customer.contactNumber || "N/A"}</p>
                      <p className="text-xs text-gray-400">{customer.interestedIn || "General"}</p>
                    </td>

                    {/* STATUS */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        customer.status === "blocked" 
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                          : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      }`}>
                        {customer.status === "blocked" ? "Blocked" : "Active"}
                      </span>
                    </td>

                    {/* ID PROOF */}
                    <td className="p-4">
                      {customer.idProofUrl ? (
                        <button 
                          onClick={() => setDocModal({ isOpen: true, url: customer.idProofUrl, name: customer.name })}
                          className="flex items-center gap-2 text-xs font-bold text-primary hover:text-secondary transition bg-primary/10 px-3 py-1.5 rounded-lg"
                        >
                          <i className="fas fa-id-card"></i> View ID
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not Uploaded</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 pr-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        {/* Toggle Block/Unblock */}
                        <button 
                          onClick={() => toggleBlockStatus(customer.id, customer.status)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${
                            customer.status === "blocked" 
                              ? "bg-green-100 text-green-600 hover:bg-green-600 hover:text-white" 
                              : "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                          }`}
                          title={customer.status === "blocked" ? "Unblock User" : "Block User"}
                        >
                          <i className={`fas ${customer.status === "blocked" ? "fa-unlock" : "fa-ban"} text-xs`}></i>
                        </button>

                        {/* Upgrade to Vendor */}
                        <button 
                          onClick={() => makeVendor(customer.id, customer.name)}
                          className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm"
                          title="Upgrade to Vendor"
                        >
                          <i className="fas fa-store text-xs"></i>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
            <span className="text-xs text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-white/10 transition"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </button>
              
              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, i) => {
                 // Simple logic to show max 5 page buttons
                 if (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)) {
                    return (
                        <button 
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-8 h-8 rounded-lg border text-xs font-bold transition ${currentPage === i + 1 ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                        >
                            {i + 1}
                        </button>
                    )
                 } else if (i + 1 === currentPage - 2 || i + 1 === currentPage + 2) {
                    return <span key={i} className="px-1 text-gray-400">...</span>
                 }
                 return null;
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-white/10 transition"
              >
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT VIEWER MODAL */}
      {docModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="font-bold text-lg"><i className="fas fa-id-card text-primary mr-2"></i> ID Proof: {docModal.name}</h3>
              <button onClick={() => setDocModal({ isOpen: false, url: null, name: "" })} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-red-500 hover:text-white transition flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-black/50">
              {docModal.url.includes('.pdf') ? (
                <iframe src={docModal.url} className="w-full h-[600px] rounded-lg border border-gray-300 dark:border-white/20" title="PDF Viewer"></iframe>
              ) : (
                <img src={docModal.url} alt="ID Proof" className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg" />
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-surface flex justify-end">
                <a href={docModal.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition flex items-center gap-2">
                    <i className="fas fa-external-link-alt"></i> Open Original
                </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCustomers;
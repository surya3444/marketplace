import { useState, useEffect } from 'react';
import { db } from '../firebase'; // Your standard firebase config
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useVendorOrders = (vendorId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for orders assigned to this vendor
    const q = query(collection(db, "orders"), where("vendorId", "==", vendorId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [vendorId]);

  return { orders, loading };
};
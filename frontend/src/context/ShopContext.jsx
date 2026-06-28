import React, { createContext, useContext, useState, useEffect } from 'react';
import productsData from '../data/products.json';

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    // Load products
    setProducts(productsData.map(p => ({ ...p })));
    // Load purchases from localStorage
    const stored = localStorage.getItem('codecoin_purchases');
    if (stored) {
      try { setPurchases(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const savePurchases = (data) => {
    setPurchases(data);
    localStorage.setItem('codecoin_purchases', JSON.stringify(data));
  };

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelected([]);

  const purchase = (ids) => {
    const now = new Date().toISOString();
    const newPurchases = ids.map(id => {
      const product = products.find(p => p.id === id);
      return { id, productId: id, name: product?.name, price: product?.price, purchasedAt: now, collected: false };
    });
    const updated = [...purchases, ...newPurchases];
    savePurchases(updated);
    // Reduce stock
    setProducts(prev => prev.map(p =>
      ids.includes(p.id) ? { ...p, stock: Math.max(0, p.stock - 1) } : p
    ));
    setSelected([]);
    return newPurchases;
  };

  const collect = (purchaseId) => {
    const updated = purchases.map(p =>
      p.id === purchaseId && p.purchasedAt === purchaseId.purchasedAt
        ? { ...p, collected: true }
        : p
    );
    savePurchases(updated);
  };

  const collectByIndex = (index) => {
    const updated = purchases.map((p, i) =>
      i === index ? { ...p, collected: true } : p
    );
    savePurchases(updated);
  };

  // Admin: add product
  const addProduct = (product) => {
    const newProduct = { ...product, id: Date.now() };
    setProducts(prev => [...prev, newProduct]);
  };

  // Admin: delete product
  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Admin: update product
  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <ShopContext.Provider value={{
      products, selected, purchases,
      toggleSelect, clearSelection, purchase,
      collectByIndex, addProduct, deleteProduct, updateProduct
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);

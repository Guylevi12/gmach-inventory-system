import { db } from '@/firebase/firebase-config';
import { collection, setDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function addItem({ name, quantity, allowMerge = false, existingItemId = null, imageUrl = null }) {
  name = name.trim();

  if (allowMerge && existingItemId) {
    const itemRef = doc(db, 'items', existingItemId);
    const snapshot = await getDocs(query(collection(db, 'items'), where('__name__', '==', existingItemId)));
    const existingData = snapshot.docs[0].data();

    const newQuantity = existingData.quantity + quantity;

    const updateData = { quantity: newQuantity };
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    await updateDoc(itemRef, updateData);

    return { merged: true, newQuantity };
  }

  // 🔥 1. Create empty document reference to get ID first
  const itemsRef = collection(db, 'items');
  const newDocRef = doc(itemsRef);
  const newId = newDocRef.id;

  // 🔥 2. Add document with explicit ID field
  await setDoc(newDocRef, {
    id: newId,
    name,
    quantity,
    imageUrl,
    isActive: true,
    createdAt: serverTimestamp()
  });

  return { added: true, id: newId };
}

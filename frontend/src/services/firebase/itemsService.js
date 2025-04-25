import { db } from '../../firebase-config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function addItem({ name, quantity, allowMerge = false, existingItemId = null }) {
  name = name.trim(); // Clean extra spaces

  if (allowMerge && existingItemId) {
    // Only merge quantity if allowed and ID provided
    const itemRef = doc(db, 'items', existingItemId);
    const snapshot = await getDocs(query(collection(db, 'items'), where('__name__', '==', existingItemId)));
    const existingData = snapshot.docs[0].data();

    const newQuantity = existingData.quantity + quantity;
    await updateDoc(itemRef, { quantity: newQuantity });
    return { merged: true, newQuantity };
  }

  // Otherwise, add new item
  const docRef = await addDoc(collection(db, 'items'), {
    name,
    quantity,
    isActive: true,
    createdAt: serverTimestamp()
  });

  return { added: true, id: docRef.id };
}

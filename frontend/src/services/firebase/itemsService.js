import { db } from '../../firebase-config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function addItem({ name, quantity, allowMerge = false, existingItemId = null, imageUrl = null }) {
  name = name.trim();

  if (allowMerge && existingItemId) {
    const itemRef = doc(db, 'items', existingItemId);
    const snapshot = await getDocs(query(collection(db, 'items'), where('__name__', '==', existingItemId)));
    const existingData = snapshot.docs[0].data();

    const newQuantity = existingData.quantity + quantity;
    await updateDoc(itemRef, { quantity: newQuantity });

    // Also update image if a new one was provided
    if (imageUrl) {
      await updateDoc(itemRef, { imageUrl });
    }

    return { merged: true, newQuantity };
  }

  // Otherwise add new item
  const docRef = await addDoc(collection(db, 'items'), {
    name,
    quantity,
    imageUrl, // ✨ save image URL
    isActive: true,
    createdAt: serverTimestamp()
  });

  return { added: true, id: docRef.id };
}


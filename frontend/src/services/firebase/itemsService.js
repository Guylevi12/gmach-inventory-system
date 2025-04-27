import { db } from '@/firebase/firebase-config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

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

  // Otherwise add new item
  const docRef = await addDoc(collection(db, 'items'), {
    name,
    quantity,
    imageUrl,
    isActive: true,
    createdAt: serverTimestamp()
  });

  return { added: true, id: docRef.id };
}
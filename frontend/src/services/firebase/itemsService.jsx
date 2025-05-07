
import { collection, setDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';


export async function addItem({
  name,
  quantity,
  allowMerge = false,
  existingItemId = null,
  imageUrl = null,
  publicComment = '',
  internalComment = '',
  createdBy = '',
  updatedBy = '',
  createdAt = null,
  updatedAt = null
}) {
  name = name.trim();

  if (allowMerge && existingItemId) {
    const itemRef = doc(db, 'items', existingItemId);
    const snapshot = await getDocs(query(collection(db, 'items'), where('__name__', '==', existingItemId)));
    const existingData = snapshot.docs[0].data();
    const newQuantity = existingData.quantity + quantity;

    const updateData = { quantity: newQuantity };
    if (imageUrl) updateData.imageUrl = imageUrl;
    await updateDoc(itemRef, updateData);

    return { merged: true, newQuantity };
  }

  const itemsSnapshot = await getDocs(collection(db, 'items'));
  const existingItemIds = itemsSnapshot.docs.map(doc => doc.data().ItemId).filter(id => typeof id === 'number');

  const findNextItemId = (ids) => {
    ids = [...new Set(ids)].sort((a, b) => a - b);
    for (let i = 1; i <= ids.length + 1; i++) {
      if (!ids.includes(i)) return i;
    }
  };
  const ItemId = findNextItemId(existingItemIds);
  const itemsRef = collection(db, 'items');
  const newDocRef = doc(itemsRef);

  await setDoc(newDocRef, {
    name,
    quantity,
    imageUrl,
    ItemId,
    isActive: true,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    publicComment,
    internalComment
  });

  return { added: true, ItemId };
}

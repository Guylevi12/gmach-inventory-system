import { collection, setDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

// Helper to find the next free ItemId in a sequence
function findNextItemId(ids) {
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  for (let i = 1; i <= sorted.length + 1; i++) {
    if (!sorted.includes(i)) return i;
  }
}

// Add a new item or merge into an existing one
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

  // Merge logic if requested
  if (allowMerge && existingItemId) {
    const itemRef = doc(db, 'items', existingItemId);
    const snapshot = await getDocs(
      query(collection(db, 'items'), where('__name__', '==', existingItemId))
    );
    const existingData = snapshot.docs[0].data();
    const newQuantity = existingData.quantity + quantity;

    const updateData = { quantity: newQuantity };
    if (imageUrl) updateData.imageUrl = imageUrl;
    await updateDoc(itemRef, updateData);

    return { merged: true, newQuantity };
  }

  // Compute next free ItemId
  const itemsSnapshot = await getDocs(collection(db, 'items'));
  const existingItemIds = itemsSnapshot.docs
    .map(doc => doc.data().ItemId)
    .filter(id => typeof id === 'number');

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

// Move an active item to deletedItems (without carrying ItemId)
export async function moveToDeletedItem(docId, deletedBy = '') {
  // 1. Fetch the original document
  const ref = doc(db, 'items', docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Item not found');

  // 2. Destructure to remove ItemId from the data
  const { ItemId, ...rest } = snap.data();

  // 3. Add to deletedItems collection
  await addDoc(collection(db, 'deletedItems'), {
    ...rest,
    deletedAt: serverTimestamp(),
    deletedBy,
  });

  // 4. Delete the original item
  await deleteDoc(ref);
}

// Restore an item from deletedItems back into items with a new ItemId
export async function restoreDeletedItem(deletedDocId, createdBy = '') {
  // 1. Fetch the deleted document
  const delRef = doc(db, 'deletedItems', deletedDocId);
  const snap = await getDoc(delRef);
  if (!snap.exists()) throw new Error('Deleted item not found');

  const data = snap.data();

  // 2. Compute next free ItemId
  const itemsSnap = await getDocs(collection(db, 'items'));
  const existingIds = itemsSnap.docs
    .map(d => d.data().ItemId)
    .filter(id => typeof id === 'number');

  const newId = findNextItemId(existingIds);

  // 3. Write back to items with the new ItemId
  await setDoc(doc(collection(db, 'items')), {
    ...data,
    ItemId: newId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
    updatedBy: createdBy,
    isActive: true,
  });


  // 4. Remove from deletedItems
  await deleteDoc(delRef);
}

// מצא מוצר לפי ItemId (שזה המספר שמקודד בברקוד)
export async function getItemByItemId(itemId) {
  const q = query(collection(db, 'items'), where('ItemId', '==', Number(itemId)));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  throw new Error('לא נמצא מוצר עם ברקוד זה');
}


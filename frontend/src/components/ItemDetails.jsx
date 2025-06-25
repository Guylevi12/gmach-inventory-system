import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

const ItemDetails = () => {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            const q = query(collection(db, 'items'), where('ItemId', '==', parseInt(id)));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                setItem({ id: docSnap.id, ...docSnap.data() });
            } else {
                setItem(null);
            }
            setLoading(false);
        };

        fetchItem();
    }, [id]);

    if (loading) {
        return <div style={{ padding: '2rem' }}>Loading item details...</div>;
    }

    if (!item) {
        return <div style={{ padding: '2rem' }}>Item not found.</div>;
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2>{item.name}</h2>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <img
                src={item.imageUrl || '/no-image-available.png'}
                alt={item.name}
                style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}
            />

            <p><strong>Item ID:</strong> {item.ItemId}</p>
            {item.publicComment && <p><strong>הערה:</strong> {item.publicComment}</p>}

            {/* Internal info (would not be shown in catalog, but okay in ItemDetails) */}
            {item.internalComment && <p style={{ color: '#777' }}><strong>הערה פנימית:</strong> {item.internalComment}</p>}
            <p style={{ fontSize: '0.85rem', color: '#666' }}>נוצר על ידי: {item.createdBy || 'לא ידוע'}</p>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>עודכן לאחרונה על ידי: {item.updatedBy || 'לא ידוע'}</p>
            {item.createdAt && (
                <p style={{ fontSize: '0.85rem', color: '#666' }}>נוצר בתאריך: {new Date(item.createdAt.seconds * 1000).toLocaleString('he-IL')}</p>
            )}
            {item.updatedAt && (
                <p style={{ fontSize: '0.85rem', color: '#666' }}>עודכן בתאריך: {new Date(item.updatedAt.seconds * 1000).toLocaleString('he-IL')}</p>
            )}
        </div>
    );
};

export default ItemDetails;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

const ItemDetails = () => {
    const { id } = useParams(); // Get item ID from URL
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            const docRef = doc(db, 'items', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
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

            <h2>{item.name}</h2>
            <p><strong>Quantity:</strong> {item.quantity}</p>

        </div>
    );
};

export default ItemDetails;

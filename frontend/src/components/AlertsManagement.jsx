// src/components/AlertsManagement.jsx - Admin component for managing alerts
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { useUser } from '../UserContext';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';

const AlertsManagement = () => {
    const { user } = useUser();
    const [alerts, setAlerts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    // Check if user is admin
    const isAdmin = user && (user.role === 'MainAdmin' || user.role === 'GmachAdmin');

    useEffect(() => {
        if (!isAdmin) return;

        const alertsQuery = query(
            collection(db, 'alerts'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
            const alertsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAlerts(alertsList);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
                direction: 'rtl'
            }}>
                <h2>אין הרשאה לצפייה בדף זה</h2>
            </div>
        );
    }

    const resetForm = () => {
        setFormData({
            title: '',
            message: '',
            type: 'info',
            isActive: true
        });
        setEditingAlert(null);
        setShowForm(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) return;

        setSaving(true);
        try {
            if (editingAlert) {
                // Update existing alert
                await updateDoc(doc(db, 'alerts', editingAlert.id), {
                    ...formData,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                });
            } else {
                // Create new alert
                await addDoc(collection(db, 'alerts'), {
                    ...formData,
                    createdAt: serverTimestamp(),
                    createdBy: user.uid,
                    createdByName: user.displayName || user.email || user.username
                });
            }
            resetForm();
        } catch (error) {
            console.error('Error saving alert:', error);
            alert('שגיאה בשמירת ההתראה');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (alert) => {
        setFormData({
            title: alert.title || '',
            message: alert.message || '',
            type: alert.type || 'info',
            isActive: alert.isActive
        });
        setEditingAlert(alert);
        setShowForm(true);
    };

    const handleToggleActive = async (alert) => {
        try {
            await updateDoc(doc(db, 'alerts', alert.id), {
                isActive: !alert.isActive,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
            });
        } catch (error) {
            console.error('Error toggling alert:', error);
            alert('שגיאה בעדכון ההתראה');
        }
    };

    const handleDelete = async (alertId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את ההתראה?')) return;

        try {
            await deleteDoc(doc(db, 'alerts', alertId));
        } catch (error) {
            console.error('Error deleting alert:', error);
            alert('שגיאה במחיקת ההתראה');
        }
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            direction: 'rtl',
            fontFamily: '"Assistant", "Heebo", system-ui, sans-serif'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1 style={{ margin: 0, color: '#1f2937' }}>ניהול התראות</h1>
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '16px',
                        fontWeight: '500'
                    }}
                >
                    <Plus size={20} />
                    התראה חדשה
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '500px',
                        direction: 'rtl'
                    }}>
                        <h3 style={{ marginTop: 0 }}>{editingAlert ? 'עריכת התראה' : 'התראה חדשה'}</h3>

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    כותרת (אופציונלי)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="כותרת ההתראה"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    הודעה *
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="תוכן ההתראה"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    סוג התראה
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="info">מידע</option>
                                    <option value="warning">אזהרה</option>
                                    <option value="success">הצלחה</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    התראה פעילה
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={saving}
                                    style={{
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <X size={16} />
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !formData.message.trim()}
                                    style={{
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: saving || !formData.message.trim() ? 0.6 : 1
                                    }}
                                >
                                    <Save size={16} />
                                    {saving ? 'שומר...' : 'שמור'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Alerts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alerts.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#6b7280',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                    }}>
                        אין התראות במערכת
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} style={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        {alert.title && (
                                            <h3 style={{ margin: 0, fontSize: '18px' }}>{alert.title}</h3>
                                        )}
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            backgroundColor: alert.type === 'warning' ? '#fef3c7' :
                                                alert.type === 'success' ? '#d1fae5' : '#dbeafe',
                                            color: alert.type === 'warning' ? '#92400e' :
                                                alert.type === 'success' ? '#065f46' : '#1e40af'
                                        }}>
                                            {alert.type === 'warning' ? 'אזהרה' :
                                                alert.type === 'success' ? 'הצלחה' : 'מידע'}
                                        </span>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            backgroundColor: alert.isActive ? '#d1fae5' : '#f3f4f6',
                                            color: alert.isActive ? '#065f46' : '#6b7280'
                                        }}>
                                            {alert.isActive ? 'פעילה' : 'לא פעילה'}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 12px 0', lineHeight: '1.5' }}>{alert.message}</p>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                        נוצר על ידי: {alert.createdByName} •
                                        {alert.createdAt && ` ${alert.createdAt.toDate().toLocaleDateString('he-IL')}`}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleToggleActive(alert)}
                                        style={{
                                            backgroundColor: alert.isActive ? '#f59e0b' : '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer'
                                        }}
                                        title={alert.isActive ? 'השבת' : 'הפעל'}
                                    >
                                        {alert.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(alert)}
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(alert.id)}
                                        style={{
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AlertsManagement;
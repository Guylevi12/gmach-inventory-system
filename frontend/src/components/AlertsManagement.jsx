// src/components/AlertsManagement.jsx - Enhanced with expiration dates
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { useUser } from '../UserContext';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, Calendar, Clock } from 'lucide-react';

const AlertsManagement = () => {
    const { user } = useUser();
    const [alerts, setAlerts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        isActive: true,
        hasExpiration: false,
        expirationDate: '',
        expirationTime: '23:59'
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
            isActive: true,
            hasExpiration: false,
            expirationDate: '',
            expirationTime: '23:59'
        });
        setEditingAlert(null);
        setShowForm(false);
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) return;

        setSaving(true);
        try {
            let alertData = { ...formData };

            // Handle expiration date
            if (formData.hasExpiration && formData.expirationDate) {
                const expirationDateTime = new Date(`${formData.expirationDate}T${formData.expirationTime}`);
                alertData.expirationDate = expirationDateTime;
            } else {
                alertData.expirationDate = null;
            }

            // Remove form-specific fields
            delete alertData.hasExpiration;

            if (editingAlert) {
                // Update existing alert
                await updateDoc(doc(db, 'alerts', editingAlert.id), {
                    ...alertData,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                });
            } else {
                // Create new alert
                await addDoc(collection(db, 'alerts'), {
                    ...alertData,
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
        const hasExpiration = alert.expirationDate ? true : false;
        let expirationDate = '';
        let expirationTime = '23:59';

        if (hasExpiration && alert.expirationDate) {
            const expDate = alert.expirationDate.toDate ? alert.expirationDate.toDate() : new Date(alert.expirationDate);
            expirationDate = expDate.toISOString().split('T')[0];
            expirationTime = expDate.toTimeString().slice(0, 5);
        }

        setFormData({
            title: alert.title || '',
            message: alert.message || '',
            type: alert.type || 'info',
            isActive: alert.isActive,
            hasExpiration,
            expirationDate,
            expirationTime
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

    const getExpirationStatus = (alert) => {
        if (!alert.expirationDate) return { status: 'none', text: 'ללא תפוגה' };

        const now = new Date();
        const expDate = alert.expirationDate.toDate ? alert.expirationDate.toDate() : new Date(alert.expirationDate);

        if (now > expDate) {
            return { status: 'expired', text: 'פג תוקף' };
        }

        const timeLeft = expDate - now;
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

        if (daysLeft <= 1) {
            const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
            return { status: 'soon', text: `${hoursLeft} שעות נותרו` };
        }

        return { status: 'active', text: `${daysLeft} ימים נותרים` };
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
                        maxHeight: '90vh',
                        overflowY: 'auto',
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

                            {/* Expiration Settings */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.hasExpiration}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            hasExpiration: e.target.checked,
                                            expirationDate: e.target.checked ? formData.expirationDate : '',
                                            expirationTime: e.target.checked ? formData.expirationTime : '23:59'
                                        })}
                                    />
                                    <Calendar size={16} />
                                    הגדר תאריך תפוגה
                                </label>

                                {formData.hasExpiration && (
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>
                                                    תאריך תפוגה
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.expirationDate}
                                                    min={getMinDate()}
                                                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                                                    required={formData.hasExpiration}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px',
                                                        fontSize: '14px'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: '0 0 100px' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>
                                                    שעה
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.expirationTime}
                                                    onChange={(e) => setFormData({ ...formData, expirationTime: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px',
                                                        fontSize: '14px'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{
                                            marginTop: '0.5rem',
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Clock size={12} />
                                            ההתראה תוסר אוטומטית בתאריך ושעה זו
                                        </div>
                                    </div>
                                )}
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
                    alerts.map(alert => {
                        const expirationStatus = getExpirationStatus(alert);

                        return (
                            <div key={alert.id} style={{
                                backgroundColor: 'white',
                                border: `1px solid ${expirationStatus.status === 'expired' ? '#ef4444' : '#e5e7eb'}`,
                                borderRadius: '8px',
                                padding: '1.5rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                opacity: expirationStatus.status === 'expired' ? 0.6 : 1
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
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
                                            {/* Expiration status badge */}
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                backgroundColor:
                                                    expirationStatus.status === 'expired' ? '#fee2e2' :
                                                        expirationStatus.status === 'soon' ? '#fef3c7' :
                                                            expirationStatus.status === 'active' ? '#dbeafe' : '#f3f4f6',
                                                color:
                                                    expirationStatus.status === 'expired' ? '#dc2626' :
                                                        expirationStatus.status === 'soon' ? '#d97706' :
                                                            expirationStatus.status === 'active' ? '#2563eb' : '#6b7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {expirationStatus.status !== 'none' && <Clock size={12} />}
                                                {expirationStatus.text}
                                            </span>
                                        </div>
                                        <p style={{ margin: '0 0 12px 0', lineHeight: '1.5' }}>{alert.message}</p>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            נוצר על ידי: {alert.createdByName} •
                                            {alert.createdAt && ` ${alert.createdAt.toDate().toLocaleDateString('he-IL')}`}
                                            {alert.expirationDate && (
                                                <span>
                                                    {' • '}יפוג ב: {alert.expirationDate.toDate().toLocaleDateString('he-IL')}
                                                    {' '}בשעה {alert.expirationDate.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
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
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AlertsManagement;
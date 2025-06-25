// EmailJS Solution - React Component
// No Firebase Functions needed - runs client-side

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import emailjs from '@emailjs/browser';

// Replace these with your actual EmailJS IDs
const EMAILJS_CONFIG = {
    serviceId: 'service_zbzqfa3',
    templateId: 'template_02cqfdn',
    publicKey: 'gJHtAe_l22dY8tKju'
};

// Email reminder system component
const EmailReminderSystem = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [results, setResults] = useState(null);

    // Initialize EmailJS
    useEffect(() => {
        emailjs.init(EMAILJS_CONFIG.publicKey);

        // Auto-check on component mount
        checkAndSendReminders();

        // Set up daily check (run every hour, but only send once per day)
        const interval = setInterval(() => {
            const now = new Date();
            const hour = now.getHours();

            // Run at 9 AM Israeli time
            if (hour === 9) {
                checkAndSendReminders();
            }
        }, 60 * 60 * 1000); // Check every hour

        return () => clearInterval(interval);
    }, []);

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    // Check for orders needing reminders and send emails
    const checkAndSendReminders = async () => {
        setIsChecking(true);
        setResults(null);

        try {
            const today = new Date();
            const twoDaysFromNow = new Date(today);
            twoDaysFromNow.setDate(today.getDate() + 2);

            // Format date for comparison (YYYY-MM-DD)
            const targetDate = twoDaysFromNow.toISOString().split('T')[0];

            console.log(`📅 Checking for orders returning on: ${targetDate}`);

            // Query active orders with return date = target date
            const ordersQuery = query(
                collection(db, 'orders'),
                where('status', 'in', ['active', 'confirmed', 'picked_up', 'open']),
                where('returnDate', '==', targetDate)
            );

            const ordersSnapshot = await getDocs(ordersQuery);

            const checkResults = {
                totalFound: ordersSnapshot.size,
                emailsSent: 0,
                alreadySent: 0,
                errors: []
            };

            if (ordersSnapshot.empty) {
                setResults({
                    ...checkResults,
                    message: 'לא נמצאו הזמנות הדורשות תזכורת היום'
                });
                setLastCheck(new Date());
                return;
            }

            // Process each order
            for (const orderDoc of ordersSnapshot.docs) {
                const order = orderDoc.data();
                const orderId = orderDoc.id;

                // Skip if reminder already sent
                if (order.reminderSent) {
                    checkResults.alreadySent++;
                    continue;
                }

                try {
                    // Prepare email template parameters
                    const templateParams = {
                        to_email: order.email,
                        to_name: order.clientName,
                        client_name: order.clientName,
                        return_date: formatDate(order.returnDate),
                        volunteer_name: order.volunteerName || 'צוות הארגון',
                        volunteer_phone: order.phone || 'לא צוין',
                        organization_name: 'גמח שמחת זקנתי',
                        items_list: order.items?.map(item =>
                            `• ${item.name} - כמות: ${item.quantity}`
                        ).join('\n') || 'לא צוינו פריטים',
                        total_items: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
                        event_type: order.eventType || 'כללי',
                        pickup_date: formatDate(order.pickupDate),
                        order_id: orderId
                    };

                    // Send email using EmailJS
                    const result = await emailjs.send(
                        EMAILJS_CONFIG.serviceId,
                        EMAILJS_CONFIG.templateId,
                        templateParams
                    );

                    console.log(`✅ Email sent successfully:`, result);

                    // Mark reminder as sent in database
                    await updateDoc(doc(db, 'orders', orderId), {
                        reminderSent: true,
                        reminderSentAt: Timestamp.now(),
                        emailSentResult: {
                            status: result.status,
                            text: result.text,
                            sentAt: new Date().toISOString()
                        }
                    });

                    checkResults.emailsSent++;

                } catch (error) {
                    console.error(`❌ Failed to send reminder for order ${orderId}:`, error);
                    checkResults.errors.push({
                        orderId,
                        email: order.email,
                        clientName: order.clientName,
                        error: error.message
                    });
                }
            }

            setResults({
                ...checkResults,
                message: `בדיקה הושלמה: ${checkResults.emailsSent} תזכורות נשלחו`
            });

        } catch (error) {
            console.error('❌ Error in reminder check:', error);
            setResults({
                totalFound: 0,
                emailsSent: 0,
                errors: [{ error: error.message }],
                message: 'שגיאה בבדיקת תזכורות'
            });
        } finally {
            setIsChecking(false);
            setLastCheck(new Date());
        }
    };

    // Manual trigger for testing
    const handleManualCheck = () => {
        checkAndSendReminders();
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }} dir="rtl">

            {/* Header */}
            <div style={{
                background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                color: 'white',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
                    📧 מערכת תזכורות אוטומטית
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                    תזכורות להחזרת פריטים - 2 ימים לפני תאריך החזרה
                </p>
            </div>

            {/* Status Card */}
            <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ margin: 0, color: '#1f2937' }}>סטטוס המערכת</h2>
                    <button
                        onClick={handleManualCheck}
                        disabled={isChecking}
                        style={{
                            background: isChecking ? '#9ca3af' : '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: isChecking ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {isChecking ? '🔄 בודק...' : '🔍 בדוק תזכורות'}
                    </button>
                </div>

                {/* Last Check Info */}
                {lastCheck && (
                    <div style={{
                        background: '#f3f4f6',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        color: '#6b7280'
                    }}>
                        <strong>בדיקה אחרונה:</strong> {lastCheck.toLocaleString('he-IL')}
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div style={{
                        background: results.errors.length > 0 ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${results.errors.length > 0 ? '#fecaca' : '#bbf7d0'}`,
                        borderRadius: '8px',
                        padding: '1.5rem'
                    }}>
                        <h3 style={{
                            margin: '0 0 1rem 0',
                            color: results.errors.length > 0 ? '#dc2626' : '#059669'
                        }}>
                            {results.message}
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {results.totalFound}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>נמצאו</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                    {results.emailsSent}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>נשלחו</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                    {results.alreadySent}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>כבר נשלחו</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                    {results.errors.length}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>שגיאות</div>
                            </div>
                        </div>

                        {/* Error Details */}
                        {results.errors.length > 0 && (
                            <div style={{
                                background: 'white',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '1rem'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>שגיאות:</h4>
                                {results.errors.map((error, index) => (
                                    <div key={index} style={{
                                        fontSize: '0.875rem',
                                        color: '#7f1d1d',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {error.clientName ? `${error.clientName} (${error.email})` : 'שגיאה כללית'}: {error.error}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                background: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '2rem'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>
                    🔧 הוראות למנהלי המערכת
                </h3>
                <ul style={{ color: '#92400e', paddingRight: '1.5rem' }}>
                    <li>המערכת בודקת אוטומטית כל יום ב-9:00 בבוקר</li>
                    <li>ניתן להפעיל בדיקה ידנית בכל עת באמצעות הכפתור למעלה</li>
                    <li>תזכורות נשלחות רק פעם אחת לכל הזמנה</li>
                    <li>המערכת שולחת תזכורות 2 ימים לפני תאריך ההחזרה</li>
                    <li>כל התזכורות נרשמות במסד הנתונים למעקב</li>
                </ul>
            </div>
        </div>
    );
};

export default EmailReminderSystem;
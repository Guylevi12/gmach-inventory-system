// src/services/emailService.js
// Automated Reminder Email Service + Manual Pickup Confirmation

import { updateDoc, doc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
    serviceId: 'service_zbzqfa3',
    reminderTemplateId: 'template_02cqfdn',
    confirmationTemplateId: 'template_lv2sc1p',
    publicKey: 'gJHtAe_l22dY8tKju'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

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

// MANUAL FUNCTION: Send manual pickup email (triggered by admin button only)
export const sendManualPickupEmail = async (orderData, orderId) => {
    try {
        console.log(`📧 Sending manual pickup email for order ${orderId}`);

        const templateParams = {
            to_email: orderData.email,
            to_name: orderData.clientName,
            client_name: orderData.clientName,
            pickup_date: formatDate(orderData.pickupDate),
            return_date: formatDate(orderData.returnDate),
            volunteer_name: 'צוות הארגון',
            volunteer_phone: '054-2575886', // Your fixed phone number
            organization_name: 'גמח שמחת זקנתי',
            items_list: orderData.items?.map(item =>
                `• ${item.name} - כמות: ${item.quantity}`
            ).join('\n') || 'לא צוינו פריטים',
            total_items: orderData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            event_type: orderData.eventType || 'כללי',
            order_id: orderId,
            pickup_location: orderData.pickupLocation || 'מיקום לפי תיאום',
            special_instructions: orderData.specialInstructions || 'אין הוראות מיוחדות'
        };

        const result = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.confirmationTemplateId,
            templateParams
        );

        console.log(`✅ Manual pickup email sent successfully:`, result);

        // Mark manual email as sent in database
        await updateDoc(doc(db, 'orders', orderId), {
            manualEmailSent: true,
            manualEmailSentAt: Timestamp.now(),
            manualEmailResult: {
                status: result.status,
                text: result.text,
                sentAt: new Date().toISOString(),
                sentBy: 'admin' // Mark as admin-triggered
            }
        });

        return { success: true, result };

    } catch (error) {
        console.error(`❌ Failed to send manual pickup email for order ${orderId}:`, error);
        return { success: false, error: error.message };
    }
};

// REMOVED: sendPickupConfirmationEmail function - no longer needed for automatic sending

// Send reminder email (existing function, unchanged)
export const sendReminderEmail = async (order, orderId) => {
    try {
        console.log(`📧 Sending reminder email for order ${orderId}`);

        const templateParams = {
            to_email: order.email,
            to_name: order.clientName,
            client_name: order.clientName,
            return_date: formatDate(order.returnDate),
            volunteer_name: order.volunteerName || 'צוות הארגון',
            volunteer_phone: '054-2575886',
            organization_name: 'גמח שמחת זקנתי',
            items_list: order.items?.map(item =>
                `• ${item.name} - כמות: ${item.quantity}`
            ).join('\n') || 'לא צוינו פריטים',
            total_items: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            event_type: order.eventType || 'כללי',
            pickup_date: formatDate(order.pickupDate),
            order_id: orderId
        };

        const result = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.reminderTemplateId,
            templateParams
        );

        console.log(`✅ Reminder email sent successfully:`, result);

        await updateDoc(doc(db, 'orders', orderId), {
            reminderSent: true,
            reminderSentAt: Timestamp.now(),
            emailSentResult: {
                status: result.status,
                text: result.text,
                sentAt: new Date().toISOString()
            }
        });

        return { success: true, result };

    } catch (error) {
        console.error(`❌ Failed to send reminder for order ${orderId}:`, error);
        return { success: false, error: error.message };
    }
};

// Modified function: Check and send ONLY reminders (removed pickup confirmations)
export const checkAndSendAllEmails = async () => {
    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);
    const reminderDateStr = twoDaysFromNow.toISOString().split('T')[0];

    console.log(`📅 Checking emails for reminder date: ${reminderDateStr}`);

    const results = {
        reminders: { sent: 0, alreadySent: 0, errors: [] },
        totalFound: 0
    };

    try {
        // Check for reminder emails only (orders with return date = 2 days from now)
        console.log('🔍 Checking for reminders...');
        const reminderQuery = query(
            collection(db, 'orders'),
            where('status', 'in', ['active', 'confirmed', 'picked_up', 'open']),
            where('returnDate', '==', reminderDateStr)
        );

        const reminderSnapshot = await getDocs(reminderQuery);
        results.totalFound = reminderSnapshot.size;

        for (const orderDoc of reminderSnapshot.docs) {
            const order = orderDoc.data();
            const orderId = orderDoc.id;

            if (!order.reminderSent) {
                const result = await sendReminderEmail(order, orderId);
                if (result.success) {
                    results.reminders.sent++;
                } else {
                    results.reminders.errors.push({
                        orderId,
                        email: order.email,
                        clientName: order.clientName,
                        error: result.error
                    });
                }
            } else {
                results.reminders.alreadySent++;
            }
        }

        const totalSent = results.reminders.sent;
        const totalErrors = results.reminders.errors.length;

        console.log(`📊 Email check results:`, {
            reminders: results.reminders,
            totalSent,
            totalErrors
        });

        return {
            ...results,
            totalSent,
            totalErrors,
            message: totalSent > 0 ?
                `בדיקה הושלמה: ${totalSent} תזכורות נשלחו` :
                'לא נמצאו תזכורות לשליחה היום'
        };

    } catch (error) {
        console.error('❌ Error in email check:', error);
        return {
            reminders: { sent: 0, alreadySent: 0, errors: [] },
            totalFound: 0,
            totalSent: 0,
            totalErrors: 1,
            errors: [{ error: error.message }],
            message: 'שגיאה בבדיקת אימיילים'
        };
    }
};
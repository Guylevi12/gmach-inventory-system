import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import imageCompression from 'browser-image-compression';

const uploadToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/dpegnxew7/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'GmachSystem');

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  return data.secure_url;
};

const ItemFormModal = ({
  editingItem,
  name,
  quantity,
  imageUrl,
  imageFile,
  onNameChange,
  onQuantityChange,
  onImageUrlChange,
  onImageFileChange,
  onCancel,
  onSubmit,
  publicComment,
  internalComment,
  onPublicCommentChange,
  onInternalCommentChange,
}) => {
  const modalRef = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onCancel();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onCancel]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      direction: 'ltr',
      padding: '1rem' // הוספת padding לעמודים צדדיים
    }}>
      <div
        ref={modalRef}
        style={{
          position: 'relative',
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          width: '95%', // עובד טוב יותר למובייל
          maxWidth: '500px',
          direction: 'rtl',
          textAlign: 'initial',
          maxHeight: '90vh', // הגבלת גובה
          overflowY: 'auto', // גלילה במידת הצורך
          boxSizing: 'border-box'
        }}
      >
        {/* לחצן הסגירה */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.8rem',
            cursor: 'pointer',
            lineHeight: 1,
            color: '#666',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="סגור"
        >
          &times;
        </button>

        <h3 style={{ 
          textAlign: 'center',
          marginBottom: '2rem',
          fontSize: '1.5rem',
          color: '#333'
        }}>
          {editingItem ? 'עריכת מוצר' : 'הוספת מוצר חדש'}
        </h3>
        
        <form onSubmit={onSubmit}>
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>שם המוצר:</label>
            <input
              dir="rtl"
              type="text"
              value={name}
              onChange={onNameChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldContainerStyle}>
            <label style={labelStyle}>כמות:</label>
            <input
              dir="rtl"
              type="number"
              value={quantity}
              onChange={onQuantityChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldContainerStyle}>
            <label style={labelStyle}>הערה לפרסום (חיצונית):</label>
            <input
              dir="rtl"
              type="text"
              value={publicComment}
              onChange={onPublicCommentChange}
              style={inputStyle}
            />
          </div>

          <div style={fieldContainerStyle}>
            <label style={labelStyle}>הערה פנימית:</label>
            <input
              dir="rtl"
              type="text"
              value={internalComment}
              onChange={onInternalCommentChange}
              style={inputStyle}
            />
          </div>

          <div style={fieldContainerStyle}>
            <label style={labelStyle}>תמונה (או כתובת URL):</label>
            <input
              dir="rtl"
              type="text"
              value={imageUrl}
              onChange={onImageUrlChange}
              placeholder="הדבק כתובת תמונה (או העלה קובץ)"
              style={inputStyle}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const uploadedUrl = await uploadToCloudinary(file);
                  onImageUrlChange({ target: { value: uploadedUrl } });
                  toast.success('התמונה הועלתה בהצלחה!');
                }
              }}
              style={{
                ...inputStyle,
                marginTop: '0.5rem',
                padding: '8px'
              }}
            />
          </div>

          {(imageUrl || imageFile) && (
            <div style={{ 
              marginBottom: '1.5rem', 
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                alt="preview"
                style={{
                  maxHeight: '150px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '2rem',
            flexWrap: 'wrap' // למובייל
          }}>
            <button 
              type="submit" 
              style={{
                ...submitBtnStyle,
                minWidth: '120px' // רוחב מינימלי
              }}
            >
              {editingItem ? 'שמור שינויים' : 'הוסף מוצר'}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              style={{
                ...cancelBtnStyle,
                minWidth: '120px' // רוחב מינימלי
              }}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// סטיילים משופרים
const fieldContainerStyle = {
  marginBottom: '1.5rem',
  width: '100%'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '600',
  color: '#333',
  fontSize: '1rem'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '2px solid #e0e0e0',
  fontSize: '16px', // חשוב למובייל - מונע זום
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  backgroundColor: '#fff',
  fontFamily: 'inherit',
  outline: 'none'
};

// Add focus styles
const focusStyle = `
  input:focus {
    border-color: #1976d2 !important;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1) !important;
  }
`;

const submitBtnStyle = {
  padding: '12px 20px',
  backgroundColor: '#1976d2',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  transition: 'background-color 0.2s ease',
  flex: '1',
  maxWidth: '200px'
};

const cancelBtnStyle = {
  padding: '12px 20px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  transition: 'background-color 0.2s ease',
  flex: '1',
  maxWidth: '200px'
};

// הוספת CSS גלובלי לטיפול בזום במובייל
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    ${focusStyle}
    
    @media (max-width: 768px) {
      input, textarea, select {
        font-size: 16px !important;
        transform: none !important;
      }
      
      .modal-content {
        margin: 1rem;
        max-height: calc(100vh - 2rem);
      }
    }
    
    /* מניעת זום במובייל */
    @media screen and (max-width: 768px) {
      input[type="text"],
      input[type="number"],
      input[type="email"],
      input[type="tel"],
      input[type="url"],
      textarea {
        font-size: 16px;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default ItemFormModal;
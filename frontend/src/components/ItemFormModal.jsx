import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import imageCompression from 'browser-image-compression';
import { X, Plus, Trash2 } from 'lucide-react';
import ImageGallery from './ImageGallery';
import { getAllImages } from '../utils/imageUtils';

const uploadToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/dcydl9rz8/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'GmachMedia'); // preset החדש שלך
 
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
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize images from editing item or create new array
  useEffect(() => {
    if (editingItem) {
      const existingImages = getAllImages(editingItem);
      setImages(existingImages.map((url, index) => ({
        id: Date.now() + index,
        url: url,
        isUploaded: true
      })));
    } else {
      setImages([]);
    }
  }, [editingItem]);

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

  // Add image from URL
  const addImageFromUrl = () => {
    if (imageUrl && imageUrl.trim()) {
      const newImage = {
        id: Date.now(),
        url: imageUrl.trim(),
        isUploaded: true
      };
      setImages(prev => [...prev, newImage]);
      onImageUrlChange({ target: { value: '' } }); // Clear the input
    }
  };

  // Upload and add image file
  const addImageFromFile = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      });

      // Upload to Cloudinary
      const uploadedUrl = await uploadToCloudinary(compressedFile);
      
      const newImage = {
        id: Date.now(),
        url: uploadedUrl,
        isUploaded: true
      };
      
      setImages(prev => [...prev, newImage]);
      toast.success('התמונה הועלתה בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בהעלאת התמונה: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Remove image
  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Move image up in order
  const moveImageUp = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages;
    });
  };

  // Move image down in order
  const moveImageDown = (index) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare images array for saving
    const finalImages = images.map(img => img.url);
    
    // Create a temporary item object for the onSubmit function
    const tempItem = {
      images: finalImages,
      imageUrl: finalImages[0] || null // for backward compatibility
    };
    
    // Call the original onSubmit with modified data
    const originalFormData = {
      name,
      quantity,
      publicComment,
      internalComment,
      images: finalImages,
      imageUrl: finalImages[0] || null
    };
    
    // Pass this data to the parent component
    await onSubmit(e, originalFormData);
  };

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
      padding: '1rem'
    }}>
      <div
        ref={modalRef}
        style={{
          position: 'relative',
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '600px',
          direction: 'rtl',
          textAlign: 'initial',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* כפתור סגירה */}
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

        <form onSubmit={handleSubmit}>
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

          {/* תמונות */}
          <div style={fieldContainerStyle}>
            <label style={labelStyle}>תמונות המוצר:</label>
            
            {/* הוספת תמונה מ-URL */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                dir="rtl"
                type="text"
                value={imageUrl}
                onChange={onImageUrlChange}
                placeholder="הדבק כתובת תמונה (URL)"
                style={{ ...inputStyle, flex: 1, margin: 0 }}
              />
              <button
                type="button"
                onClick={addImageFromUrl}
                disabled={!imageUrl.trim()}
                style={{
                  padding: '8px 12px',
                  backgroundColor: imageUrl.trim() ? '#1976d2' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: imageUrl.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap'
                }}
              >
                הוסף
              </button>
            </div>

            {/* העלאת קובץ */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    addImageFromFile(file);
                    e.target.value = ''; // Clear the input
                  }
                }}
                style={{
                  ...inputStyle,
                  padding: '8px'
                }}
                disabled={isUploading}
              />
              {isUploading && (
                <div style={{ fontSize: '0.875rem', color: '#1976d2', marginTop: '0.5rem' }}>
                  מעלה תמונה...
                </div>
              )}
            </div>

            {/* תצוגת התמונות הקיימות */}
            {images.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                  תמונות ({images.length})
                </h4>
                
                {/* גלריה לתצוגה */}
                <div style={{ marginBottom: '1rem' }}>
                  <ImageGallery 
                    item={{ images: images.map(img => img.url) }}
                    width="100%"
                    height="200px"
                    showNavigation={true}
                  />
                </div>

                {/* רשימת תמונות לעריכה */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {images.map((image, index) => (
                    <div key={image.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      background: '#f9fafb',
                      position: 'relative'
                    }}>
                      <img
                        src={image.url}
                        alt={`תמונה ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginBottom: '0.5rem'
                        }}
                      />
                      
                      {/* מספר התמונה */}
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </div>
                      
                      {/* כפתורי פעולה */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '0.25rem'
                      }}>
                        <button
                          type="button"
                          onClick={() => moveImageUp(index)}
                          disabled={index === 0}
                          style={{
                            padding: '2px 4px',
                            fontSize: '0.75rem',
                            backgroundColor: index === 0 ? '#ccc' : '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            flex: 1
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImageDown(index)}
                          disabled={index === images.length - 1}
                          style={{
                            padding: '2px 4px',
                            fontSize: '0.75rem',
                            backgroundColor: index === images.length - 1 ? '#ccc' : '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: index === images.length - 1 ? 'not-allowed' : 'pointer',
                            flex: 1
                          }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          style={{
                            padding: '2px 4px',
                            fontSize: '0.75rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            flex: 1
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <button
              type="submit"
              disabled={isUploading}
              style={{
                ...submitBtnStyle,
                minWidth: '120px',
                opacity: isUploading ? 0.6 : 1,
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              {isUploading ? 'מעלה...' : editingItem ? 'שמור שינויים' : 'הוסף מוצר'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              style={{
                ...cancelBtnStyle,
                minWidth: '120px',
                opacity: isUploading ? 0.6 : 1,
                cursor: isUploading ? 'not-allowed' : 'pointer'
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
  fontSize: '16px',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  backgroundColor: '#fff',
  fontFamily: 'inherit',
  outline: 'none'
};

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

export default ItemFormModal;
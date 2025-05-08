import React, { useEffect, useRef } from 'react';

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

    // Close modal when clicking outside or pressing Escape
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onCancel(); // Close modal if clicked outside
            }
        };

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onCancel(); // Close modal if Escape key is pressed
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onCancel]);

    // Handle form submission
    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div
                ref={modalRef}
                style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '10px',
                    width: '90%',
                    maxWidth: '500px'
                }}
            >
                <h3 style={{ textAlign: 'center' }}>{editingItem ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</h3>
                <form onSubmit={onSubmit}>
                    <label>שם המוצר:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={onNameChange}
                        required
                        style={inputStyle}
                    />

                    <label>כמות:</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={onQuantityChange}
                        required
                        style={inputStyle}
                    />

                    <label>הערה לפרסום (חיצונית):</label>
                    <input
                        type="text"
                        value={publicComment}
                        onChange={onPublicCommentChange}
                        style={inputStyle}
                    />

                    <label>הערה פנימית:</label>
                    <input
                        type="text"
                        value={internalComment}
                        onChange={onInternalCommentChange}
                        style={inputStyle}
                    />

                    <label>תמונה (או כתובת URL):</label>
                    <input
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
                    />

                    {(imageUrl || imageFile) && (
                        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            <img
                                src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                                alt="preview"
                                style={{
                                    maxHeight: '150px',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button type="submit" style={submitBtnStyle}>
                            {editingItem ? 'שמור שינויים' : 'הוסף מוצר'}
                        </button>
                        <button type="button" onClick={onCancel} style={cancelBtnStyle}>
                            ביטול
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc'
};

const submitBtnStyle = {
    padding: '10px 16px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '45%'
};

const cancelBtnStyle = {
    padding: '10px 16px',
    backgroundColor: '#aaa',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '45%'
};

export default ItemFormModal;

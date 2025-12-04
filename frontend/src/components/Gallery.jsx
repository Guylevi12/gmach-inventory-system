import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { useUser } from '@/UserContext';
import { Upload, Image as ImageIcon, Trash2, FolderPlus, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './Gallery.css';

const uploadToCloudinary = async (file) => {
  const url = 'https://api.cloudinary.com/v1_1/dcydl9rz8/image/upload';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'GmachMedia');

  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.secure_url;
};

// AlbumCard: simple and reliable filmstrip slider
const AlbumCard = ({ album, onClick, onDelete, isMainAdmin }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = useMemo(() => album.images || [], [album.images]);

  // Auto-advance slider every 4 seconds
  useEffect(() => {
    if (!images.length || images.length === 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="album-card" onClick={onClick}>
      <div className="filmstrip-container">
        {images.length > 0 ? (
          <>
            {images.map((img, idx) => {
              let positionClass = '';
              if (idx === currentIndex) {
                positionClass = 'active';
              } else if (idx < currentIndex) {
                positionClass = 'prev';
              } else {
                positionClass = 'next';
              }

              return (
                <div
                  key={`${img.id}-${idx}`}
                  className={`filmstrip-image ${positionClass}`}
                >
                  <img src={img.url} alt="" />
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            <ImageIcon size={60} />
          </div>
        )}
      </div>

      <div className="album-card-info">
        <h3>{album.name}</h3>
        <span className="album-card-image-count">{images.length} תמונות</span>
      </div>

      {isMainAdmin && (
        <button onClick={onDelete} className="btn-delete-album">
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};


const Gallery = () => {
  const { user } = useUser();
  const isMainAdmin = user?.role === 'MainAdmin';

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumFiles, setNewAlbumFiles] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'galleryAlbums'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAlbums(data);
      setLoading(false);
    }, (err) => {
      console.error('Error loading gallery albums:', err);
      setError('אירעה שגיאה בטעינת הגלריה');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of newAlbumFiles) {
        const url = await uploadToCloudinary(file);
        uploaded.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          url,
          uploadedAt: Date.now(),
          uploadedBy: user?.username || user?.email || 'Admin'
        });
      }
      const coverUrl = uploaded[0]?.url || null; // Not used in new design, but kept for data structure

      await addDoc(collection(db, 'galleryAlbums'), {
        name: newAlbumName.trim(),
        createdAt: new Date(),
        createdBy: user?.uid || 'anonymous',
        createdByName: user?.username || user?.email || 'Admin',
        coverImage: coverUrl,
        images: uploaded
      });
      setNewAlbumName('');
      setNewAlbumFiles([]);
    } catch (e) {
      console.error('Error creating album:', e);
      setError('יצירת אלבום נכשלה, נסה שוב');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadImages = async (albumId, files) => {
    if (!files?.length || !selectedAlbum) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        uploaded.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          url,
          uploadedAt: Date.now(),
          uploadedBy: user?.username || user?.email || 'Admin'
        });
      }
      const updatedImages = [...(selectedAlbum.images || []), ...uploaded];
      await updateDoc(doc(db, 'galleryAlbums', albumId), {
        images: updatedImages,
        coverImage: selectedAlbum.coverImage || uploaded[0]?.url || null
      });
      // Refresh selected album
      setSelectedAlbum(prev => ({ ...prev, images: updatedImages }));
    } catch (e) {
      console.error('Error uploading images:', e);
      setError('העלאת תמונות נכשלה, נסה שוב');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (e, albumId, imageId) => {
    e.stopPropagation();
    if (!selectedAlbum) return;
    const updatedImages = (selectedAlbum.images || []).filter(img => img.id !== imageId);
    const removedImage = selectedAlbum.images.find(img => img.id === imageId);
    const newCover = removedImage && selectedAlbum.coverImage === removedImage.url
      ? (updatedImages[0]?.url || null)
      : selectedAlbum.coverImage;
    try {
      await updateDoc(doc(db, 'galleryAlbums', albumId), {
        images: updatedImages,
        coverImage: newCover
      });
      // Refresh selected album
      setSelectedAlbum(prev => ({ ...prev, images: updatedImages }));
    } catch (e) {
      console.error('Error deleting image:', e);
      setError('מחיקת תמונה נכשלה');
    }
  };

  const handleDeleteAlbum = async (e, albumId) => {
    e.stopPropagation();
    if (!window.confirm('למחוק אלבום זה וכל התמונות בו?')) return;
    try {
      await deleteDoc(doc(db, 'galleryAlbums', albumId));
      if (selectedAlbum?.id === albumId) {
        setIsAlbumModalOpen(false);
        setSelectedAlbum(null);
      }
    } catch (e) {
      console.error('Error deleting album:', e);
      setError('מחיקת אלבום נכשלה');
    }
  };

  const handleOpenAlbum = (album) => {
    setSelectedAlbum(album);
    setIsAlbumModalOpen(true);
  };

  const handleCloseAlbum = () => {
    setIsAlbumModalOpen(false);
    setSelectedAlbum(null);
  };

  const handleOpenLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => setIsLightboxOpen(false);

  const handleNextImage = useCallback(() => {
    if (isLightboxOpen && selectedAlbum) {
      setSelectedImageIndex((prev) => (prev + 1) % selectedAlbum.images.length);
    }
  }, [isLightboxOpen, selectedAlbum]);

  const handlePrevImage = useCallback(() => {
    if (isLightboxOpen && selectedAlbum) {
      setSelectedImageIndex((prev) => (prev - 1 + selectedAlbum.images.length) % selectedAlbum.images.length);
    }
  }, [isLightboxOpen, selectedAlbum]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') {
        handleCloseLightbox();
        handleCloseAlbum();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextImage, handlePrevImage]);

  return (
    <div className="gallery-page" dir="rtl">
      <div className="gallery-inner">
        <div className="gallery-header">
          <h1>גלריה</h1>
        </div>

        {error && (
          <div className="error-text">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {isMainAdmin && (
          <div className="admin-form">
            <div>
              <label>שם אלבום חדש</label>
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="לדוגמה: אירועי קיץ 2024"
              />
            </div>
            <div>
              <label>תמונות לאלבום</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewAlbumFiles(Array.from(e.target.files || []))}
              />
            </div>
            <button
              onClick={handleCreateAlbum}
              disabled={creating || !newAlbumName.trim()}
              className="btn-create-album"
            >
              {creating ? 'יוצר...' : (<><FolderPlus size={18} /> צור אלבום</>)}
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-text">טוען גלריה...</div>
        ) : (
          <div className="albums-grid">
            {albums.map(album => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => handleOpenAlbum(album)}
                onDelete={(e) => handleDeleteAlbum(e, album.id)}
                isMainAdmin={isMainAdmin}
              />
            ))}
          </div>
        )}

        {isAlbumModalOpen && selectedAlbum && (
          <div className="modal-backdrop" onClick={handleCloseAlbum}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedAlbum.name}</h2>
                {isMainAdmin && (
                  <label className="btn-upload">
                    <Upload size={18} />
                    {uploading ? 'מעלה...' : 'הוסף תמונות'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleUploadImages(selectedAlbum.id, Array.from(e.target.files || []))}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </label>
                )}
                <button onClick={handleCloseAlbum} className="btn-close-modal"><X size={24} /></button>
              </div>
              <div className="modal-body">
                {(selectedAlbum.images || []).length > 0 ? (
                  <div className="modal-gallery-layout">
                    <div className="modal-main-image-container" onClick={() => handleOpenLightbox(selectedImageIndex)}>
                      <img
                        src={selectedAlbum.images[selectedImageIndex]?.url}
                        alt={`Selected ${selectedImageIndex + 1}`}
                        className="modal-main-image"
                      />
                    </div>
                    <div className="thumbnail-strip">
                      {selectedAlbum.images.map((img, idx) => (
                        <div
                          key={img.id}
                          className={`thumbnail-item ${idx === selectedImageIndex ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(idx)}
                        >
                          <img src={img.url} alt={`Thumbnail ${idx + 1}`} />
                          {isMainAdmin && (
                            <button
                              className="btn-delete-thumbnail"
                              onClick={(e) => handleDeleteImage(e, selectedAlbum.id, img.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="loading-text">אין תמונות באלבום זה עדיין.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {isLightboxOpen && selectedAlbum && (
          <div className="lightbox" onClick={handleCloseLightbox}>
            <button className="btn-lightbox-close" onClick={handleCloseLightbox}><X size={24} /></button>
            <button className="btn-lightbox-prev" onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}><ChevronLeft size={32} /></button>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={selectedAlbum.images[selectedImageIndex].url} alt={`תמונה ${selectedImageIndex + 1}`} className="lightbox-image" />
            </div>
            <button className="btn-lightbox-next" onClick={(e) => { e.stopPropagation(); handleNextImage(); }}><ChevronRight size={32} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;

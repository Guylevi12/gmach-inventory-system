import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    codeReader.decodeFromVideoDevice(null, videoRef.current, (result) => {
      if (result) {
        codeReader.reset();
        onScanSuccess(result.getText()); // ← יפעיל את ההוספה וגם יסגור את הסורק
      }
    });

    return () => {
      try {
        codeReader.reset();
      } catch (_) { }
    };
  }, [onScanSuccess]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000000e6',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <video
        ref={videoRef}
        style={{
          width: '90%',
          maxWidth: '500px',
          borderRadius: '12px',
          border: '3px solid white'
        }}
        muted
        autoPlay
        playsInline
      />
      <button
        onClick={() => {
          codeReaderRef.current?.reset();
          onClose();
        }}
        style={{
          marginTop: '1rem',
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        סגור סורק
      </button>
    </div>
  );
};

export default BarcodeScanner;

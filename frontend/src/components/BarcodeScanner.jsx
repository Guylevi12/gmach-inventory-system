import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const config = { fps: 10, qrbox: 250 };
    const html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;
        html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            html5QrCode.stop().then(() => {
              onScanSuccess(decodedText);
            });
          },
          (errorMessage) => {
            // Optional: console.log('Scanning error', errorMessage);
          }
        );
      }
    });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div id="reader" style={{ width: '100%' }} />
      <button onClick={onClose} style={{ marginTop: '1rem' }}>סגור סורק</button>
    </div>
  );
};

export default BarcodeScanner;

// ImagePicker.js
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './ImagePicker.css';

function ImagePicker() {
  const onDrop = useCallback((acceptedFiles) => {
    // Process the selected files (e.g., show a preview or upload them)
    console.log('Selected files:', acceptedFiles);
  }, []);

  // Configure react-dropzone:
  // - noClick disables the built-in click behavior on the drop area.
  // - noDrag disables drag-and-drop functionality.
  const { getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noDrag: true,
    accept: 'image/*', // Accept images only
  });

  return (
    <div>
      {/* Custom button that triggers the file dialog */}
      <button id='btnImage' type="button" onClick={open}>
        Upload Team Logo
      </button>
      
      {/* Hidden file input; dropzone is used behind the scenes for file handling */}
      <input {...getInputProps()} style={{ display: 'none' }} />
    </div>
  );
}

export default ImagePicker;

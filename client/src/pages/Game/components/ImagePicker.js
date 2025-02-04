import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function ImagePicker({ setSelectedFile, setFilePreview }) {
  const onDrop = useCallback((acceptedFiles) => {
    console.log("File Dropped:", acceptedFiles);

    if (acceptedFiles.length === 0) {
      console.warn("No valid files received.");
      return;
    }

    const file = acceptedFiles[0];

    if (!file || !file.type.startsWith("image/")) {
      console.warn(`Invalid file type: ${file?.type}`);
      return;
    }

    setSelectedFile(file);

    console.log('here');
    console.log(file.type);

    // If image is of a svg type, convert it to a png
    if (file.type === "image/svg+xml") {
        console.log("SVG detected, converting to PNG...");

        const reader = new FileReader();
        reader.readAsText(file);    // Read the SVG file as text
        reader.onloadend = () => {
            const svgText = reader.result;

            // Create an off-screen canvas to render the SVG
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const img = new Image();
            const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
            const svgUrl = URL.createObjectURL(svgBlob);

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Convert the canvas to a PNG Base64 string
                const pngDataUrl = canvas.toDataURL("image/png");
                setFilePreview(pngDataUrl);
                console.log("Converted PNG: ", pngDataUrl);
            };

            img.src = svgUrl;
        };
        reader.onerror = (error) => console.error("Error converting SVG:", error);
    } else {
        // Handle PNG/JPG normally (Convert to Base64)
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setFilePreview(reader.result);  // Base64 format
            console.log("Base64 Preview:", reader.result);  // Debugging
        };
    }
  }, [setSelectedFile, setFilePreview]);

  const { getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noDrag: true,
    accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.svg'],
    },
    onError: (err) => console.warn("Dropzone error:", err),
  });

  return (
    <div>
      <button type="button" onClick={open}>Select an Image</button>
      <input {...getInputProps()} style={{ display: 'none' }} />
    </div>
  );
}

export default ImagePicker;

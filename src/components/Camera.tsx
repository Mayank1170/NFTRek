import React, { useRef, ChangeEvent } from 'react';
import Webcam from "react-webcam";

interface CameraProps {
  isMobile: boolean;
  isCameraOpen: boolean;
  onCapture: (imageSrc: string) => void;
}

const Camera: React.FC<CameraProps> = ({ isMobile, isCameraOpen, onCapture }) => {
  const webRef = useRef<Webcam>(null);

  const handleMobileCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          onCapture(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebCapture = () => {
    if (webRef.current) {
      const screenshot = webRef.current.getScreenshot();
      if (screenshot) {
        onCapture(screenshot);
      } else {
        alert("Failed to capture image.");
      }
    }
  };

  if (!isCameraOpen) return null;

  return (
    <div className="mb-8">
      {isMobile ? (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleMobileCapture}
          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      ) : (
        <>
          <Webcam
            ref={webRef}
            className="w-full rounded-lg"
          />
          <div className="text-center mt-4">
            <button
              onClick={handleWebCapture}
              className="px-6 py-3 bg-green-500 rounded-full text-white font-semibold hover:bg-green-600 transition duration-300"
            >
              Capture Image
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Camera;
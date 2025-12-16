
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from '../utils/cropUtils';
import getCroppedImg from '../utils/cropUtils';

interface ImageCropperProps {
  file: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ file, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  // Convert File to object URL for the cropper
  const [imageSrc] = useState<string>(URL.createObjectURL(file));

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (croppedAreaPixels && imageSrc) {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, file.name);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    }
  };

  // Cleanup object URL on unmount
  React.useEffect(() => {
      return () => {
          URL.revokeObjectURL(imageSrc);
      }
  }, [imageSrc]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-lg text-gray-800">Crop Image</h3>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div className="relative flex-grow bg-black">
             <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3} // Default aspect ratio for photos, can be changed
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteHandler}
            />
        </div>

        <div className="p-4 bg-gray-50 border-t">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => {
                        setZoom(Number(e.target.value))
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <div className="flex justify-end space-x-3">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                    Crop & Save
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;

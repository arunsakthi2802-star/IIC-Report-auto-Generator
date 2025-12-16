
import React, { useState } from 'react';
import ImageCropper from './ImageCropper';

interface FileUploadProps {
  id: string;
  label: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept: string;
  multiple?: boolean;
  files: File[];
  // Callback to update a specific file after cropping
  onFileUpdate?: (index: number, newFile: File) => void;
  // Callback to remove a file
  onRemove?: (index: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ id, label, onFileChange, accept, multiple = false, files, onFileUpdate, onRemove }) => {
  const [fileToCrop, setFileToCrop] = useState<{ file: File, index: number } | null>(null);

  const previewUrls = React.useMemo(() => 
    files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    }), [files]);

  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]); // Re-run when files array changes (including after cropping)

  const handleEditClick = (file: File, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setFileToCrop({ file, index });
  };
  
  const handleRemoveClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (onRemove) {
        onRemove(index);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    if (fileToCrop && onFileUpdate) {
        onFileUpdate(fileToCrop.index, croppedFile);
    }
    setFileToCrop(null);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label} <span className="text-red-500">*</span></label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md relative hover:bg-slate-50 transition-colors">
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-slate-600 justify-center">
            <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>Upload file(s)</span>
              <input id={id} name={id} type="file" className="sr-only" onChange={onFileChange} accept={accept} multiple={multiple} />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">{accept.replace(/,/g, ', ')}</p>
          {multiple && <p className="text-xs text-indigo-500 font-medium">(Hold Ctrl/Cmd to select multiple files)</p>}
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative aspect-square group border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              {/* Remove Button */}
              {onRemove && (
                  <button 
                    onClick={(e) => handleRemoveClick(index, e)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-all z-20 opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
              )}

              {previewUrls[index] ? (
                <>
                  <img src={previewUrls[index]} alt={`preview ${index}`} className="w-full h-full object-contain" />
                  
                  {/* Always visible edit button on mobile, or bottom bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-black bg-opacity-60 p-2 flex justify-center">
                      <button 
                        onClick={(e) => handleEditClick(file, index, e)}
                        className="text-white text-xs font-bold flex items-center hover:text-blue-300"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                         </svg>
                         Crop / Edit
                      </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 relative">
                   <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   <span className="text-xs text-slate-500 text-center break-all">{file.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {fileToCrop && (
          <ImageCropper 
            file={fileToCrop.file}
            onCancel={() => setFileToCrop(null)}
            onCropComplete={handleCropComplete}
          />
      )}
    </div>
  );
};

export default FileUpload;

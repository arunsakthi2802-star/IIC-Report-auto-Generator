import React, { useState, useEffect } from 'react';
import type { ReportData, FileUploads } from '../types';

interface ReportPreviewProps {
  data: ReportData;
  files: FileUploads;
  reportRef: React.RefObject<HTMLDivElement>;
}

// Internal component to handle async base64 conversion for stability
const SafeImage: React.FC<{ file: File; alt: string; className?: string }> = ({ file, alt, className }) => {
    const [base64, setBase64] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (active && e.target?.result) {
                setBase64(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
        return () => { active = false; };
    }, [file]);

    if (!base64) return <div className={`bg-gray-100 animate-pulse ${className}`} style={{ minHeight: '100px' }} />;
    
    return <img src={base64} alt={alt} className={className} />;
};

// A dedicated Page component that mimics A4 paper dimensions
const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div 
            className="report-page bg-white shadow-xl relative" 
            style={{ 
                width: '210mm', 
                height: '297mm', 
                padding: '15mm', // Moderate padding
                fontFamily: '"Times New Roman", Times, serif',
                boxSizing: 'border-box',
                overflow: 'hidden', // Prevent spillover
                color: 'black'
            }}
        >
            {children}
        </div>
    );
};

// Helper to chunk arrays for pagination
// Moved outside component to avoid TSX generic arrow function parsing issues
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ data, files, reportRef }) => {
  const isImage = (file: File) => file.type.startsWith('image/');
  
  // Base64 placeholder for logo if none uploaded
  const DEFAULT_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAACXBIWXMAAAsTAAALEwEAmpwYAAABmElEQVR4nO3bwU0DQRREQf03QA+kCApB0A8pA6QO7W89lq2h55XwZ1bWy4+Z/b33+8/x+Hk8d7j3/uF4/DqeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO9x7/+F4/DyeO5z9A0aWw2Wj2y8PAAAAAElFTkSuQmCC";

  // Formatter for date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  }

  const cellStyle = "border border-black px-2 py-1 align-top text-sm leading-tight";

  // Helper to render text with paragraph indentation
  const renderContent = (text: string | undefined, placeholder: string) => {
    if (!text || !text.trim()) return placeholder;
    
    // Split text by newlines to identify paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    
    if (paragraphs.length === 0) return placeholder;

    return paragraphs.map((para, index) => (
      <p key={index} style={{ textIndent: '3em', marginBottom: '0.25em' }}>
        {para.trim()}
      </p>
    ));
  };

  const photoChunks = chunkArray<File>(files.photos, 4); // 4 photos per page

  return (
    <div ref={reportRef} className="flex flex-col gap-8">
      
      {/* ----------------- PAGE 1: HEADER & CONTENT ----------------- */}
      <Page>
        {/* IIC Banner Strip */}
        <div className="w-full mb-2 h-16 flex items-center justify-center border-b border-gray-200 overflow-hidden">
            {files.headerBanner ? (
                <SafeImage file={files.headerBanner} alt="Header Banner" className="h-full w-full object-contain" />
            ) : (
                <div className="text-gray-400 text-xs italic">
                    [Upload 'IIC Top Banner' to display MoE/AICTE logos here]
                </div>
            )}
        </div>

        {/* College Header */}
        <div className="flex items-center justify-center mb-4 relative px-4">
            <div className="mr-3 flex-shrink-0">
                 {files.collegeLogo ? (
                    <SafeImage file={files.collegeLogo} alt="College Logo" className="h-20 w-20 object-contain" />
                 ) : (
                    <img src={DEFAULT_LOGO} alt="Default Logo" className="h-20 w-20 object-contain" />
                 )}
            </div>
            <div className="text-center">
                <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-tight leading-tight">{data.collegeName}</h1>
                <h2 className="text-xs font-bold text-red-600 uppercase mt-1">(Autonomous)</h2>
                <p className="text-[10px] font-bold text-blue-800 mt-1 max-w-lg mx-auto leading-tight">
                    (Recognized under section 2(f) & 12(B) of UGC Act 1956 and Accredited by NAAC with "A" Grade)
                </p>
                <p className="text-xs font-bold text-blue-900 mt-1">{data.collegeAddress}</p>
            </div>
        </div>

        <h3 className="text-lg font-bold border-b-2 border-black mb-0">REPORT</h3>

        {/* Grid Table */}
        <div className="w-full border-l border-t border-black mb-4 text-xs">
            <div className="flex w-full">
                <div className={`${cellStyle} w-[15%] font-bold`}>Date</div>
                <div className={`${cellStyle} w-[30%] font-bold`}>Resource Person</div>
                <div className={`${cellStyle} w-[30%] font-bold`}>Department</div>
                <div className={`${cellStyle} w-[25%] font-bold`}>Coordinator</div>
            </div>
            <div className="flex w-full">
                <div className={`${cellStyle} w-[15%] h-16`}>{formatDate(data.date)}</div>
                <div className={`${cellStyle} w-[30%] h-16`}>
                    <p className="font-bold">{data.resourcePersonName}</p>
                    <p>{data.resourcePersonDetails}</p>
                </div>
                <div className={`${cellStyle} w-[30%] h-16 uppercase`}>{data.department}</div>
                <div className={`${cellStyle} w-[25%] h-16 uppercase`}>{data.coordinatorName}</div>
            </div>
            <div className="flex w-full">
                <div className={`${cellStyle} w-[15%] font-bold`}>Duration</div>
                <div className={`${cellStyle} w-[30%] font-bold`}>Venue</div>
                <div className={`${cellStyle} w-[30%] font-bold`}>Participants</div>
                <div className={`${cellStyle} w-[25%] font-bold`}>Title of the Activity</div>
            </div>
            <div className="flex w-full border-b border-black">
                <div className={`${cellStyle} w-[15%] h-16`}>
                    {data.startTime} TO <br/> {data.endTime}
                </div>
                <div className={`${cellStyle} w-[30%] h-16 uppercase`}>{data.venue}</div>
                <div className={`${cellStyle} w-[30%] h-16 flex items-center justify-center text-base`}>{data.participants}</div>
                <div className={`${cellStyle} w-[25%] h-16 uppercase font-bold`}>{data.eventTitle}</div>
            </div>
        </div>

        {/* Text Sections */}
        <div className="w-full border border-black text-xs">
            <div className="flex border-b border-black bg-gray-50">
                <div className="w-1/2 p-2 border-r border-black font-bold">Quarter :</div>
                <div className="w-1/2 p-2 font-bold">Academic Year :{data.academicYear}</div>
            </div>
            <div className="flex border-b border-black">
                <div className="w-[20%] p-2 border-r border-black font-bold flex items-center">
                    Brief Info (250 Words)
                </div>
                <div className="w-[80%] p-2 text-justify leading-relaxed">
                    {renderContent(data.briefInfo, 'No information provided.')}
                </div>
            </div>
            <div className="flex border-b border-black">
                <div className="w-[20%] p-2 border-r border-black font-bold flex items-center">
                    Objectives (100 Words)
                </div>
                <div className="w-[80%] p-2 text-justify leading-relaxed">
                    {renderContent(data.objectives, 'No objectives provided.')}
                </div>
            </div>
            <div className={`flex ${data.showExpenditure ? 'border-b border-black' : ''}`}>
                <div className="w-[20%] p-2 border-r border-black font-bold flex items-center">
                    Benefits (150 Words)
                </div>
                <div className="w-[80%] p-2 text-justify leading-relaxed">
                    {renderContent(data.benefits, 'No benefits provided.')}
                </div>
            </div>
            
            {data.showExpenditure && (
                <div className="flex">
                    <div className="w-[20%] p-2 border-r border-black font-bold flex items-center">
                        Expenditure Amount
                    </div>
                    <div className="w-[80%] p-2 font-bold">
                        {data.expenditure}/-
                    </div>
                </div>
            )}
        </div>
      </Page>

      {/* ----------------- PAGE 2+: PHOTOS ----------------- */}
      {photoChunks.map((chunk, pageIndex) => (
          <Page key={`photos-page-${pageIndex}`}>
              <h4 className="font-bold text-xl mb-6 text-center border-b border-black pb-2">
                Event Photos {photoChunks.length > 1 ? `(Page ${pageIndex + 1})` : ''}
              </h4>
              <div className="grid grid-cols-2 gap-4 h-[85%]">
                  {chunk.map((file, photoIndex) => {
                      // Calculate global index for labels like "Photo - 1", "Photo - 2"
                      const globalIndex = pageIndex * 4 + photoIndex + 1;
                      return (
                        <div key={photoIndex} className="flex flex-col border border-gray-300 p-2 h-full">
                            <div className="font-bold mb-2 text-sm bg-gray-100 p-1 text-center">Photo - {globalIndex}</div>
                            <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-50">
                                {isImage(file) && (
                                    <SafeImage file={file} alt={`Event Photo ${globalIndex}`} className="max-w-full max-h-full object-contain" />
                                )}
                            </div>
                        </div>
                      );
                  })}
                  {/* Fill empty spots if less than 4 photos on a page */}
                  {chunk.length < 4 && Array.from({ length: 4 - chunk.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="border border-gray-100 p-2 h-full bg-gray-50/30"></div>
                  ))}
              </div>
          </Page>
      ))}

      {/* ----------------- INVITATION PAGE ----------------- */}
      {files.invitation && (
        <Page>
            <h4 className="font-bold text-xl mb-4 border-b border-black inline-block">Invitation – Scanned Copy</h4>
            <div className="border border-black p-2 h-[90%] flex items-center justify-center">
                 {isImage(files.invitation) ? (
                    <SafeImage file={files.invitation} alt="Invitation" className="max-w-full max-h-full object-contain" />
                 ) : (
                    <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-400">PDF File Attached Separately</div>
                 )}
            </div>
        </Page>
      )}
      
      {/* ----------------- ATTENDANCE PAGE(S) ----------------- */}
      {files.attendance.length > 0 && files.attendance.map((file, index) => (
        <Page key={`attendance-${index}`}>
            <h4 className="font-bold text-xl mb-4 border-b border-black inline-block">Attendance Sheet {files.attendance.length > 1 ? `(${index + 1})` : ''}</h4>
            <div className="border border-black p-2 h-[90%] flex items-center justify-center">
                {isImage(file) ? (
                        <SafeImage file={file} alt={`Attendance ${index + 1}`} className="max-w-full max-h-full object-contain" />
                ) : (
                        <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-400">PDF File Attached Separately</div>
                )}
            </div>
        </Page>
      ))}
    </div>
  );
};

export default ReportPreview;
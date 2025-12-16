
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import type { ReportData, FileUploads, AIGeneratedContent } from './types';
import FormField from './components/FormField';
import FileUpload from './components/FileUpload';
import ReportPreview from './components/ReportPreview';
import { generateEventContent } from './services/geminiService';

const App: React.FC = () => {
    const initialState: ReportData = {
        collegeName: '',
        collegeAddress: '',
        eventTitle: '',
        date: '',
        startTime: '',
        endTime: '',
        department: '',
        academicYear: '',
        venue: '',
        participants: '',
        resourcePersonName: '',
        resourcePersonDetails: '',
        coordinatorName: '',
        briefInfo: '',
        objectives: '',
        benefits: '',
        expenditure: '',
        showExpenditure: true,
    };

    const initialFiles: FileUploads = {
        headerBanner: null,
        collegeLogo: null,
        invitation: null,
        photos: [],
        attendance: [],
    };

    const [formData, setFormData] = useState<ReportData>(initialState);
    const [files, setFiles] = useState<FileUploads>(initialFiles);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [aiTone, setAiTone] = useState<string>('Professional');
    const reportRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Matrix Rain Effect for Footer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        const columns = Math.floor(width / 20);
        const drops: number[] = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100; // Start at random heights above canvas
        }

        const characters = '01@#$API{}<>/?%=+*';
        const charArray = characters.split('');

        const draw = () => {
            // Semi-transparent black to create trail effect
            ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'; 
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#0F0'; // Matrix Green
            ctx.font = '14px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                const x = i * 20;
                const y = drops[i] * 20;
                
                // Draw the character
                // Varying opacity for depth
                ctx.fillStyle = `rgba(0, 255, 70, ${Math.random() > 0.5 ? 1 : 0.5})`;
                ctx.fillText(text, x, y);

                if (y > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
             if (canvas) {
                width = canvas.width = canvas.offsetWidth;
                height = canvas.height = canvas.offsetHeight;
             }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const isFormValid = useMemo(() => {
        return (
            Object.values(formData).every(value => {
                if (typeof value === 'boolean') return true; // Skip boolean checks
                return value !== '' && value !== 0;
            }) &&
            files.photos.length > 0
        );
    }, [formData, files]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number') ? (value === '' ? '' : parseFloat(value)) : value,
        }));
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: selectedFiles } = e.target;
        if (!selectedFiles || selectedFiles.length === 0) return;
        
        const newFiles = Array.from(selectedFiles);

        setFiles(prev => {
            const currentVal = prev[name as keyof FileUploads];
            if (Array.isArray(currentVal)) {
                 return { ...prev, [name]: [...currentVal, ...newFiles] };
            }
            return { ...prev, [name]: newFiles[0] };
        });
        // Reset input so the same file can be selected again or new files can be added cleanly
        e.target.value = '';
    }, []);

    const handleFileUpdate = useCallback((section: keyof FileUploads, index: number, newFile: File) => {
        setFiles(prev => {
            const currentSection = prev[section];
            if (Array.isArray(currentSection)) {
                const newArray = [...currentSection];
                newArray[index] = newFile;
                return { ...prev, [section]: newArray };
            } else {
                return { ...prev, [section]: newFile };
            }
        });
    }, []);

    const handleRemoveFile = useCallback((section: keyof FileUploads, index: number) => {
        setFiles(prev => {
            const currentSection = prev[section];
            if (Array.isArray(currentSection)) {
                const newArray = [...currentSection];
                newArray.splice(index, 1);
                return { ...prev, [section]: newArray };
            } else {
                return { ...prev, [section]: null };
            }
        });
    }, []);
    
    const handleGenerateContent = async () => {
        const { eventTitle, department, resourcePersonName } = formData;
        if (!eventTitle || !department || !resourcePersonName) {
            alert('Please fill in Event Title, Department, and Resource Person Name to generate content.');
            return;
        }
        setIsGenerating(true);
        const content: AIGeneratedContent | null = await generateEventContent(eventTitle, department, resourcePersonName, aiTone);
        if (content) {
            setFormData(prev => ({
                ...prev,
                briefInfo: content.brief,
                objectives: content.objectives,
                benefits: content.benefits
            }));
        }
        setIsGenerating(false);
    };

    const handlePreview = () => {
        if (!isFormValid) {
            alert('Please fill all required fields and upload required photos.');
            return;
        }
        setShowPreview(true);
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsDownloading(true);

        try {
            const pageElements = reportRef.current.querySelectorAll('.report-page');
            if (pageElements.length === 0) {
                throw new Error("No pages found to generate PDF");
            }

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Process each page individually
            for (let i = 0; i < pageElements.length; i++) {
                const page = pageElements[i] as HTMLElement;
                
                // Add new page for subsequent elements
                if (i > 0) {
                    pdf.addPage();
                }

                // Convert specific page div to image
                const dataUrl = await toPng(page, { 
                    quality: 0.95, 
                    pixelRatio: 2, // High resolution
                    cacheBust: true, 
                    skipFonts: true, 
                    backgroundColor: '#ffffff',
                    width: 794, // Approx pixels for 210mm at 96dpi
                    height: 1123 // Approx pixels for 297mm at 96dpi
                });

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
            
            pdf.save('IIC-Event-Report.pdf');
            setIsDownloading(false);

        } catch (error) {
            console.error('Error generating PDF:', error);
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                errorMessage = (error as any).message || 'Network Error or Image Loading Error.';
            } else {
                errorMessage = String(error);
            }
            alert(`An error occurred while generating the PDF: ${errorMessage}`);
            setIsDownloading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-slate-800">IIC Event Report Generator</h1>
                    <p className="text-slate-600">Fill the form below to automatically generate a formatted event report.</p>
                </div>
            </header>
            
            <main className="container mx-auto px-4 py-8 flex-grow">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    {/* Institution Details */}
                    <h2 className="text-xl font-semibold border-b pb-4 mb-6 text-slate-700">Institution Details</h2>
                    <div className="grid md:grid-cols-2 gap-x-8 mb-4">
                        <FormField id="collegeName" label="College Name" value={formData.collegeName} onChange={handleChange} placeholder="AVS COLLEGE OF ARTS AND SCIENCE (AUTONOMOUS)" />
                         <FormField id="collegeAddress" label="College Address" value={formData.collegeAddress} onChange={handleChange} placeholder="Attur Main Road , Salem - 636106" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-x-8">
                         <FileUpload 
                            id="headerBanner" 
                            label="IIC Top Banner Image (Optional)" 
                            onFileChange={handleFileChange} 
                            accept=".jpg,.png" 
                            files={files.headerBanner ? [files.headerBanner] : []}
                            onFileUpdate={(idx, file) => handleFileUpdate('headerBanner', idx, file)}
                            onRemove={(idx) => handleRemoveFile('headerBanner', idx)}
                        />
                         <FileUpload 
                            id="collegeLogo" 
                            label="College Logo" 
                            onFileChange={handleFileChange} 
                            accept=".jpg,.png" 
                            files={files.collegeLogo ? [files.collegeLogo] : []} 
                            onFileUpdate={(idx, file) => handleFileUpdate('collegeLogo', idx, file)}
                            onRemove={(idx) => handleRemoveFile('collegeLogo', idx)}
                        />
                    </div>

                    {/* Event Details */}
                    <h2 className="text-xl font-semibold border-b pb-4 mb-6 mt-8 text-slate-700">Event Details</h2>
                    <div className="grid md:grid-cols-2 gap-x-8">
                        <FormField id="eventTitle" label="Title of the Activity" value={formData.eventTitle} onChange={handleChange} placeholder="e.g., Workshop on AI" />
                        <FormField id="date" label="Date" type="date" value={formData.date} onChange={handleChange} />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField id="startTime" label="Start Time" type="time" value={formData.startTime} onChange={handleChange} />
                           <FormField id="endTime" label="End Time" type="time" value={formData.endTime} onChange={handleChange} />
                        </div>
                        <FormField id="department" label="Department" value={formData.department} onChange={handleChange} placeholder="e.g., Department of Information Technology" />
                        <FormField id="academicYear" label="Academic Year" value={formData.academicYear} onChange={handleChange} placeholder="e.g., 2024-2025" />
                        <FormField id="venue" label="Venue" value={formData.venue} onChange={handleChange} placeholder="e.g., Seminar Hall" />
                        <FormField id="participants" label="Number of Participants" type="number" value={formData.participants} onChange={handleChange} placeholder="e.g., 50" />
                    </div>

                    {/* Personnel Section - Merged Headers */}
                    <div className="grid md:grid-cols-2 gap-x-8 mt-4">
                        <FormField id="resourcePersonName" label="Resource Person Name" value={formData.resourcePersonName} onChange={handleChange} placeholder="e.g., Mr. G. Selvakumar" />
                        <FormField id="resourcePersonDetails" label="Resource Person Details" value={formData.resourcePersonDetails} onChange={handleChange} placeholder="e.g., CEO, Tech Corp" />
                        <FormField id="coordinatorName" label="Coordinator Name" value={formData.coordinatorName} onChange={handleChange} placeholder="e.g., Ms. J Gunavathi" />
                    </div>

                    <h2 className="text-xl font-semibold border-b pb-4 mb-6 mt-8 text-slate-700">Content Section</h2>
                    
                    {/* AI Assistant Panel */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6 mb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg> 
                                    AI Content Assistant
                                </h3>
                                <p className="text-sm text-purple-700 mt-1">
                                    Automatically generate professional report content based on <strong>Event Title</strong>, <strong>Department</strong>, and <strong>Resource Person</strong> details.
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto bg-white p-2 rounded-lg shadow-sm border border-purple-100">
                                <div className="flex flex-col justify-center">
                                    <select 
                                        value={aiTone}
                                        onChange={(e) => setAiTone(e.target.value)}
                                        className="block w-full rounded-md border-gray-200 py-2 pl-3 pr-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 bg-gray-50 hover:bg-white transition-colors"
                                        title="Select Writing Tone"
                                    >
                                        <option value="Professional">Professional Tone</option>
                                        <option value="Academic">Academic Tone</option>
                                        <option value="Enthusiastic">Enthusiastic Tone</option>
                                        <option value="Concise">Concise Tone</option>
                                    </select>
                                </div>
                                
                                <button 
                                    onClick={handleGenerateContent} 
                                    disabled={isGenerating || !formData.eventTitle} 
                                    className={`
                                        inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all
                                        ${isGenerating || !formData.eventTitle
                                            ? 'bg-purple-300 cursor-not-allowed' 
                                            : 'bg-purple-600 hover:bg-purple-700 hover:shadow-md'
                                        }
                                    `}
                                    title={!formData.eventTitle ? "Please enter an Event Title first" : "Generate Content"}
                                >
                                    {isGenerating ? (
                                        <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Generating...
                                        </>
                                    ) : (
                                        <>
                                        <svg className="mr-2 -ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                                        </svg>
                                        Auto-Generate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FormField id="briefInfo" label="Brief Information about the Activity (250 words)" type="textarea" value={formData.briefInfo} onChange={handleChange} rows={8} placeholder="Enter a brief summary of the event... (AI can generate this)" />
                        <FormField id="objectives" label="Objectives of the Activity (100 words)" type="textarea" value={formData.objectives} onChange={handleChange} rows={5} placeholder="List the key objectives... (AI can generate this)" />
                        <FormField id="benefits" label="Benefits of the Activity (150 words)" type="textarea" value={formData.benefits} onChange={handleChange} rows={6} placeholder="Describe the benefits to students... (AI can generate this)" />
                    </div>

                    <h2 className="text-xl font-semibold border-b pb-4 mb-6 mt-8 text-slate-700">Financials</h2>
                    <div className="flex items-center mb-4">
                        <input
                            id="showExpenditure"
                            name="showExpenditure"
                            type="checkbox"
                            checked={formData.showExpenditure}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="showExpenditure" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                            Include Expenditure Amount in Report
                        </label>
                    </div>
                    {formData.showExpenditure && (
                        <FormField id="expenditure" label="Expenditure Amount (INR)" type="number" value={formData.expenditure} onChange={handleChange} placeholder="e.g., 5000" />
                    )}

                    <h2 className="text-xl font-semibold border-b pb-4 mb-6 mt-8 text-slate-700">File Uploads</h2>
                    <div className="grid md:grid-cols-3 gap-x-8">
                        <FileUpload 
                            id="invitation" 
                            label="Event Invitation" 
                            onFileChange={handleFileChange} 
                            accept=".jpg,.png,.pdf" 
                            files={files.invitation ? [files.invitation] : []} 
                            onFileUpdate={(idx, file) => handleFileUpdate('invitation', idx, file)}
                            onRemove={(idx) => handleRemoveFile('invitation', idx)}
                        />
                        <FileUpload 
                            id="photos" 
                            label="Event Photos" 
                            onFileChange={handleFileChange} 
                            accept=".jpg,.png" 
                            multiple 
                            files={files.photos} 
                            onFileUpdate={(idx, file) => handleFileUpdate('photos', idx, file)}
                            onRemove={(idx) => handleRemoveFile('photos', idx)}
                        />
                        <FileUpload 
                            id="attendance" 
                            label="Attendance Sheets" 
                            onFileChange={handleFileChange} 
                            accept=".jpg,.png,.pdf" 
                            multiple 
                            files={files.attendance} 
                            onFileUpdate={(idx, file) => handleFileUpdate('attendance', idx, file)}
                            onRemove={(idx) => handleRemoveFile('attendance', idx)}
                        />
                    </div>

                    <div className="mt-10 text-center">
                        <button onClick={handlePreview} disabled={!isFormValid} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed w-full md:w-auto mx-auto shadow-md">
                            Preview Report
                        </button>
                        {!isFormValid && <p className="text-sm text-red-500 mt-2">Please fill all required fields and upload at least one photo.</p>}
                    </div>
                </div>
            </main>

            {/* Footer with Developer Details, Matrix Rain Background, and Right-side Support Button */}
            <footer className="relative bg-slate-900 text-white mt-8 border-t border-slate-700 overflow-hidden">
                {/* Canvas for Coding Animation (Matrix Rain) */}
                <canvas 
                    ref={canvasRef} 
                    className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                    style={{ zIndex: 0 }}
                />

                <div className="container mx-auto px-4 py-8 relative" style={{ zIndex: 10 }}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        
                        {/* Left: Developer Details */}
                        <div className="flex flex-col items-center md:items-start">
                            <p className="text-gray-400 text-sm mb-2 font-medium">Developed by</p>
                            <h3 className="text-2xl font-bold mb-4 animate-glow text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" style={{
                                textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                                animation: 'pulse-glow 2s infinite alternate'
                            }}>
                                Arun S
                            </h3>
                            
                            <div className="flex space-x-6">
                                {/* Instagram */}
                                <a href="https://www.instagram.com/arun_sakthi28?igsh=azBmZGN2OGFzNTQ=" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-500 transition-all transform hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                </a>
                                {/* LinkedIn */}
                                <a href="https://www.linkedin.com/in/arun-s-77a693283?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-500 transition-all transform hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                </a>
                                {/* Portfolio */}
                                <a href="https://arun-sakthi28.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-400 transition-all transform hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Right: Support Care & Contact Button */}
                        <a 
                            href="https://wa.me/919361645871" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center px-6 py-3 bg-[#25D366] rounded-full shadow-lg hover:bg-[#128C7E] transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                            aria-label="Support Care & Contact"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24" className="mr-2">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.888.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.978zm11.374-10.213c-2.262 0-3.755-.37-5.228 1.103-1.472 1.472-1.243 2.656-.237 4.149 1.006 1.492 3.826 4.312 5.319 5.318 1.493 1.006 2.677 1.236 4.148-.236 1.473-1.473 1.104-2.966 1.104-5.228 0-.961-.637-1.428-1.428-1.804-1.127-.525-2.222-1.031-3.678-3.302z"/>
                            </svg>
                            <span className="font-bold text-white text-lg">Support Care & Contact</span>
                        </a>

                    </div>
                </div>
            </footer>

            <style>{`
              @keyframes pulse-glow {
                0% { filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.6)); text-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                100% { filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.8)); text-shadow: 0 0 15px rgba(236, 72, 153, 0.6); }
              }
            `}</style>
            
            {showPreview && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex flex-col h-screen">
                    {/* Toolbar */}
                    <div className="bg-white p-4 shadow-md flex justify-between items-center z-10">
                        <h2 className="text-xl font-bold text-gray-800">Report Preview</h2>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                </svg>
                                Back to Edit
                            </button>
                            <button 
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDownloading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing PDF...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {/* Scrollable Preview Area */}
                    <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center">
                        {/* Wrapper for the pages to ensure they are centered and visible */}
                        <div className="flex flex-col items-center gap-8 py-8">
                            <ReportPreview data={formData} files={files} reportRef={reportRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;

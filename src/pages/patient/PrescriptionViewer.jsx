import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getDoctorPrescriptionUrl } from '../../services/patientService';

const PrescriptionViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filePath = searchParams.get('file');

  useEffect(() => {
    const loadPrescription = async () => {
      if (!filePath) {
        setError('No prescription file specified');
        setLoading(false);
        return;
      }

      try {
        const url = await getDoctorPrescriptionUrl(filePath);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to load prescription');
        }

        const html = await response.text();
        setHtmlContent(html);
      } catch (err) {
        console.error('Error loading prescription:', err);
        setError('Failed to load prescription. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPrescription();
  }, [filePath]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handleDownloadPDF = () => {
    // Open in new window for printing/saving as PDF
    handlePrint();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-red-500 text-3xl">error_outline</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Prescription</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <span className="material-icons text-slate-600">arrow_back</span>
            </button>
            <div>
              <h1 className="font-bold text-slate-800">Prescription</h1>
              <p className="text-sm text-slate-500">From your doctor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all"
            >
              <span className="material-icons text-lg">print</span>
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Prescription Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <iframe
            srcDoc={htmlContent}
            title="Prescription"
            className="w-full border-0"
            style={{ minHeight: '800px', height: 'auto' }}
            onLoad={(e) => {
              // Auto-resize iframe to content
              const iframe = e.target;
              try {
                iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 50 + 'px';
              } catch (err) {
                // Cross-origin restrictions may prevent this
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrescriptionViewer;

"use client";

import { useState, useEffect } from "react";
import { UploadZone } from "@/components/upload-zone";
import { LoginForm } from "@/components/login-form";
import { ResumeData } from "@/lib/types";

type ProcessingStatus = "idle" | "extracting" | "parsing" | "generating" | "complete" | "error";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [formattedPdfUrl, setFormattedPdfUrl] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
      if (formattedPdfUrl) URL.revokeObjectURL(formattedPdfUrl);
    };
  }, [originalPdfUrl, formattedPdfUrl]);

  const processResume = async (file: File) => {
    // Cleanup previous URLs
    if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
    if (formattedPdfUrl) URL.revokeObjectURL(formattedPdfUrl);

    // Store original PDF for preview
    const originalUrl = URL.createObjectURL(file);
    setOriginalPdfUrl(originalUrl);

    setStatus("extracting");
    setError(null);
    setResumeData(null);
    setPdfBlob(null);
    setFormattedPdfUrl(null);

    try {
      // Step 1: Parse the PDF and extract structured data
      setStatus("parsing");
      const formData = new FormData();
      formData.append("file", file);

      const parseResponse = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || "Failed to parse resume");
      }

      const parseResult = await parseResponse.json();
      setResumeData(parseResult.data);

      // Step 2: Generate the formatted PDF
      setStatus("generating");
      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parseResult.data),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await generateResponse.blob();
      setPdfBlob(blob);
      
      // Create URL for formatted PDF preview
      const formattedUrl = URL.createObjectURL(blob);
      setFormattedPdfUrl(formattedUrl);
      
      setStatus("complete");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const downloadPdf = () => {
    if (!pdfBlob || !resumeData) return;

    const filename = resumeData.name 
      ? `${resumeData.name.replace(/\s+/g, "_")}_Resume.pdf`
      : `Candidate_Resume.pdf`;

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    // Cleanup blob URLs
    if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
    if (formattedPdfUrl) URL.revokeObjectURL(formattedPdfUrl);
    
    setStatus("idle");
    setError(null);
    setResumeData(null);
    setPdfBlob(null);
    setOriginalPdfUrl(null);
    setFormattedPdfUrl(null);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // Reload to ensure all state is fresh
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      reset();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "extracting":
        return "Extracting text from PDF...";
      case "parsing":
        return "Analyzing resume with AI...";
      case "generating":
        return "Generating formatted PDF...";
      case "complete":
        return "Resume reformatted successfully!";
      case "error":
        return error || "An error occurred";
      default:
        return "";
    }
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className={`w-full mx-auto ${status === "complete" ? "max-w-6xl" : "max-w-2xl"}`}>
        <div className="text-center mb-8 relative">
          <button
            onClick={handleLogout}
            className="absolute top-0 right-0 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            title="Logout"
          >
            Logout
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Resume Formatter</h1>
          <p className="mt-3 text-lg text-gray-600">
            Upload a PDF resume and get it reformatted to a clean US standard format
          </p>
        </div>

        {status === "idle" && (
          <div className="flex justify-center">
            <UploadZone
              onFileSelect={processResume}
              isProcessing={false}
            />
          </div>
        )}

        {(status === "extracting" || status === "parsing" || status === "generating") && (
          <div className="w-full max-w-xl mx-auto p-12 bg-white border border-gray-200 rounded-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{getStatusMessage()}</p>
          </div>
        )}

        {status === "error" && (
          <div className="w-full max-w-xl mx-auto p-8 bg-red-50 border border-red-200 rounded-xl text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-4 text-red-700">{error}</p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {status === "complete" && resumeData && (
          <>
            {/* Success message and actions */}
            <div className="w-full max-w-xl mx-auto mb-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
              <div className="flex items-center justify-center gap-3">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-green-700 font-medium">
                  {resumeData.name 
                    ? `Resume for ${resumeData.name} reformatted successfully!`
                    : "Resume reformatted successfully!"}
                </p>
              </div>
              <div className="mt-4 flex gap-4 justify-center">
                <button
                  onClick={downloadPdf}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Download PDF
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Format Another
                </button>
              </div>
            </div>

            {/* Side-by-side PDF preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original PDF */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700">Original Resume</h3>
                </div>
                {originalPdfUrl && (
                  <iframe
                    src={originalPdfUrl}
                    className="w-full h-[700px]"
                    title="Original Resume"
                  />
                )}
              </div>

              {/* Formatted PDF */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                  <h3 className="font-semibold text-blue-700">Formatted Resume</h3>
                </div>
                {formattedPdfUrl && (
                  <iframe
                    src={formattedPdfUrl}
                    className="w-full h-[700px]"
                    title="Formatted Resume"
                  />
                )}
              </div>
            </div>

            {/* Extracted Information */}
            <div className="mt-6 w-full max-w-xl mx-auto p-6 bg-white border border-gray-200 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Information</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {resumeData.name && (
                  <div>
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-gray-900 font-medium">{resumeData.name}</dd>
                  </div>
                )}
                {resumeData.contact.email && (
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-gray-900">{resumeData.contact.email}</dd>
                  </div>
                )}
                {resumeData.experience.length > 0 && (
                  <div>
                    <dt className="text-gray-500">Experience</dt>
                    <dd className="text-gray-900">{resumeData.experience.length} positions</dd>
                  </div>
                )}
                {resumeData.additionalExperience && resumeData.additionalExperience.length > 0 && (
                  <div>
                    <dt className="text-gray-500">Additional Experience</dt>
                    <dd className="text-gray-900">{resumeData.additionalExperience.length} entries</dd>
                  </div>
                )}
                {resumeData.education.length > 0 && (
                  <div>
                    <dt className="text-gray-500">Education</dt>
                    <dd className="text-gray-900">{resumeData.education.length} entries</dd>
                  </div>
                )}
                {resumeData.skills.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-gray-500">Skills</dt>
                    <dd className="text-gray-900">{resumeData.skills.slice(0, 8).join(", ")}{resumeData.skills.length > 8 ? "..." : ""}</dd>
                  </div>
                )}
              </dl>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

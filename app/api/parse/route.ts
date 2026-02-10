import { NextRequest, NextResponse } from "next/server";
// Import polyfills before pdf-parse to ensure DOM APIs are available
import "@/lib/pdf-polyfills";
import { PDFParse } from "pdf-parse";
import { parseResumeWithAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Convert File to Uint8Array for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Extract text from PDF using pdf-parse v2 API
    let resumeText: string;
    try {
      const pdfParse = new PDFParse({ data: uint8Array });
      const textResult = await pdfParse.getText();
      resumeText = textResult.pages.map(page => page.text).join("\n\n");
    } catch (err) {
      console.error("PDF parsing error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      // Check for DOMMatrix or canvas-related errors
      if (errorMessage.includes("DOMMatrix") || errorMessage.includes("canvas")) {
        return NextResponse.json(
          { success: false, error: "PDF parsing configuration error. Please check server logs." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Failed to read PDF file. The file may be corrupted or password-protected." },
        { status: 400 }
      );
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract sufficient text from the PDF. The file may be image-based or empty." },
        { status: 400 }
      );
    }

    // Parse with OpenAI
    const resumeData = await parseResumeWithAI(resumeText);

    return NextResponse.json({
      success: true,
      data: resumeData,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

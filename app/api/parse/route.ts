import { NextRequest, NextResponse } from "next/server";
import { parseResumeFromPDF } from "@/lib/openai";

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

    // Convert uploaded file to base64 for OpenAI file input
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength < 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not read sufficient content from the PDF. The file may be empty or corrupted.",
        },
        { status: 400 }
      );
    }

    // Parse with OpenAI directly from PDF content
    const base64PDF = Buffer.from(arrayBuffer).toString("base64");
    const resumeData = await parseResumeFromPDF(base64PDF, file.name);

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

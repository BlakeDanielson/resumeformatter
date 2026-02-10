import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { ResumeDocument } from "@/lib/resume-template";
import { ResumeData } from "@/lib/types";
import React from "react";

export async function POST(request: NextRequest) {
  try {
    const data: ResumeData = await request.json();

    // Ensure arrays exist
    if (!data.experience) data.experience = [];
    if (!data.education) data.education = [];
    if (!data.skills) data.skills = [];
    if (!data.contact) data.contact = {};

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(ResumeDocument, { data }) as unknown as React.ReactElement<DocumentProps>
    );

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Generate filename
    const filename = data.name 
      ? `${data.name.replace(/\s+/g, "_")}_Resume.pdf`
      : `Candidate_Resume.pdf`;

    // Return PDF as downloadable file
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}

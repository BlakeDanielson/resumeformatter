import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:3000";
const INPUT_DIR = path.join(process.cwd(), "Resumes");
const OUTPUT_DIR = path.join(process.cwd(), "Resumes", "formatted");

async function formatResume(filePath: string): Promise<string> {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing: ${fileName}`);

  // Read the PDF file
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "application/pdf" });

  // Create form data
  const formData = new FormData();
  formData.append("file", blob, fileName);

  // Step 1: Parse the PDF
  console.log("  → Extracting and parsing with AI...");
  const parseResponse = await fetch(`${API_BASE}/api/parse`, {
    method: "POST",
    body: formData,
  });

  if (!parseResponse.ok) {
    const error = await parseResponse.json();
    throw new Error(`Parse failed: ${error.error || "Unknown error"}`);
  }

  const parseResult = await parseResponse.json();
  console.log(`  → Parsed successfully${parseResult.data.name ? ` (${parseResult.data.name})` : ""}`);

  // Step 2: Generate the formatted PDF
  console.log("  → Generating formatted PDF...");
  const generateResponse = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parseResult.data),
  });

  if (!generateResponse.ok) {
    const error = await generateResponse.json();
    throw new Error(`Generate failed: ${error.error || "Unknown error"}`);
  }

  // Save the PDF
  const pdfBuffer = await generateResponse.arrayBuffer();
  const outputFileName = fileName.replace(".pdf", "_formatted.pdf");
  const outputPath = path.join(OUTPUT_DIR, outputFileName);
  
  fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));
  console.log(`  ✓ Saved: ${outputFileName}`);

  return outputPath;
}

async function main() {
  console.log("=== Resume Batch Formatter ===\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Get all PDF files
  const files = fs.readdirSync(INPUT_DIR).filter(
    (file) => file.endsWith(".pdf") && !file.includes("_formatted")
  );

  console.log(`Found ${files.length} PDF files to process`);

  const results: { file: string; success: boolean; error?: string }[] = [];

  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);
    try {
      await formatResume(filePath);
      results.push({ file, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`  ✗ Error: ${errorMessage}`);
      results.push({ file, success: false, error: errorMessage });
    }
  }

  // Summary
  console.log("\n=== Summary ===");
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`✓ Successful: ${successful}`);
  console.log(`✗ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed files:");
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.file}: ${r.error}`));
  }

  console.log(`\nFormatted resumes saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);

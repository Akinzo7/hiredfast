import mammoth from 'mammoth';

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    let pdfjsLib;
    try {
      pdfjsLib = await import('pdfjs-dist');
    } catch (e) {
      console.error("Import error:", e);
      throw new Error("Failed to load PDF parser. Please check your internet connection.");
    }
    
    if (typeof window !== 'undefined') {
      // Use hardcoded version matching package.json to ensure worker compatibility.
      // using unpkg as it mirrors npm versions reliably.
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    
    let pdf;
    try {
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (loadError) {
        throw new Error("Detailed PDF Load Error: File corrupted or encrypted.");
    }
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .filter((s: string) => s.trim().length > 0)
          .join(' ');
          
        fullText += pageText + '\n';
      } catch (pageErr) {
        console.warn(`Skipping page ${i} due to error`, pageErr);
      }
    }
    
    if (fullText.trim().length === 0) {
        throw new Error("Extracted text is empty. The PDF might be an image scan. Please use a DOCX or text-based PDF.");
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    if (error instanceof Error) throw error; 
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
  }
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    throw new Error('Failed to extract text from DOCX. Please ensure the file is a valid DOCX file.');
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.name.toLowerCase();
  
  if (fileType.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else if (fileType.endsWith('.docx')) {
    return extractTextFromDOCX(file);
  } else if (fileType.endsWith('.doc')) {
    throw new Error('Legacy .doc files are not supported. Please convert to .docx or PDF.');
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
}

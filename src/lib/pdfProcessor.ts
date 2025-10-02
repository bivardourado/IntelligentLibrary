import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js - usar arquivo local primeiro, CDN como fallback
if (typeof window !== 'undefined') {
  // Tentar usar arquivo local primeiro
  pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';
}

export interface ProcessedDocument {
  id: string;
  name: string;
  content: string;
  pages: number;
  uploadedAt: Date;
}

export class PDFProcessor {
  static async processFile(file: File): Promise<ProcessedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    
    // Extrair texto de cada página
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n--- Página ${i} ---\n${pageText}\n`;
    }
    
    return {
      id: Date.now().toString(),
      name: file.name,
      content: fullText.trim(),
      pages: totalPages,
      uploadedAt: new Date()
    };
  }
  
  static saveDocuments(documents: ProcessedDocument[]): void {
    localStorage.setItem('intelligent-library-documents', JSON.stringify(documents));
  }
  
  static loadDocuments(): ProcessedDocument[] {
    const stored = localStorage.getItem('intelligent-library-documents');
    if (!stored) return [];
    
    try {
      return JSON.parse(stored).map((doc: any) => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt)
      }));
    } catch {
      return [];
    }
  }
  
  static searchInDocuments(documents: ProcessedDocument[], query: string): string {
    const lowerQuery = query.toLowerCase();
    const results: string[] = [];
    
    documents.forEach(doc => {
      const lines = doc.content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          const context = lines.slice(Math.max(0, index - 1), index + 2).join('\n');
          results.push(`**${doc.name}**: ${context.trim()}`);
        }
      });
    });
    
    if (results.length === 0) {
      return `Não encontrei informações sobre "${query}" nos documentos carregados.`;
    }
    
    return `Encontrei ${results.length} referência(s) sobre "${query}":\n\n${results.slice(0, 3).join('\n\n')}`;
  }
}
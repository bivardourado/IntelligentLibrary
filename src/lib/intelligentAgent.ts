import { ProcessedDocument } from './pdfProcessor';

export interface AgentResponse {
  content: string;
  sources?: string[];
  error?: string;
}

export interface ConversationMemory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SearchResult {
  content: string;
  source: string;
  page?: number;
  relevanceScore: number;
}

export class IntelligentAgent {
  private static apiKey: string | null = null;
  private static conversationHistory: ConversationMemory[] = [];
  
  private static readonly MAX_SEARCH_RESULTS = 8;
  private static readonly SIMILARITY_THRESHOLD = 0.3;

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static clearMemory() {
    this.conversationHistory = [];
  }

  static getMemory(): ConversationMemory[] {
    return [...this.conversationHistory];
  }

  private static semanticSearch(query: string, documents: ProcessedDocument[]): SearchResult[] {
    if (documents.length === 0) return [];
    
    const queryTerms = this.extractKeyTerms(query);
    const results: SearchResult[] = [];

    documents.forEach(doc => {
      const chunks = this.createTextChunks(doc.content, 800);
      chunks.forEach((chunk, index) => {
        const relevanceScore = this.calculateRelevance(queryTerms, chunk);
        if (relevanceScore > this.SIMILARITY_THRESHOLD) {
          results.push({
            content: chunk,
            source: doc.name,
            page: Math.floor(index * 800 / 1000) + 1,
            relevanceScore
          });
        }
      });
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.MAX_SEARCH_RESULTS);
  }

  private static extractKeyTerms(text: string): string[] {
    const stopwords = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'e', 'ou', 'mas', 'que', 'de', 'do', 'da', 'em', 'no', 'na', 'por', 'para', 'com', 'sem', 'sobre', 'entre', 'quando', 'onde', 'como', 'por que', 'porque', 'então', 'se', 'não', 'sim', 'muito', 'mais', 'menos', 'todo', 'toda', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela']);
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(term => term.length > 2 && !stopwords.has(term)).slice(0, 10);
  }

  private static calculateRelevance(queryTerms: string[], text: string): number {
    const textLower = text.toLowerCase();
    let score = 0;
    let termMatches = 0;
    queryTerms.forEach(term => {
      const termCount = (textLower.match(new RegExp(term, 'g')) || []).length;
      if (termCount > 0) {
        termMatches++;
        score += termCount * (1 + Math.log(term.length));
      }
    });
    const coverage = termMatches > 0 ? termMatches / queryTerms.length : 0;
    const density = text.length > 0 ? (score / text.length) * 1000 : 0;
    return coverage * 0.7 + density * 0.3;
  }

  private static createTextChunks(text: string, chunkSize: number): string[] {
    const words = text.split(' ');
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
  }

  /**
   * Motor principal do agente inteligente - VERSÃO FINAL
   */
  static async processQuestion(
    question: string, 
    documents: ProcessedDocument[]
  ): Promise<AgentResponse> {
    if (!this.apiKey) {
      return { content: "Erro: Chave da OpenAI não configurada.", error: "API_KEY_MISSING" };
    }

    try {
      this.conversationHistory.push({ role: 'user', content: question, timestamp: new Date() });

      // Etapa 1: Busca nos documentos. A IA SEMPRE será consultada.
      const searchResults = this.semanticSearch(question, documents);

      // Etapa 2: Construção do contexto para a IA.
      // Se searchResults estiver vazio, o contexto informará isso à IA.
      const documentContext = this.buildDocumentContext(searchResults);
      const conversationContext = this.buildConversationContext();

      // Etapa 3: Prompt do agente e do usuário.
      const systemPrompt = this.buildAgentPrompt(documentContext);
      const userPrompt = this.buildUserPrompt(question, conversationContext);

      // Etapa 4: Chamada à OpenAI. A IA agora tem a responsabilidade de decidir.
      const response = await this.callOpenAI(systemPrompt, userPrompt);
      
      if (response.error) {
        return response;
      }

      // Etapa 5: Lógica de Fontes Inteligente.
      const noResultResponse = "Após uma busca nos documentos, não encontrei uma resposta direta.";
      let sources: string[] | undefined = undefined;

      // As fontes só são adicionadas se houver resultados E se a resposta da IA não for a de "não encontrado".
      // Isso cobre o caso onde a IA recebe documentos mas conclui que eles não são relevantes.
      if (searchResults.length > 0 && response.content.trim() !== noResultResponse) {
        sources = [...new Set(searchResults.map(r => `${r.source} (p. ${r.page})`))].slice(0, 5);
      }

      const finalResponse = {
        content: response.content,
        sources // Será undefined se as condições não forem atendidas.
      };

      this.conversationHistory.push({ role: 'assistant', content: response.content, timestamp: new Date() });

      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return finalResponse;

    } catch (error) {
      console.error('Erro no agente inteligente:', error);
      return { content: `Erro interno do agente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error: "AGENT_ERROR" };
    }
  }

  private static buildDocumentContext(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
      return "Nenhum documento relevante encontrado.";
    }
    let context = "=== CONTEXTO DOS DOCUMENTOS ===\n\n";
    searchResults.forEach((result, index) => {
      context += `[FONTE ${index + 1}] Origem: ${result.source}`;
      if (result.page) context += ` - Página ${result.page}`;
      context += `\nConteúdo: ${result.content.substring(0, 800)}...\n\n`;
    });
    return context;
  }

  private static buildConversationContext(): string {
    if (this.conversationHistory.length <= 2) return "";
    const recentHistory = this.conversationHistory.slice(-6, -2);
    let context = "=== CONTEXTO DA CONVERSA ANTERIOR ===\n";
    recentHistory.forEach(entry => {
      context += `${entry.role.toUpperCase()}: ${entry.content.substring(0, 200)}...\n`;
    });
    return context + "\n";
  }

  private static buildAgentPrompt(documentContext: string): string {
    return `Você é Manus, um assistente de pesquisa de elite. Sua única função é analisar o contexto de documentos fornecidos e responder perguntas com base neles.

**REGRAS ABSOLUTAS E INQUEBRÁVEIS:**

1.  **FONTE EXCLUSIVA:** Sua única fonte de verdade é o texto fornecido na seção "CONTEXTO DOS DOCUMENTOS". É proibido usar qualquer conhecimento prévio ou externo.

2.  **CENÁRIO 1: INFORMAÇÃO ENCONTRADA:**
    *   Se o contexto contém a resposta para a pergunta do usuário, construa-a usando **exclusivamente** as palavras e dados dos documentos.
    *   Sintetize informações de múltiplas fontes se necessário para uma resposta completa.
    *   Ao final da sua resposta, **não adicione nada mais**. A interface do usuário adicionará as fontes.

3.  **CENÁRIO 2: INFORMAÇÃO NÃO ENCONTRADA:**
    *   Se o contexto diz "Nenhum documento relevante encontrado" OU se o conteúdo dos documentos fornecidos não responde à pergunta do usuário, sua única resposta permitida é a frase exata: **"Após uma busca nos documentos, não encontrei uma resposta direta."**
    *   Não peça desculpas, não ofereça ajuda adicional, não diga mais nada. Apenas essa frase.

**A violação dessas regras, especialmente o uso de conhecimento externo, é uma falha crítica de sua função.**

---
${documentContext}
---`;
  }

  private static buildUserPrompt(question: string, conversationContext: string): string {
    return `${conversationContext}**PERGUNTA ATUAL:** ${question}\n\nAnalise a pergunta e o contexto dos documentos. Siga rigorosamente suas regras absolutas para fornecer a resposta.`;
  }

  private static async callOpenAI(systemPrompt: string, userPrompt: string): Promise<AgentResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          max_tokens: 1000,
          temperature: 0.0
        } )
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { content: `Erro na API OpenAI: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`, error: "API_ERROR" };
      }
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      if (!aiResponse) {
        return { content: "Erro: Não foi possível obter resposta da IA.", error: "NO_RESPONSE" };
      }
      return { content: aiResponse.trim() };
    } catch (error) {
      return { content: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error: "CONNECTION_ERROR" };
    }
  }
}

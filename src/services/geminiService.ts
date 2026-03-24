import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface IOCAnalysisResult {
  status: 'Malicious' | 'Suspicious' | 'Clean' | 'Unknown';
  explanation: string;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendations: string[];
}

export const analyzeIOC = async (type: string, value: string): Promise<IOCAnalysisResult> => {
  if (!ai) {
    console.warn("GEMINI_API_KEY missing. Using mock analysis.");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    
    // Simple mock logic based on common patterns
    const isMalicious = value.includes('evil') || value.includes('malware') || value.startsWith('192.168.1.100');
    
    return {
      status: isMalicious ? 'Malicious' : 'Clean',
      explanation: `[MOCK MODE] This is a simulated analysis for ${type}: ${value}. In a real environment with an API key, this would be analyzed against global threat intelligence feeds.`,
      threatLevel: isMalicious ? 'High' : 'Low',
      recommendations: isMalicious 
        ? ["Block this indicator at the firewall", "Isolate affected systems", "Initiate incident response"]
        : ["Continue monitoring", "No immediate action required"]
    };
  }

  const prompt = `Act as a senior Cyber Threat Intelligence (CTI) analyst. 
  Analyze the following Indicator of Compromise (IOC):
  Type: ${type}
  Value: ${value}

  Provide a detailed analysis including:
  1. Maliciousness status.
  2. Explanation of why it is flagged (or not).
  3. Associated threat actors or campaigns if known.
  4. Recommended mitigation steps.
  
  Return the result in JSON format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ['Malicious', 'Suspicious', 'Clean', 'Unknown'] },
          explanation: { type: Type.STRING },
          threatLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['status', 'explanation', 'threatLevel', 'recommendations']
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateThreatReport = async (data: any): Promise<string> => {
  if (!ai) {
    return `
# [MOCK] Cyber Threat Intelligence Report
**Target IOC:** ${data.ioc} (${data.type})
**Status:** ${data.analysis.status}
**Threat Level:** ${data.analysis.threatLevel}

## Executive Summary
This is a mock report generated because no Gemini API key was provided. In a live system, this section would contain a high-level summary of the threat actor's motivations and the potential impact on the organization.

## Technical Details
- **Indicator:** ${data.ioc}
- **Analysis:** ${data.analysis.explanation}

## Recommendations
${data.analysis.recommendations.map((r: string) => `- ${r}`).join('\n')}
    `;
  }

  const prompt = `Generate a professional Cyber Threat Intelligence report for an intern's portfolio based on the following data:
  ${JSON.stringify(data)}
  
  Format the report in Markdown with clear sections: Executive Summary, Technical Details, IOCs, and Recommendations.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

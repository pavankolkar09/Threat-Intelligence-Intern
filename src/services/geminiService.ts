import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface IOCAnalysisResult {
  status: 'Malicious' | 'Suspicious' | 'Clean' | 'Unknown';
  explanation: string;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendations: string[];
}

export const analyzeIOC = async (type: string, value: string): Promise<IOCAnalysisResult> => {
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
  const prompt = `Generate a professional Cyber Threat Intelligence report for an intern's portfolio based on the following data:
  ${JSON.stringify(data)}
  
  Format the report in Markdown with clear sections: Executive Summary, Technical Details, IOCs, and Recommendations.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

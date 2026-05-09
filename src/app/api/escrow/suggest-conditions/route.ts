import { NextRequest, NextResponse } from "next/server";
import {
  loadModel,
  completion,
  LLAMA_3_2_1B_INST_Q4_0,
} from "@qvac/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// QVAC Model cache
let cachedModelId: string | null = null;
let modelLoadPromise: Promise<string> | null = null;

async function getQVACModel(): Promise<string> {
  if (cachedModelId) {
    return cachedModelId;
  }

  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  modelLoadPromise = (async () => {
    try {
      cachedModelId = await loadModel({
        modelSrc: LLAMA_3_2_1B_INST_Q4_0,
        modelType: "llm",
      });
      console.log("QVAC model loaded for condition suggestions");
      return cachedModelId;
    } catch (error) {
      console.error("QVAC model load failed:", error);
      modelLoadPromise = null;
      throw new Error("QVAC model initialization failed");
    }
  })();

  return modelLoadPromise;
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, memo } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400, headers: CORS }
      );
    }

    // QVAC AI Analysis
    try {
      const modelId = await getQVACModel();
      
      const prompt = `You are Flint AI, helping sellers create clear service conditions for payment protection.

Based on this invoice, suggest 3-5 specific, measurable service conditions that protect the seller. Be concise and practical.

Invoice Title: ${title}
Description: ${memo || "none"}

Format your response as a bulleted list. Each condition should be:
- Specific and measurable
- Realistic to deliver
- Clear about what's included

Example for "Logo Design":
- Deliver 3 initial logo concepts in PNG format
- Include source files (AI, SVG)
- 2 rounds of revisions included
- Commercial usage rights transferred
- Delivery within 7 days

Your response:`;

      const result = await completion({
        model: modelId,
        prompt,
        maxTokens: 200,
        temperature: 0.7,
      });

      // Parse the response into individual conditions
      const responseText = result.completion || "";
      const conditions = responseText
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 10 && line.length < 200)
        .slice(0, 5);

      console.log("AI suggested conditions:", conditions);

      return NextResponse.json(
        { conditions },
        { headers: CORS }
      );
    } catch (aiError) {
      console.error("QVAC inference error:", aiError);
      // Return fallback conditions if AI fails
      return NextResponse.json(
        { 
          conditions: [
            "Deliver work as described in the invoice",
            "Provide all source files and assets",
            "Include one round of revisions",
            "Complete within the agreed timeframe",
          ],
          aiUnavailable: true,
        },
        { headers: CORS }
      );
    }
  } catch (error) {
    console.error("Suggest conditions error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500, headers: CORS }
    );
  }
}

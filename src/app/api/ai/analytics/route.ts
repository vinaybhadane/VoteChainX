import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";

/**
 * AI Analytics Route:
 * Iska kaam hai voting metadata ko analyze karna bina voter ki privacy leak kiye.
 * Ye logs mein suspicious patterns (bots, multiple accounts, speed voting) detect karta hai.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { votingLogs } = body;

    // Validation
    if (!votingLogs || !Array.isArray(votingLogs)) {
      return NextResponse.json(
        { success: false, error: "Invalid voting logs provided." },
        { status: 400 }
      );
    }

    // Gemini ke liye 'Security Expert' Prompt
    const prompt = `
      You are an AI Security Expert for 'VoteChainX', a blockchain-based voting system.
      Your task is to analyze the following anonymized voting logs for any suspicious patterns or potential electoral fraud.

      VOTING LOGS (JSON):
      ${JSON.stringify(votingLogs)}

      Please check for:
      1. Rapid Voting: Multiple votes cast within milliseconds/seconds from similar sources.
      2. Device/IP Clustering: Unusual number of votes from the same hardware signature or IP.
      3. Timing Anomalies: Votes cast at inhumanly consistent intervals (potential bots).
      4. Session Hijacking: Irregularity in session durations.

      RESPONSE FORMAT:
      Return your analysis ONLY in the following JSON format:
      {
        "riskScore": (a number from 0 to 100),
        "status": ("Safe", "Suspicious", or "Critical"),
        "detectedAnomalies": ["list", "of", "issues"],
        "summary": "Short 2-line explanation of the situation"
      }
    `;

    // Gemini API Call
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // AI ka text response nikalna (kabhi-kabhi AI markdown boxes bhejta hai, use clean karna)
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleanedJson);

    return NextResponse.json({
      success: true,
      analysis: analysis,
    });

  } catch (error: any) {
    console.error("❌ AI Analytics Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to analyze voting patterns. Check server logs." 
      },
      { status: 500 }
    );
  }
}
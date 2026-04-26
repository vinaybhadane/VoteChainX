import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";

/**
 * VOTER-SAHAYAK AI ENGINE (v3.0 - Page Aware & Conditional Detail)
 * Role: Contextual guide for VoteChain-X
 */

export async function POST(req: Request) {
  try {
    const { userQuery, currentPage, voterName } = await req.json();

    if (!userQuery) {
      return NextResponse.json({ success: false, error: "No query" }, { status: 400 });
    }

    // 1. Page-Specific Knowledge Base
    // Yahan hum define kar rahe hain ki kis page par kya help deni hai
    const pageContexts: Record<string, string> = {
      "/": "Home Page: User can see project overview and features. Ask them to start by verifying identity.",
      "/auth/identity": "Identity Page: User needs to enter Aadhaar for secure hashing. Help them with verification steps.",
      "/dashboard": "Voting Dashboard: User can see candidate list. Guide them to select one and click 'Vote'.",
      "/results": "Results Page: Shows real-time counting from the blockchain. Explain that it's immutable.",
      "/admin": "Admin Panel: Only for officials to manage elections and candidates."
    };

    const currentPageInfo = pageContexts[currentPage] || "General Navigation Page";

    // 2. Optimized System Instruction
    const systemInstruction = `
      You are 'Voter-Sahayak', a smart voice assistant for 'VoteChain-X'.
      
      CURRENT CONTEXT:
      - User is on: ${currentPage}
      - Page Info: ${currentPageInfo}
      - User Name: ${voterName || "Voter"}

      BEHAVIOR RULES:
      1. DEFAULT MODE: Respond in MAXIMUM 15 WORDS. Be extremely direct.
      2. DETAIL MODE: If (and only if) the user asks "more info", "explain", "vistar se", or "details", you can provide a detailed answer (up to 50 words).
      3. PAGE AWARENESS: Your answer must relate to what the user sees on ${currentPage}.
      4. No introductory phrases like "Based on the page...". Just give the instruction.
      5. Respond in the user's language (Hindi/Marathi/English).

      EXAMPLE:
      - User on /dashboard asks "kya karu?": "उम्मीदवार चुनें और वोट बटन दबाएं।"
      - User asks "details do": Give a 2-3 sentence explanation of the process.
    `;

    console.log(`[Voter-Sahayak] Context: ${currentPage} | Query: ${userQuery}`);

    // 3. API Call
    const result = await model.generateContent([
      { text: systemInstruction },
      { text: `User Query: ${userQuery}` }
    ]);

    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      reply: responseText.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ AI Error:", error);
    return NextResponse.json({ success: false, error: "AI temporary down" }, { status: 500 });
  }
}
import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    console.log("Testing Gemini API with prompt:", prompt);

    // Bahut simple call sirf connectivity test karne ke liye
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("✅ Gemini API Success! Response received.");

    return NextResponse.json({
      success: true,
      apiResponse: responseText,
    });

  } catch (error: any) {
    console.error("❌ Gemini API Test Failed:", error);

    // Detailed error bhej rahe hain taaki debug kar sakein
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      status: error.status || 500
    }, { status: 500 });
  }
}
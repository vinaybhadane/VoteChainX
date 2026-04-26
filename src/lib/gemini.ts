// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * FIXED MODEL NAMES (Based on your API List):
 * 'gemini-2.5-flash' stable hai aur 1M tokens support karta hai.
 * 'gemini-3.1-pro-preview' deep analysis ke liye best hai.
 */

// Voter-Sahayak ke liye fast model
export const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash" 
});

// Analytics ke liye Pro model
export const proModel = genAI.getGenerativeModel({ 
  model: "gemini-3.1-pro-preview" 
});

export default genAI;
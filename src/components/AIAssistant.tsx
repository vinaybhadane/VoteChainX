"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// 1. TypeScript Declaration: unknown type error ko fix karne ke liye
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const AIAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBrowserReady, setIsBrowserReady] = useState(false);
  const pathname = usePathname();
  const recognitionRef = useRef<any>(null);

  // 2. Browser Voices Load karna (Speech Synthesis ke liye zaroori)
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setIsBrowserReady(true);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // 3. Mic Start karne ka loop logic
  const startAssistant = () => {
    // Sirf tabhi start karein jab processing na ho rahi ho
    if (recognitionRef.current && !isListening && !isProcessing) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log("🎤 Mic Active and Listening...");
      } catch (e) {
        // Recognition pehle se chal rahi ho toh error ignore karein
      }
    }
  };

  // 4. Speech Recognition Initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new (SpeechRecognition as any)();
        recognitionRef.current.continuous = false; // Har sentence ke baad result chahiye
        recognitionRef.current.lang = "hi-IN"; // Hindi/Marathi/English mixed support

        recognitionRef.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log("📝 User said:", transcript);
          await handleAIQuery(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          // Mic khatam hote hi 1 second baad phir shuru (Infinite loop)
          setTimeout(() => {
            if (!isProcessing) startAssistant();
          }, 1000);
        };

        recognitionRef.current.onerror = (e: any) => {
          console.error("Mic Error:", e.error);
          setIsListening(false);
          // Agar error 'not-allowed' nahi hai, toh restart koshish karein
          if (e.error !== 'not-allowed') {
            setTimeout(() => startAssistant(), 2000);
          }
        };

        startAssistant();
      }
    }

    // Cleanup logic
    return () => {
      recognitionRef.current?.stop();
    };
  }, [isProcessing]); // Processing state change par mic control reload hoga

  // 5. Backend API Call (Gemini Logic)
  const handleAIQuery = async (query: string) => {
    setIsProcessing(true);
    recognitionRef.current?.stop(); // Bolne se pehle mic band taaki feedback loop na bane

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userQuery: query, 
          currentPage: pathname,
          voterName: "Vinay" // Aap ise dynamic context se replace kar sakte hain
        }),
      });

      const data = await response.json();

      if (data.success && data.reply) {
        speak(data.reply);
      } else {
        console.error("AI Response Error");
        setIsProcessing(false);
        startAssistant();
      }
    } catch (e) {
      console.error("Fetch Error:", e);
      setIsProcessing(false);
      startAssistant();
    }
  };

  // 6. Speech Synthesis (Audio Output Logic)
  const speak = (text: string) => {
    if (typeof window !== "undefined") {
      // Step 1: Force stop any current speech
      window.speechSynthesis.cancel();

      // Step 2: 50ms delay browser engine ko reset karne ke liye (Error {} fix)
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          
          // Female Hindi voice priority (Nashik/Indian accent ke liye)
          const selectedVoice = voices.find(v => v.lang.includes("hi-IN") && v.name.includes("Google")) || 
                                voices.find(v => v.lang.includes("hi")) || 
                                voices[0];
          
          utterance.voice = selectedVoice;
          utterance.rate = 1.05; // Slightly faster for natural feel
          utterance.pitch = 1.0;

          utterance.onstart = () => console.log("🔊 AI speaking...");
          
          utterance.onend = () => {
            console.log("✅ Speech Finished.");
            setIsProcessing(false);
            // Bolne ke baad wapas mic on karne ke liye delay
            setTimeout(() => startAssistant(), 300);
          };

          utterance.onerror = (event) => {
            console.error("❌ SpeechSynthesis Error:", event);
            setIsProcessing(false);
            startAssistant();
          };

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error("Critical Speech Error:", err);
          setIsProcessing(false);
          startAssistant();
        }
      }, 50);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
      {/* Visual Feedback Pill */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-2xl transition-all duration-500 ${
        isListening ? "bg-red-500/10 border-red-500 shadow-red-500/20" : 
        isProcessing ? "bg-blue-500/10 border-blue-500 animate-pulse shadow-blue-500/20" : 
        "bg-gray-900/80 border-gray-700 backdrop-blur-md"
      }`}>
        <div className={`h-2.5 w-2.5 rounded-full ${
          isListening ? "bg-red-500 animate-ping" : 
          isProcessing ? "bg-blue-500" : "bg-gray-500"
        }`}></div>
        
        <span className="text-[10px] text-white font-mono font-bold uppercase tracking-[0.2em]">
          {isListening ? "Voter-Sahayak Active" : isProcessing ? "AI is Thinking" : "Standby"}
        </span>
      </div>

      {/* Reminder for First-time Click (Browser Security) */}
      {!isBrowserReady && (
        <p className="text-[9px] text-gray-500 font-medium animate-bounce">
          Click anywhere to wake AI 👆
        </p>
      )}
    </div>
  );
};

export default AIAssistant;
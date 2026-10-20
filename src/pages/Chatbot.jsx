import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiMessageCircle,
} from "react-icons/fi";

import { sendChatMessage } from "../services/aiService";

const SUGGESTIONS = [
  "What is my balance?",
  "How much did I spend this month?",
  "What is my largest expense?",
  "How much did I save?",
  "What are my loans?",
  "What are my budgets?",
];

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm your SmartBank financial assistant. Ask me about your name, accounts, balance, spending, savings, budgets, loans, or transactions.",
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);

  // ====================================================
  // AUTO SCROLL
  // ====================================================

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, sending]);

  // ====================================================
  // SEND MESSAGE
  // ====================================================

  const handleSend = async (text = "") => {
    const message = String(
      text || input || ""
    ).trim();

    if (!message || sending) {
      return;
    }

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: message,
      },
    ]);

    setInput("");
    setSending(true);

    try {
      const response =
        await sendChatMessage(message);

      const reply =
        response?.reply ||
        response?.message ||
        "I couldn't process that question right now.";

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: reply,
          configured: response?.configured,
        },
      ]);
    } catch (error) {
      console.error(
        "AI Chatbot error:",
        error
      );

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: errorMessage,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // ====================================================
  // FORM SUBMIT
  // ====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || sending) {
      return;
    }

    await handleSend(message);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col rounded-xl border border-slate-100 bg-white shadow-sm">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <FiMessageCircle className="h-5 w-5 text-brand-600" />

        <div>
          <h1 className="font-semibold text-slate-900">
            AI Chatbot
          </h1>

          <p className="text-xs text-slate-500">
            SmartBank financial assistant
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${
                message.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="border-t border-slate-100 px-5 py-3">

        {/* SUGGESTIONS */}
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={sending}
              onClick={() =>
                handleSend(suggestion)
              }
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            placeholder="Ask about your finances..."
            disabled={sending}
            autoComplete="off"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
          />

          <button
            type="submit"
            disabled={
              sending || !input.trim()
            }
            className="flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
import { useState, useRef, useEffect } from "react";
import { FiSend, FiMessageCircle } from "react-icons/fi";
import { sendChatMessage } from "../services/aiService";

const SUGGESTIONS = [
  "What is my balance?",
  "How much did I spend this month?",
  "What is my largest expense?",
  "How much did I save?",
];

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! Ask me about your balance, spending, savings, or budgets.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const message = (text ?? input).trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setSending(true);

    try {
      const res = await sendChatMessage(message);
      const replyText = res.reply || res.message || "I couldn't process that right now.";
      setMessages((prev) => [...prev, { role: "bot", text: replyText, configured: res.configured }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: err.message || "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <FiMessageCircle className="h-5 w-5 text-brand-600" />
        <h1 className="font-semibold text-slate-900">AI Chatbot</h1>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-400">Thinking...</div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;

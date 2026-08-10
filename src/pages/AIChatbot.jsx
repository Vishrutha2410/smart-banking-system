import { useState } from "react";
import {
  FaRobot,
  FaUser,
  FaPaperPlane,
  FaTrash,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function AIChatbot() {

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I'm your SmartBank AI assistant. How can I help you today?",
    },
  ]);

  const getResponse = (text) => {
    const lower = text.toLowerCase();

    if (lower.includes("balance")) {
      return "Your current demo account balance is ₹1,24,850.";
    }

    if (
      lower.includes("transfer") ||
      lower.includes("send money")
    ) {
      return "You can transfer funds by opening the Fund Transfer section from your dashboard.";
    }

    if (lower.includes("loan")) {
      return "You can view your existing loans and explore loan options from the Loans section.";
    }

    if (
      lower.includes("expense") ||
      lower.includes("spending")
    ) {
      return "Your recent spending is highest in shopping and food categories. Consider setting a monthly budget.";
    }

    if (lower.includes("fraud")) {
      return "If you notice a suspicious transaction, immediately review it in Fraud Detection and contact your bank through official channels.";
    }

    return "I can help you with balances, transactions, spending, transfers, loans and general financial guidance.";
  };

  const sendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const userMessage = message.trim();

    setMessages((previous) => [
      ...previous,
      {
        sender: "user",
        text: userMessage,
      },
      {
        sender: "bot",
        text: getResponse(userMessage),
      },
    ]);

    setMessage("");
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: "Hello! I'm your SmartBank AI assistant. How can I help you today?",
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-5xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="AI Chatbot"
          description="Ask questions about your banking and finances."
        />

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Chat Header */}

          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center">
                <FaRobot />
              </div>

              <div>

                <h2 className="font-bold">
                  SmartBank AI
                </h2>

                <p className="text-xs text-blue-200">
                  Financial Assistant • Online
                </p>

              </div>

            </div>

            <button
              onClick={clearChat}
              className="p-3 rounded-xl hover:bg-white/10"
              title="Clear chat"
            >
              <FaTrash />
            </button>

          </div>

          {/* Messages */}

          <div className="h-[500px] overflow-y-auto p-5 space-y-5">

            {messages.map((item, index) => (

              <div
                key={index}
                className={`flex gap-3 ${
                  item.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                {item.sender === "bot" && (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <FaRobot />
                  </div>
                )}

                <div
                  className={`max-w-[75%] p-4 rounded-2xl text-sm leading-6 ${
                    item.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-700 rounded-bl-none"
                  }`}
                >
                  {item.text}
                </div>

                {item.sender === "user" && (
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <FaUser />
                  </div>
                )}

              </div>

            ))}

          </div>

          {/* Input */}

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-100 p-4 flex gap-3"
          >

            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your financial question..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center"
            >
              <FaPaperPlane />
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPaperPlane,
  FaRobot,
  FaArrowLeft,
} from "react-icons/fa";

export default function AIChatbot() {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your Smart Banking AI Assistant. How can I help you today?",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message,
    };

    const aiMessage = {
      sender: "ai",
      text: "Thank you for your question. This is currently a demo AI response. AI integration can be connected to the backend later.",
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
      aiMessage,
    ]);

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-5 lg:p-8">

      {/* Back Button */}

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-blue-600 font-medium mb-6 hover:text-blue-800 transition"
      >
        <FaArrowLeft />
        Back to Dashboard
      </button>

      <div className="max-w-5xl mx-auto">

        {/* Header */}

        <div className="flex items-center gap-4">

          <div className="bg-blue-600 text-white p-4 rounded-2xl">
            <FaRobot size={25} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              AI Banking Assistant
            </h1>

            <p className="text-slate-500">
              Ask questions about your banking and finances.
            </p>
          </div>

        </div>

        {/* Chat Box */}

        <div className="bg-white shadow rounded-2xl border border-slate-200 mt-8 h-[500px] flex flex-col overflow-hidden">

          {/* Messages */}

          <div className="flex-1 p-6 overflow-y-auto space-y-4">

            {messages.map((item, index) => (

              <div
                key={index}
                className={`max-w-[75%] p-4 rounded-2xl ${
                  item.sender === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.text}
              </div>

            ))}

          </div>

          {/* Input */}

          <div className="border-t border-slate-200 p-4 flex gap-3">

            <input
              type="text"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
              placeholder="Ask something about your finances..."
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl transition"
            >
              <FaPaperPlane />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
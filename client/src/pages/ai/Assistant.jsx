
import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Trash2,
  LoaderCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

const SUGGESTIONS = [
  "Explain the employee leave workflow.",
  "How does attendance check-in work?",
  "Explain the payroll process.",
  "What is the role of HR in HCM?",
];

function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I'm your HCM Lite AI Assistant. I can help explain HR workflows, attendance, leave management, and payroll concepts. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function handleSend(customMessage) {
    const message = (customMessage ?? input).trim();

    if (!message || loading) return;

    if (message.length > 2000) {
      setError("Message cannot exceed 2000 characters.");
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: message,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/ai-assistant/chat", {
        message,
      });

      const reply = response.data?.data?.reply;
      const responseMode = response.data?.data?.mode;

      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Assistant returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: reply,
        },
      ]);

      setMode(responseMode || "unknown");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Unable to connect to AI Assistant.";

      setError(errorMessage);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleSend();
  }

  function handleClear() {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Conversation cleared. How can I help you with HCM Lite?",
      },
    ]);

    setError("");
    setMode(null);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto max-w-6xl p-4 md:p-8">
          {/* Page Heading */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Sparkles size={16} />
                Intelligent HR Support
              </div>

              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                AI Assistant
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Ask questions about HR, attendance, leave and payroll.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Clear Chat
            </button>
          </div>

          {/* Chat Container */}
          <div className="flex h-[calc(100vh-230px)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Bot size={23} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    HCM Assistant
                  </h2>
                  <p className="text-xs text-emerald-600">
                    Ready to help
                  </p>
                </div>
              </div>

              {mode && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    mode === "ai"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {mode === "ai" ? "AI Mode" : "Fallback Mode"}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-4 md:p-6">
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Bot size={19} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm md:max-w-[75%] ${
                        isUser
                          ? "rounded-tr-sm bg-blue-600 text-white"
                          : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    {isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                        <User size={19} />
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Bot size={19} />
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Suggestions */}
            {messages.length === 1 && !loading && (
              <div className="border-t border-slate-100 px-4 pt-4">
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  TRY ASKING
                </p>

                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSend(suggestion)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 bg-white p-4"
            >
              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask something about HCM..."
                  rows={1}
                  maxLength={2000}
                  disabled={loading}
                  className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label="Send message"
                >
                  {loading ? (
                    <LoaderCircle size={19} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 px-1">
                <p className="text-xs text-slate-400">
                  Enter to send · Shift + Enter for new line
                </p>

                <p className="text-xs text-slate-400">
                  {input.length}/2000
                </p>
              </div>
            </form>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <MessageSquare size={15} className="mt-0.5 shrink-0" />
            <p>
              AI Assistant provides general HR guidance only. Company-specific
              employee, attendance, leave and payroll records are not connected.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Assistant;

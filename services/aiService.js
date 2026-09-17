// Single shared AI service. Every AI-backed route goes through here so
// there is one place that decides whether AI is configured, one place
// that talks to the provider, and one place to swap providers later.
//
// AI_API_KEY / AI_MODEL are read from process.env only - this file never
// runs in the browser, and the key is never sent to the frontend.
import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";

export const isAIConfigured = () => {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim());
};

let client = null;
const getClient = () => {
  if (!isAIConfigured()) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.AI_API_KEY.trim() });
  }
  return client;
};

const getModel = () => {
  return process.env.AI_MODEL && process.env.AI_MODEL.trim() ? process.env.AI_MODEL.trim() : DEFAULT_MODEL;
};

// Low-level call to the configured provider. Returns plain text.
// Throws if AI is not configured or the provider call fails - callers
// (getFinancialAdvice / chatWithAI) are responsible for turning that into
// a user-facing message instead of a raw crash.
const callAIProvider = async (systemPrompt, userPrompt) => {
  const openai = getClient();
  if (!openai) {
    throw new Error("AI provider is not configured.");
  }

  const completion = await openai.chat.completions.create({
    model: getModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 700,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("AI provider returned an empty response.");
  }
  return text;
};

// Formats the user's real MongoDB financial snapshot into a compact,
// factual context block. Only fields that were actually passed in are
// included - nothing here is invented.
const buildFinancialContext = (data) => {
  const lines = [
    `Total balance across all accounts: ₹${data.totalBalance}`,
    `Income this month: ₹${data.totalIncome}`,
    `Expenses this month: ₹${data.totalExpenses}`,
    `Savings this month: ₹${data.totalSavings}`,
    `Spending by category this month: ${JSON.stringify(data.spendingByCategory || [])}`,
    `Active budgets this month: ${JSON.stringify(data.budgets || [])}`,
    `Loans: ${JSON.stringify(data.loans || [])}`,
    `Most recent transactions: ${JSON.stringify(data.recentTransactions || [])}`,
  ];
  return lines.join("\n");
};

const ADVISOR_SYSTEM_PROMPT = `You are a financial advisor embedded in a banking app.
You will be given ONE user's real financial data from their bank account.
Use ONLY the data provided - never invent balances, transactions, or numbers that are not present.
If a section has no relevant data, say so briefly instead of guessing.
Structure your response with these exact section headers, each on its own line:

Financial Summary
Spending Insights
Budget Insights
Savings Suggestions
General Recommendations

Keep each section to 2-4 concise sentences or short bullet points. Do not give investment, tax, or legal advice - keep it to budgeting and saving habits based on the data given.`;

const CHATBOT_SYSTEM_PROMPT = `You are a helpful banking assistant embedded in a banking app.
You will be given ONE user's real financial data from their bank account, followed by their question.
Answer using ONLY the data provided. If the data doesn't contain enough information to answer, say so clearly instead of guessing or inventing numbers.
You cannot perform any banking actions (you cannot transfer money, credit/debit accounts, approve loans, or change anything) - if asked to do so, explain that you can only provide information, and the user should use the relevant page in the app.
Keep answers concise and directly address the question.`;

export const getFinancialAdvice = async (financialData) => {
  if (!isAIConfigured()) {
    return {
      configured: false,
      message: "AI Financial Advisor is currently unavailable because the AI service is not configured.",
    };
  }

  try {
    const advice = await callAIProvider(ADVISOR_SYSTEM_PROMPT, buildFinancialContext(financialData));
    return { configured: true, advice };
  } catch (error) {
    console.error("[AI] getFinancialAdvice failed:", error.message);
    return {
      configured: false,
      message: "AI Financial Advisor is currently unavailable. Please try again later.",
    };
  }
};

export const chatWithAI = async (message, financialData) => {
  if (!isAIConfigured()) {
    return {
      configured: false,
      message: "The AI Chatbot is currently unavailable because the AI service is not configured.",
    };
  }

  try {
    const userPrompt = `${buildFinancialContext(financialData)}\n\nUser question: ${message}`;
    const reply = await callAIProvider(CHATBOT_SYSTEM_PROMPT, userPrompt);
    return { configured: true, reply };
  } catch (error) {
    console.error("[AI] chatWithAI failed:", error.message);
    return {
      configured: false,
      message: "The AI Chatbot is currently unavailable. Please try again later.",
    };
  }
};
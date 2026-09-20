// Single shared AI service using Ollama.
// Every AI-backed route goes through this file.
//
// Ollama runs locally and exposes an HTTP API.
// The AI model is never called directly from the frontend.

const DEFAULT_MODEL = "llama3.2";
const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export const isAIConfigured = () => {
  return true;
};

const getModel = () => {
  return process.env.OLLAMA_MODEL?.trim() || DEFAULT_MODEL;
};

const getOllamaUrl = () => {
  return (
    process.env.OLLAMA_BASE_URL?.trim() ||
    DEFAULT_OLLAMA_URL
  ).replace(/\/$/, "");
};

// Low-level call to Ollama.
// Returns plain text.
const callAIProvider = async (systemPrompt, userPrompt) => {
  const ollamaUrl = getOllamaUrl();

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      stream: false,
      options: {
        temperature: 0.4,
        num_predict: 700,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  const text = data?.message?.content?.trim();

  if (!text) {
    throw new Error("Ollama returned an empty response.");
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
    `Spending by category this month: ${JSON.stringify(
      data.spendingByCategory || []
    )}`,
    `Active budgets this month: ${JSON.stringify(
      data.budgets || []
    )}`,
    `Loans: ${JSON.stringify(data.loans || [])}`,
    `Most recent transactions: ${JSON.stringify(
      data.recentTransactions || []
    )}`,
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

Keep each section to 2-4 concise sentences or short bullet points.

Do not give investment, tax, or legal advice.

Keep recommendations focused on budgeting, spending, and saving habits based only on the provided data.`;

const CHATBOT_SYSTEM_PROMPT = `You are a helpful banking assistant embedded in a banking app.

You will be given ONE user's real financial data from their bank account, followed by their question.

Answer using ONLY the data provided.

If the data doesn't contain enough information to answer, say so clearly instead of guessing or inventing numbers.

You cannot perform any banking actions.

You cannot transfer money, credit/debit accounts, approve loans, or change anything.

If asked to perform a banking action, explain that you can only provide information and that the user should use the relevant page in the app.

Keep answers concise and directly address the question.`;

export const getFinancialAdvice = async (financialData) => {
  try {
    const advice = await callAIProvider(
      ADVISOR_SYSTEM_PROMPT,
      buildFinancialContext(financialData)
    );

    return {
      configured: true,
      advice,
    };
  } catch (error) {
    console.error(
      "[AI] getFinancialAdvice failed:",
      error.message
    );

    return {
      configured: false,
      message:
        "AI Financial Advisor is currently unavailable. Please make sure Ollama is running and the AI model is installed.",
    };
  }
};

export const chatWithAI = async (message, financialData) => {
  try {
    const userPrompt = `${buildFinancialContext(
      financialData
    )}\n\nUser question: ${message}`;

    const reply = await callAIProvider(
      CHATBOT_SYSTEM_PROMPT,
      userPrompt
    );

    return {
      configured: true,
      reply,
    };
  } catch (error) {
    console.error(
      "[AI] chatWithAI failed:",
      error.message
    );

    return {
      configured: false,
      message:
        "The AI Chatbot is currently unavailable. Please make sure Ollama is running and the AI model is installed.",
    };
  }
};
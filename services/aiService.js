import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.8-flash";

const getApiKey = () => {
  return process.env.GEMINI_API_KEY?.trim() || "";
};

const getModel = () => {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
};

export const isAIConfigured = () => {
  return Boolean(getApiKey());
};

const createGeminiClient = () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({
    apiKey,
  });
};

const callGemini = async (systemInstruction, userPrompt) => {
  const client = createGeminiClient();

  const interaction = await client.interactions.create({
    model: getModel(),
    system_instruction: systemInstruction,
    input: userPrompt,
  });

  const text = interaction?.output_text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
};

const buildFinancialContext = (data) => {
  const lines = [
    `Total balance across all accounts: ₹${data.totalBalance ?? 0}`,
    `Income this month: ₹${data.totalIncome ?? 0}`,
    `Expenses this month: ₹${data.totalExpenses ?? 0}`,
    `Savings this month: ₹${data.totalSavings ?? 0}`,
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

const ADVISOR_SYSTEM_PROMPT = `
You are a financial advisor embedded inside a banking application.

You will receive financial information belonging to ONE authenticated banking user.

Use ONLY the financial data provided to you.

Never invent:
- balances
- transactions
- income
- expenses
- budgets
- loans
- savings
- dates
- categories
- financial numbers

If a section does not contain enough information, clearly say that there is not enough available data instead of guessing.

Your purpose is to help the user understand their budgeting, spending and saving habits.

Do not provide:
- investment advice
- tax advice
- legal advice
- instructions to buy or sell financial products

Structure your response using these exact section headers:

Financial Summary

Spending Insights

Budget Insights

Savings Suggestions

General Recommendations

Each section should contain 2-4 concise sentences or short bullet points.

Keep the response clear, practical and easy for a banking user to understand.

Never claim that you performed a banking transaction or changed any account.
`;

const CHATBOT_SYSTEM_PROMPT = `
You are a helpful banking assistant inside a banking application.

You will receive financial information belonging to ONE authenticated banking user.

Answer questions using ONLY the information provided in the financial context.

Never invent:
- balances
- transactions
- income
- expenses
- budgets
- loans
- savings
- dates
- categories
- financial numbers

If the provided data is not enough to answer a question, clearly say that the information is not available.

You can explain financial information and provide general budgeting, spending and saving guidance.

Do not provide:
- investment advice
- tax advice
- legal advice

You cannot perform banking actions.

You cannot:
- transfer money
- credit an account
- debit an account
- create an account
- close an account
- approve a loan
- reject a loan
- change a user's profile
- change banking settings

If the user asks you to perform a banking action, explain that you can only provide information and that the user should use the appropriate section of the banking application.

Keep answers concise, clear and directly related to the user's question.
`;

export const getFinancialAdvice = async (financialData) => {
  try {
    if (!isAIConfigured()) {
      return {
        configured: false,
        message:
          "AI Financial Advisor is not configured. Please configure the Gemini API in the backend.",
      };
    }

    const financialContext = buildFinancialContext(financialData);

    const advice = await callGemini(
      ADVISOR_SYSTEM_PROMPT,
      financialContext
    );

    return {
      configured: true,
      advice,
    };
  } catch (error) {
    console.error(
      "[AI] getFinancialAdvice failed:",
      error?.message || error
    );

    return {
      configured: false,
      message:
        "AI Financial Advisor is currently unavailable. Please try again later.",
    };
  }
};

export const chatWithAI = async (message, financialData) => {
  try {
    if (!isAIConfigured()) {
      return {
        configured: false,
        message:
          "AI Chatbot is not configured. Please configure the Gemini API in the backend.",
      };
    }

    const financialContext = buildFinancialContext(financialData);

    const userPrompt = `
Financial context for the authenticated user:

${financialContext}

User question:

${message}
`;

    const reply = await callGemini(
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
      error?.message || error
    );

    return {
      configured: false,
      message:
        "AI Chatbot is currently unavailable. Please try again later.",
    };
  }
};

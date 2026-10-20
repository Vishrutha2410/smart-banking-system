import Groq from "groq-sdk";

const DEFAULT_MODEL = "openai/gpt-oss-20b";

const getApiKey = () => {
  return process.env.GROQ_API_KEY?.trim() || "";
};

const getModel = () => {
  return (
    process.env.GROQ_MODEL?.trim() ||
    DEFAULT_MODEL
  );
};

export const isAIConfigured = () => {
  return Boolean(getApiKey());
};

const createGroqClient = () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  return new Groq({
    apiKey,
  });
};

const callGroq = async (
  systemInstruction,
  userPrompt
) => {
  const client = createGroqClient();

  const completion =
    await client.chat.completions.create({
      model: getModel(),

      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],

      temperature: 0.3,
      max_tokens: 1200,
    });

  const text =
    completion?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error(
      "Groq returned an empty response."
    );
  }

  return text;
};


/* ======================================================
   FINANCIAL CONTEXT
====================================================== */

const buildFinancialContext = (data) => {
  const lines = [
    `Total balance across all accounts: ₹${
      data.totalBalance ?? 0
    }`,

    `Income this month: ₹${
      data.totalIncome ?? 0
    }`,

    `Expenses this month: ₹${
      data.totalExpenses ?? 0
    }`,

    `Savings this month: ₹${
      data.totalSavings ?? 0
    }`,

    `Spending by category this month: ${JSON.stringify(
      data.spendingByCategory || []
    )}`,

    `Active budgets this month: ${JSON.stringify(
      data.budgets || []
    )}`,

    `Loans: ${JSON.stringify(
      data.loans || []
    )}`,

    `Most recent transactions: ${JSON.stringify(
      data.recentTransactions || []
    )}`,
  ];

  return lines.join("\n");
};


/* ======================================================
   FINANCIAL ADVISOR PROMPT
====================================================== */

const ADVISOR_SYSTEM_PROMPT = `
You are the AI Financial Advisor inside SmartBank,
a banking application.

You will receive financial information belonging to
ONE authenticated banking user.

Use ONLY the financial data provided to you.

Never invent or guess:

- account balances
- transactions
- income
- expenses
- budgets
- loans
- savings
- dates
- categories
- financial numbers

If the provided information is insufficient,
clearly say that there is not enough available data.

Your purpose is to help the user understand:

- spending
- budgeting
- saving
- income versus expenses
- loan information
- financial habits

Provide practical and easy-to-understand guidance.

Do NOT provide:

- investment advice
- tax advice
- legal advice
- instructions to buy or sell financial products
- guaranteed financial outcomes

You are an informational financial assistant,
not a licensed financial advisor.

Never claim that you performed a banking transaction.

Never claim that you changed an account balance.

Use these exact section headings:

Financial Summary

Spending Insights

Budget Insights

Savings Suggestions

General Recommendations

Each section should contain 2-4 concise
sentences or bullet points.

Keep the response clear, practical and concise.
`;


/* ======================================================
   CHATBOT PROMPT
====================================================== */

const CHATBOT_SYSTEM_PROMPT = `
You are SmartBank AI Chatbot,
a helpful banking assistant inside a banking application.

You will receive financial information belonging to
ONE authenticated banking user.

Answer questions using ONLY the information
provided in the financial context.

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

If the information is not available,
say that the information is not available.

You can:

- explain the user's financial information
- explain spending
- explain budgets
- explain savings
- explain loans
- provide general budgeting guidance
- answer questions about the banking application

You cannot perform banking actions.

You cannot:

- transfer money
- credit an account
- debit an account
- create an account
- close an account
- approve a loan
- reject a loan
- change profile information
- change banking settings

If the user asks you to perform a banking action,
tell them that you can only provide information
and that they should use the appropriate section
of the SmartBank application.

Never claim that an action was performed.

Keep responses concise, clear and directly related
to the user's question.
`;


/* ======================================================
   FINANCIAL ADVISOR
====================================================== */

export const getFinancialAdvice = async (
  financialData
) => {
  try {
    if (!isAIConfigured()) {
      return {
        configured: false,
        message:
          "AI Financial Advisor is not configured. Please configure the Groq API in the backend.",
      };
    }

    const financialContext =
      buildFinancialContext(financialData);

    const advice = await callGroq(
      ADVISOR_SYSTEM_PROMPT,
      `
Financial information for the authenticated user:

${financialContext}

Analyze this information and provide
personalized financial guidance.
`
    );

    return {
      configured: true,
      advice,
    };
  } catch (error) {
    console.error(
      "[AI] getFinancialAdvice failed:",
      error?.response?.data ||
        error?.message ||
        error
    );

    return {
      configured: false,
      message:
        "AI Financial Advisor is currently unavailable. Please try again later.",
    };
  }
};


/* ======================================================
   CHATBOT
====================================================== */

export const chatWithAI = async (
  message,
  financialData
) => {
  try {
    if (!isAIConfigured()) {
      return {
        configured: false,
        message:
          "AI Chatbot is not configured. Please configure the Groq API in the backend.",
      };
    }

    const financialContext =
      buildFinancialContext(financialData);

    const userPrompt = `
Financial context for the authenticated user:

${financialContext}

User question:

${message}
`;

    const reply = await callGroq(
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
      error?.response?.data ||
        error?.message ||
        error
    );

    return {
      configured: false,
      message:
        "AI Chatbot is currently unavailable. Please try again later.",
    };
  }
};
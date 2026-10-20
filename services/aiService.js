import Groq from "groq-sdk";

// ======================================================
// GROQ CONFIGURATION
// ======================================================

const getApiKey = () =>
  process.env.GROQ_API_KEY?.trim() || "";

const getModel = () =>
  process.env.GROQ_MODEL?.trim() ||
  "openai/gpt-oss-20b";

export const isAIConfigured = () => {
  return Boolean(getApiKey());
};

// ======================================================
// GROQ CLIENT
// ======================================================

const createGroqClient = () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured."
    );
  }

  return new Groq({
    apiKey,
  });
};

// ======================================================
// CALL GROQ
// ======================================================

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

      temperature: 0.2,
      max_completion_tokens: 700,
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

// ======================================================
// BUILD FINANCIAL CONTEXT
// ======================================================

const buildFinancialContext = (data) => {
  const user = data.user || {};

  const accountLines =
    data.accounts?.length > 0
      ? data.accounts
          .map(
            (account, index) =>
              `${index + 1}. Bank: ${
                account.bankName
              }, Type: ${
                account.accountType
              }, Account Number: ${
                account.accountNumber
              }, Balance: ₹${
                account.balance
              }, Status: ${
                account.status
              }`
          )
          .join("\n")
      : "No bank accounts.";

  const budgetLines =
    data.budgets?.length > 0
      ? data.budgets
          .map(
            (budget) =>
              `${budget.category}: monthly limit ₹${Number(
                budget.monthlyLimit || 0
              )}`
          )
          .join("\n")
      : "No active budgets.";

  const loanLines =
    data.loans?.length > 0
      ? data.loans
          .map(
            (loan) =>
              `Loan type: ${
                loan.loanType
              }, Amount: ₹${Number(
                loan.amount || 0
              )}, Interest: ${
                loan.interestRate
              }%, Monthly payment: ₹${Number(
                loan.monthlyPayment || 0
              )}, Status: ${
                loan.status
              }`
          )
          .join("\n")
      : "No loans.";

  const transactionLines =
    data.recentTransactions?.length > 0
      ? data.recentTransactions
          .slice(0, 10)
          .map(
            (transaction) =>
              `${transaction.type} | ${
                transaction.category ||
                "Other"
              } | ₹${Number(
                transaction.amount || 0
              )} | ${
                transaction.description ||
                ""
              }`
          )
          .join("\n")
      : "No recent transactions.";

  return `
USER PROFILE
Name: ${user.name || "Not available"}
Email: ${user.email || "Not available"}
Phone: ${user.phone || "Not available"}
Customer Type: ${
    user.customerType || "personal"
  }

ACCOUNT INFORMATION
Number of accounts: ${data.accountCount || 0}
Total balance: ₹${Number(
    data.totalBalance || 0
  ).toLocaleString("en-IN")}

Accounts:
${accountLines}

CURRENT MONTH FINANCIAL SUMMARY
Income: ₹${Number(
    data.totalIncome || 0
  ).toLocaleString("en-IN")}

Expenses: ₹${Number(
    data.totalExpenses || 0
  ).toLocaleString("en-IN")}

Savings: ₹${Number(
    data.totalSavings || 0
  ).toLocaleString("en-IN")}

SPENDING BY CATEGORY
${JSON.stringify(
  data.spendingByCategory || [],
  null,
  2
)}

LARGEST EXPENSE
${
  data.largestExpense
    ? `${data.largestExpense.category}: ₹${Number(
        data.largestExpense.total || 0
      ).toLocaleString("en-IN")}`
    : "No expenses recorded this month."
}

BUDGETS
${budgetLines}

LOANS
${loanLines}

RECENT TRANSACTIONS
${transactionLines}
`;
};

// ======================================================
// FINANCIAL ADVISOR PROMPT
// ======================================================

const ADVISOR_SYSTEM_PROMPT = `
You are the SmartBank AI Financial Advisor.

You are assisting ONE authenticated banking user.

You have been given that user's actual profile,
account and financial information.

IMPORTANT RULES:

1. Use ONLY the information supplied in the context.
2. Never invent balances, transactions, loans,
   account numbers, dates or financial amounts.
3. You may answer questions about the user's:
   - name
   - email
   - accounts
   - balances
   - spending
   - savings
   - budgets
   - loans
   - transactions
4. If the information is genuinely not available,
   say that it is not available.
5. Never claim to perform a banking transaction.
6. Never transfer, credit, debit or modify money.
7. Do not provide investment, tax or legal advice.
8. Keep answers simple and practical.

For financial advice, explain the user's actual
financial situation using the supplied data.
`;

// ======================================================
// CHATBOT PROMPT
// ======================================================

const CHATBOT_SYSTEM_PROMPT = `
You are the SmartBank AI Chatbot.

You are a personal banking assistant for ONE
authenticated user.

The financial context contains real information
belonging only to that logged-in user.

You MUST answer questions using the supplied context.

You CAN answer:

- What is my name?
- What is my email?
- How many accounts do I have?
- What accounts do I have?
- What type of accounts do I have?
- What is my balance?
- What is the balance of a particular account?
- How much did I spend?
- What is my largest expense?
- How much did I save?
- What are my budgets?
- What are my loans?
- What are my recent transactions?
- General questions about the user's financial data.

IMPORTANT:

If the user asks "what is my name", use the
USER PROFILE Name field.

If the user asks "how many accounts do I have",
use the ACCOUNT INFORMATION Number of accounts field.

If the user asks about a specific account, use
the account information supplied in the context.

If the user asks for their balance, use the actual
balance from the supplied account information.

Never say that you do not have access to information
when that information is actually present in the
financial context.

Never invent missing information.

Do not expose complete account numbers.
Only use the masked account number supplied.

Do not expose passwords, transaction PINs,
authentication tokens or other secrets.

You cannot perform banking actions.

You cannot:
- transfer money
- credit money
- debit money
- create an account
- close an account
- approve a loan
- reject a loan
- change profile information
- change banking settings

If asked to perform one of these actions, explain
that you can provide information but the action
must be completed from the appropriate SmartBank
page.

Keep answers concise and easy to understand.
`;

// ======================================================
// FINANCIAL ADVISOR
// ======================================================

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
Here is the authenticated user's financial
information:

${financialContext}

Provide useful financial guidance based only
on this information.
`
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

// ======================================================
// CHATBOT
// ======================================================

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
AUTHENTICATED USER FINANCIAL CONTEXT:

${financialContext}

USER QUESTION:

${message}

Answer the user's question directly.

If the answer exists in the supplied context,
use it.

Do not say the information is unavailable if
it is present in the context.

Do not invent information that is not present.
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
      error?.message || error
    );

    return {
      configured: false,
      message:
        "AI Chatbot is currently unavailable. Please try again later.",
    };
  }
};
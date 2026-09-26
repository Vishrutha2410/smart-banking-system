import api from "./api";

/*
 * Get actual expenses.
 */
export const getExpenses = async () => {
  const { data } =
    await api.get("/expenses");

  return Array.isArray(
    data?.expenses
  )
    ? data.expenses
    : [];
};

/*
 * Create an actual expense.
 */
export const createExpense = async (
  expenseData
) => {
  const { data } =
    await api.post(
      "/expenses",
      expenseData
    );

  return data.expense;
};
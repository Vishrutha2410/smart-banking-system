import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { getReports } from "../services/reportsService";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const now = new Date();

const Reports = () => {
  const [period, setPeriod] = useState("monthly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = async () => {
    setStatus("loading");

    try {
      const params = { period };

      if (period === "monthly") {
        params.month = month;
        params.year = year;
      } else if (period === "yearly") {
        params.year = year;
      } else if (period === "custom") {
        if (!startDate || !endDate) {
          setStatus("success");
          setData(null);
          return;
        }

        params.startDate = startDate;
        params.endDate = endDate;
      }

      const res = await getReports(params);

      setData(res);
      setStatus("success");
    } catch (err) {
      console.error("Failed to generate report:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, month, year]);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    load();
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exportCSV = () => {
    if (!data?.transactions?.length) return;

    const header =
      "Date,Description,Category,Type,Amount,Reference\n";

    const rows = data.transactions
      .map(
        (t) =>
          `"${new Date(t.date).toLocaleDateString()}","${
            t.description || ""
          }","${t.category || ""}","${t.type || ""}",${
            t.amount || 0
          },"${t.referenceNumber || ""}"`
      )
      .join("\n");

    const blob = new Blob(
      [header + rows],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `report-${period}.csv`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  const exportExcel = () => {
    if (!data) return;

    try {
      const workbook =
        XLSX.utils.book_new();

      // ========================================================
      // SUMMARY SHEET
      // ========================================================

      const summaryData = [
        {
          Report: "Smart Banking Report",
          Value: "",
        },
        {
          Period:
            period === "monthly"
              ? `Monthly - ${month}/${year}`
              : period === "yearly"
              ? `Yearly - ${year}`
              : "Custom Range",
          Value:
            period === "custom"
              ? `${startDate || "—"} to ${
                  endDate || "—"
                }`
              : "",
        },
        {
          Metric: "Total Income",
          Value:
            data.totalIncome || 0,
        },
        {
          Metric: "Total Expenses",
          Value:
            data.totalExpenses || 0,
        },
        {
          Metric: "Savings",
          Value:
            data.savings || 0,
        },
        {
          Metric: "Transaction Count",
          Value:
            data.transactionCount || 0,
        },
      ];

      const summarySheet =
        XLSX.utils.json_to_sheet(
          summaryData
        );

      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
      );

      // ========================================================
      // CATEGORY BREAKDOWN SHEET
      // ========================================================

      const categoryData =
        (data.categoryBreakdown || []).map(
          (item) => ({
            Category:
              item.category || "—",

            Amount:
              Number(item.total || 0),
          })
        );

      const categorySheet =
        XLSX.utils.json_to_sheet(
          categoryData.length
            ? categoryData
            : [
                {
                  Category:
                    "No expense data",
                  Amount: 0,
                },
              ]
        );

      XLSX.utils.book_append_sheet(
        workbook,
        categorySheet,
        "Category Breakdown"
      );

      // ========================================================
      // TRANSACTIONS SHEET
      // ========================================================

      const transactionData =
        (data.transactions || []).map(
          (transaction) => ({
            Date: transaction.date
              ? new Date(
                  transaction.date
                ).toLocaleDateString()
              : "—",

            Description:
              transaction.description ||
              "—",

            Category:
              transaction.category ||
              "—",

            Type:
              transaction.type ||
              "—",

            Amount:
              Number(
                transaction.amount || 0
              ),

            Reference:
              transaction.referenceNumber ||
              "—",
          })
        );

      const transactionSheet =
        XLSX.utils.json_to_sheet(
          transactionData.length
            ? transactionData
            : [
                {
                  Date: "—",
                  Description:
                    "No transactions",
                  Category: "—",
                  Type: "—",
                  Amount: 0,
                  Reference: "—",
                },
              ]
        );

      XLSX.utils.book_append_sheet(
        workbook,
        transactionSheet,
        "Transactions"
      );

      // ========================================================
      // COLUMN WIDTHS
      // ========================================================

      summarySheet["!cols"] = [
        { wch: 28 },
        { wch: 25 },
      ];

      categorySheet["!cols"] = [
        { wch: 30 },
        { wch: 18 },
      ];

      transactionSheet["!cols"] = [
        { wch: 15 },
        { wch: 35 },
        { wch: 20 },
        { wch: 15 },
        { wch: 18 },
        { wch: 25 },
      ];

      // ========================================================
      // FILE NAME
      // ========================================================

      let reportName = "report";

      if (period === "monthly") {
        reportName =
          `report-${year}-${String(
            month
          ).padStart(2, "0")}`;
      } else if (period === "yearly") {
        reportName =
          `report-${year}`;
      } else if (period === "custom") {
        reportName =
          `report-${startDate || "start"}-${
            endDate || "end"
          }`;
      }

      XLSX.writeFile(
        workbook,
        `${reportName}.xlsx`
      );
    } catch (error) {
      console.error(
        "Excel export failed:",
        error
      );

      alert(
        "Unable to export the Excel report. Please try again."
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Reports
        </h1>

        <p className="text-sm text-slate-500">
          Generated from your real transaction history.
        </p>
      </div>


      {/* ========================================================
          FILTERS
      ======================================================== */}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">

        {/* PERIOD */}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Period
          </label>

          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="monthly">
              Monthly
            </option>

            <option value="yearly">
              Yearly
            </option>

            <option value="custom">
              Custom Range
            </option>
          </select>
        </div>


        {/* MONTHLY */}

        {period === "monthly" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Month
              </label>

              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) =>
                  setMonth(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Year
              </label>

              <input
                type="number"
                value={year}
                onChange={(e) =>
                  setYear(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}


        {/* YEARLY */}

        {period === "yearly" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Year
            </label>

            <input
              type="number"
              value={year}
              onChange={(e) =>
                setYear(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}


        {/* CUSTOM RANGE */}

        {period === "custom" && (
          <form
            onSubmit={
              handleCustomSearch
            }
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Apply
            </button>
          </form>
        )}


        {/* ======================================================
            EXPORT BUTTONS
        ====================================================== */}

        {data?.transactions?.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-2">

            {/* CSV */}

            <button
              type="button"
              onClick={exportCSV}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Export CSV
            </button>


            {/* EXCEL */}

            <button
              type="button"
              onClick={exportExcel}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Export Excel
            </button>

          </div>
        )}

      </div>


      {/* ========================================================
          LOADING
      ======================================================== */}

      {status === "loading" && (
        <Loader label="Generating report..." />
      )}


      {/* ========================================================
          ERROR
      ======================================================== */}

      {status === "error" && (
        <ErrorState onRetry={load} />
      )}


      {/* ========================================================
          CUSTOM RANGE EMPTY
      ======================================================== */}

      {status === "success" &&
        !data && (
          <EmptyState
            title="Select a date range"
            message="Choose a start and end date to generate a custom report."
          />
        )}


      {/* ========================================================
          REPORT DATA
      ======================================================== */}

      {status === "success" &&
        data && (
          <>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">

              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Income
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-600">
                  ₹
                  {Number(
                    data.totalIncome || 0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>


              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Expenses
                </p>

                <p className="mt-1 text-xl font-bold text-red-500">
                  ₹
                  {Number(
                    data.totalExpenses ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>


              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Savings
                </p>

                <p className="mt-1 text-xl font-bold text-brand-700">
                  ₹
                  {Number(
                    data.savings || 0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>


              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Transactions
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {data.transactionCount ||
                    0}
                </p>
              </div>

            </div>


            {/* ==================================================
                CATEGORY BREAKDOWN
            ================================================== */}

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

              <h2 className="mb-3 font-semibold text-slate-900">
                Category Breakdown
              </h2>

              {!data.categoryBreakdown ||
              data.categoryBreakdown.length ===
                0 ? (
                <EmptyState
                  title="No expense data for this period"
                />
              ) : (
                <ul className="space-y-2 text-sm">

                  {data.categoryBreakdown.map(
                    (c) => (
                      <li
                        key={c.category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-slate-600">
                          {c.category}
                        </span>

                        <span className="font-medium text-slate-900">
                          ₹
                          {Number(
                            c.total || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </li>
                    )
                  )}

                </ul>
              )}

            </div>


            {/* ==================================================
                TRANSACTION TABLE
            ================================================== */}

            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">

              <table className="min-w-full divide-y divide-slate-100 text-sm">

                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

                  <tr>

                    <th className="px-4 py-3">
                      Date
                    </th>

                    <th className="px-4 py-3">
                      Description
                    </th>

                    <th className="px-4 py-3">
                      Category
                    </th>

                    <th className="px-4 py-3">
                      Type
                    </th>

                    <th className="px-4 py-3 text-right">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      Reference
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {!data.transactions ||
                  data.transactions.length ===
                    0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-slate-400"
                      >
                        No transactions yet
                      </td>
                    </tr>

                  ) : (

                    data.transactions.map(
                      (t) => (
                        <tr key={t._id}>

                          <td className="px-4 py-3 text-slate-500">
                            {new Date(
                              t.date
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-4 py-3 text-slate-800">
                            {t.description ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {t.category ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {t.type || "—"}
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            ₹
                            {Number(
                              t.amount || 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-500">
                            {t.referenceNumber ||
                              "—"}
                          </td>

                        </tr>
                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </>
        )}

    </div>
  );
};

export default Reports;

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

import {
  getReports,
  getBankStatement,
} from "../services/reportsService";

import { getAccounts } from "../services/accountService";

import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const now = new Date();

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(
    "en-IN"
  );
};

const getPeriodLabel = (
  period,
  month,
  year,
  startDate,
  endDate
) => {
  if (period === "monthly") {
    return `Monthly - ${month}/${year}`;
  }

  if (period === "yearly") {
    return `Yearly - ${year}`;
  }

  return `Custom - ${startDate || "—"} to ${
    endDate || "—"
  }`;
};

const Reports = () => {
  /*
  ==========================================================
  REPORT STATE
  ==========================================================
  */

  const [period, setPeriod] =
    useState("monthly");

  const [month, setMonth] =
    useState(now.getMonth() + 1);

  const [year, setYear] =
    useState(now.getFullYear());

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [data, setData] =
    useState(null);

  const [status, setStatus] =
    useState("loading");

  /*
  ==========================================================
  STATEMENT STATE
  ==========================================================
  */

  const [statementAccountId, setStatementAccountId] =
    useState("");

  const [statementLoading, setStatementLoading] =
    useState(false);

    const [accounts, setAccounts] = useState([]);

  /*
  ==========================================================
  LOAD REPORT
  ==========================================================
  */

  const load = async () => {
    setStatus("loading");

    try {
      const params = {
        period,
      };

      if (period === "monthly") {
        params.month = month;
        params.year = year;
      }

      else if (period === "yearly") {
        params.year = year;
      }

      else if (period === "custom") {
        if (!startDate || !endDate) {
          setStatus("success");
          setData(null);
          return;
        }

        params.startDate =
          startDate;

        params.endDate =
          endDate;
      }

      const response =
        await getReports(params);

      setData(response);
      setStatus("success");
    } catch (error) {
      console.error(
        "Failed to generate report:",
        error
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, month, year]);

  useEffect(() => {
  const loadAccounts = async () => {
    try {
      const response = await getAccounts();

      setAccounts(
        Array.isArray(response)
          ? response
          : response?.accounts || []
      );
    } catch (error) {
      console.error(
        "Failed to load accounts:",
        error
      );
    }
  };

  loadAccounts();
}, []);

  /*
  ==========================================================
  CUSTOM SEARCH
  ==========================================================
  */

  const handleCustomSearch = (
    event
  ) => {
    event.preventDefault();

    load();
  };

  /*
  ==========================================================
  CSV EXPORT
  ==========================================================
  */

  const exportCSV = () => {
    if (!data?.transactions?.length) {
      return;
    }

    const header =
      "Date,Description,Category,Type,Amount,Reference,Status\n";

    const rows =
      data.transactions
        .map((transaction) => {
          return [
            formatDate(
              transaction.date
            ),

            transaction.description ||
              "",

            transaction.category ||
              "",

            transaction.type ||
              "",

            Number(
              transaction.amount || 0
            ),

            transaction.referenceNumber ||
              "",

            transaction.status ||
              "",
          ]
            .map(
              (value) =>
                `"${String(
                  value
                ).replaceAll(
                  '"',
                  '""'
                )}"`
            )
            .join(",");
        })
        .join("\n");

    const blob = new Blob(
      [header + rows],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      `report-${period}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    document.body.removeChild(
      anchor
    );

    URL.revokeObjectURL(url);
  };

  /*
  ==========================================================
  NORMAL REPORT EXCEL
  ==========================================================
  */

  const exportExcel = () => {
    if (!data) return;

    try {
      const workbook =
        XLSX.utils.book_new();

      /*
      --------------------------------------------------------
      SUMMARY
      --------------------------------------------------------
      */

      const summaryData = [
        {
          Report:
            "Smart Banking Report",

          Value: "",
        },

        {
          Period:
            getPeriodLabel(
              period,
              month,
              year,
              startDate,
              endDate
            ),

          Value: "",
        },

        {
          Metric:
            "Total Income",

          Value:
            Number(
              data.totalIncome || 0
            ),
        },

        {
          Metric:
            "Total Expenses",

          Value:
            Number(
              data.totalExpenses || 0
            ),
        },

        {
          Metric:
            "Savings",

          Value:
            Number(
              data.savings || 0
            ),
        },

        {
          Metric:
            "Transaction Count",

          Value:
            Number(
              data.transactionCount ||
                0
            ),
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

      /*
      --------------------------------------------------------
      CATEGORY BREAKDOWN
      --------------------------------------------------------
      */

      const categoryData =
        (
          data.categoryBreakdown ||
          []
        ).map((item) => ({
          Category:
            item.category ||
            "General",

          Amount:
            Number(
              item.total || 0
            ),
        }));

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

      /*
      --------------------------------------------------------
      TRANSACTIONS
      --------------------------------------------------------
      */

      const transactionData =
        (
          data.transactions ||
          []
        ).map((transaction) => ({
          Date: formatDate(
            transaction.date
          ),

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
              transaction.amount ||
                0
            ),

          Status:
            transaction.status ||
            "—",

          Reference:
            transaction.referenceNumber ||
            "—",
        }));

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

                  Status: "—",

                  Reference: "—",
                },
              ]
        );

      XLSX.utils.book_append_sheet(
        workbook,
        transactionSheet,
        "Transactions"
      );

      /*
      --------------------------------------------------------
      COLUMN WIDTHS
      --------------------------------------------------------
      */

      summarySheet["!cols"] = [
        {
          wch: 28,
        },
        {
          wch: 25,
        },
      ];

      categorySheet["!cols"] = [
        {
          wch: 30,
        },
        {
          wch: 18,
        },
      ];

      transactionSheet[
        "!cols"
      ] = [
        {
          wch: 15,
        },
        {
          wch: 35,
        },
        {
          wch: 20,
        },
        {
          wch: 15,
        },
        {
          wch: 18,
        },
        {
          wch: 15,
        },
        {
          wch: 28,
        },
      ];

      /*
      --------------------------------------------------------
      FILE NAME
      --------------------------------------------------------
      */

      let reportName =
        "report";

      if (period === "monthly") {
        reportName =
          `report-${year}-${String(
            month
          ).padStart(2, "0")}`;
      }

      else if (
        period === "yearly"
      ) {
        reportName =
          `report-${year}`;
      }

      else {
        reportName =
          `report-${
            startDate || "start"
          }-${
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

  /*
  ==========================================================
  STATEMENT PARAMETERS
  ==========================================================
  */

  const getStatementParams =
    () => {
      const params = {
        period,
      };

      if (period === "monthly") {
        params.month = month;
        params.year = year;
      }

      else if (
        period === "yearly"
      ) {
        params.year = year;
      }

      else if (
        period === "custom"
      ) {
        params.startDate =
          startDate;

        params.endDate =
          endDate;
      }

      if (statementAccountId) {
        params.accountId =
          statementAccountId;
      }

      return params;
    };

  /*
  ==========================================================
  GET STATEMENT
  ==========================================================
  */

  const loadStatement =
    async () => {
      if (
        period === "custom" &&
        (!startDate || !endDate)
      ) {
        alert(
          "Please select the start and end date first."
        );

        return null;
      }

      setStatementLoading(true);

      try {
        const statement =
          await getBankStatement(
            getStatementParams()
          );

        return statement;
      } catch (error) {
        console.error(
          "Bank statement error:",
          error
        );

        alert(
          error?.message ||
            "Unable to generate the bank statement."
        );

        return null;
      } finally {
        setStatementLoading(false);
      }
    };

  /*
  ==========================================================
  BANK STATEMENT EXCEL
  ==========================================================
  */

  const exportBankStatementExcel =
    async () => {
      const statement =
        await loadStatement();

      if (!statement) {
        return;
      }

      try {
        const workbook =
          XLSX.utils.book_new();

        /*
        ------------------------------------------------------
        STATEMENT INFORMATION
        ------------------------------------------------------
        */

        const account =
          statement.accounts?.[0];

        const statementInfo = [
          {
            Field:
              "Bank Statement",

            Value:
              "Smart Banking System",
          },

          {
            Field:
              "Account Holder",

            Value:
              statement.holder?.name ||
              "—",
          },

          {
            Field:
              "Email",

            Value:
              statement.holder?.email ||
              "—",
          },

          {
            Field:
              "Period",

            Value:
              getPeriodLabel(
                period,
                month,
                year,
                startDate,
                endDate
              ),
          },

          {
            Field:
              "Bank",

            Value:
              statement.accounts
                ?.length === 1
                ? account?.bankName ||
                  "—"
                : "Multiple Accounts",
          },

          {
            Field:
              "Account Number",

            Value:
              statement.accounts
                ?.length === 1
                ? account?.accountNumber ||
                  "—"
                : "Multiple Accounts",
          },

          {
            Field:
              "Account Type",

            Value:
              statement.accounts
                ?.length === 1
                ? account?.accountType ||
                  "—"
                : "Multiple Accounts",
          },

          {
            Field:
              "IFSC",

            Value:
              statement.accounts
                ?.length === 1
                ? account?.ifsc ||
                  "—"
                : "Multiple Accounts",
          },

          {
            Field:
              "Total Credits",

            Value:
              Number(
                statement.summary
                  ?.totalCredits || 0
              ),
          },

          {
            Field:
              "Total Debits",

            Value:
              Number(
                statement.summary
                  ?.totalDebits || 0
              ),
          },

          {
            Field:
              "Transactions",

            Value:
              Number(
                statement.summary
                  ?.transactionCount ||
                  0
              ),
          },
        ];

        const infoSheet =
          XLSX.utils.json_to_sheet(
            statementInfo
          );

        XLSX.utils.book_append_sheet(
          workbook,
          infoSheet,
          "Statement Info"
        );

        /*
        ------------------------------------------------------
        ACCOUNT SUMMARY
        ------------------------------------------------------
        */

        const accountSummary =
          (
            statement.accounts ||
            []
          ).map((account) => {
            const balanceInfo =
              statement
                .accountBalances?.[
                String(
                  account._id
                )
              ] || {};

            return {
              Bank:
                account.bankName ||
                "Smart Banking",

              "Account Number":
                account.accountNumber ||
                "—",

              "Account Type":
                account.accountType ||
                "—",

              IFSC:
                account.ifsc ||
                "—",

              "Opening Balance":
                Number(
                  balanceInfo.openingBalance ||
                    0
                ),

              Credits:
                Number(
                  balanceInfo.totalCredits ||
                    0
                ),

              Debits:
                Number(
                  balanceInfo.totalDebits ||
                    0
                ),

              "Closing Balance":
                Number(
                  balanceInfo.closingBalance ||
                    0
                ),
            };
          });

        const accountSheet =
          XLSX.utils.json_to_sheet(
            accountSummary.length
              ? accountSummary
              : [
                  {
                    Bank: "—",
                    "Account Number":
                      "—",
                    "Account Type":
                      "—",
                    IFSC: "—",
                    "Opening Balance":
                      0,
                    Credits: 0,
                    Debits: 0,
                    "Closing Balance":
                      0,
                  },
                ]
          );

        XLSX.utils.book_append_sheet(
          workbook,
          accountSheet,
          "Account Summary"
        );

        /*
        ------------------------------------------------------
        TRANSACTION STATEMENT
        ------------------------------------------------------
        */

        const statementRows =
          (
            statement.transactions ||
            []
          ).map((transaction) => ({
            Date: formatDate(
              transaction.date
            ),

            Bank:
              transaction.bankName ||
              "Smart Banking",

            "Account Number":
              transaction.accountNumber ||
              "—",

            "Account Type":
              transaction.accountType ||
              "—",

            Description:
              transaction.description ||
              "—",

            Category:
              transaction.category ||
              "—",

            "Transaction Type":
              transaction.type ||
              "—",

            Method:
              transaction.transferMethod ||
              "—",

            Credit:
              Number(
                transaction.credit ||
                  0
              ),

            Debit:
              Number(
                transaction.debit ||
                  0
              ),

            Balance:
              Number(
                transaction.balance ||
                  0
              ),

            Status:
              transaction.status ||
              "—",

            Reference:
              transaction.referenceNumber ||
              "—",
          }));

        const statementSheet =
          XLSX.utils.json_to_sheet(
            statementRows.length
              ? statementRows
              : [
                  {
                    Date: "—",
                    Bank: "—",
                    "Account Number":
                      "—",
                    "Account Type":
                      "—",
                    Description:
                      "No transactions",
                    Category:
                      "—",
                    "Transaction Type":
                      "—",
                    Method: "—",
                    Credit: 0,
                    Debit: 0,
                    Balance: 0,
                    Status: "—",
                    Reference:
                      "—",
                  },
                ]
          );

        XLSX.utils.book_append_sheet(
          workbook,
          statementSheet,
          "Transactions"
        );

        /*
        ------------------------------------------------------
        COLUMN WIDTHS
        ------------------------------------------------------
        */

        infoSheet["!cols"] = [
          {
            wch: 28,
          },
          {
            wch: 35,
          },
        ];

        accountSheet[
          "!cols"
        ] = [
          {
            wch: 25,
          },
          {
            wch: 20,
          },
          {
            wch: 18,
          },
          {
            wch: 18,
          },
          {
            wch: 20,
          },
          {
            wch: 18,
          },
          {
            wch: 18,
          },
          {
            wch: 20,
          },
        ];

        statementSheet[
          "!cols"
        ] = [
          {
            wch: 15,
          },
          {
            wch: 25,
          },
          {
            wch: 20,
          },
          {
            wch: 18,
          },
          {
            wch: 35,
          },
          {
            wch: 20,
          },
          {
            wch: 20,
          },
          {
            wch: 18,
          },
          {
            wch: 18,
          },
          {
            wch: 18,
          },
          {
            wch: 18,
          },
          {
            wch: 15,
          },
          {
            wch: 30,
          },
        ];

        /*
        ------------------------------------------------------
        DOWNLOAD
        ------------------------------------------------------
        */

        XLSX.writeFile(
          workbook,
          `bank-statement-${year}-${String(
            month
          ).padStart(2, "0")}.xlsx`
        );
      } catch (error) {
        console.error(
          "Bank statement Excel export failed:",
          error
        );

        alert(
          "Unable to export the bank statement to Excel."
        );
      }
    };

  /*
  ==========================================================
  BANK STATEMENT PDF
  ==========================================================
  */

  const downloadBankStatementPDF =
    async () => {
      const statement =
        await loadStatement();

      if (!statement) {
        return;
      }

      try {
        const pdf =
          new jsPDF({
            orientation:
              "landscape",

            unit: "mm",

            format: "a4",
          });

        const pageWidth =
          pdf.internal.pageSize
            .getWidth();

        const pageHeight =
          pdf.internal.pageSize
            .getHeight();

        const margin = 10;

        let y = 15;

        /*
        ------------------------------------------------------
        HEADER
        ------------------------------------------------------
        */

        pdf.setFontSize(18);

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          "SMART BANKING SYSTEM",
          margin,
          y
        );

        y += 8;

        pdf.setFontSize(13);

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          "Bank Statement",
          margin,
          y
        );

        y += 7;

        pdf.setFontSize(9);

        pdf.text(
          `Period: ${getPeriodLabel(
            period,
            month,
            year,
            startDate,
            endDate
          )}`,
          margin,
          y
        );

        y += 6;

        pdf.text(
          `Generated: ${new Date().toLocaleString(
            "en-IN"
          )}`,
          margin,
          y
        );

        /*
        ------------------------------------------------------
        HOLDER
        ------------------------------------------------------
        */

        y += 8;

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          "Account Holder",
          margin,
          y
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          statement.holder?.name ||
            "—",
          margin + 35,
          y
        );

        y += 5;

        pdf.text(
          `Email: ${
            statement.holder?.email ||
            "—"
          }`,
          margin,
          y
        );

        /*
        ------------------------------------------------------
        ACCOUNT INFORMATION
        ------------------------------------------------------
        */

        y += 9;

        const firstAccount =
          statement.accounts?.[0];

        if (
          statement.accounts?.length ===
          1
        ) {
          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            "Bank",
            margin,
            y
          );

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            firstAccount?.bankName ||
              "—",
            margin + 28,
            y
          );

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            "Account Number",
            105,
            y
          );

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            firstAccount?.accountNumber ||
              "—",
            140,
            y
          );

          y += 5;

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            "Account Type",
            margin,
            y
          );

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            firstAccount?.accountType ||
              "—",
            margin + 28,
            y
          );

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.text(
            "IFSC",
            105,
            y
          );

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            firstAccount?.ifsc ||
              "—",
            140,
            y
          );

          y += 7;
        }

        /*
        ------------------------------------------------------
        SUMMARY
        ------------------------------------------------------
        */

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          "Statement Summary",
          margin,
          y
        );

        y += 5;

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.text(
          `Total Credits: ${formatCurrency(
            statement.summary
              ?.totalCredits
          )}`,
          margin,
          y
        );

        pdf.text(
          `Total Debits: ${formatCurrency(
            statement.summary
              ?.totalDebits
          )}`,
          75,
          y
        );

        pdf.text(
          `Transactions: ${
            statement.summary
              ?.transactionCount ||
            0
          }`,
          145,
          y
        );

        /*
        ------------------------------------------------------
        TABLE HEADER
        ------------------------------------------------------
        */

        y += 9;

        const columns = [
          {
            title: "Date",
            x: 10,
            width: 22,
          },

          {
            title: "Account",
            x: 32,
            width: 28,
          },

          {
            title: "Description",
            x: 60,
            width: 65,
          },

          {
            title: "Credit",
            x: 125,
            width: 25,
          },

          {
            title: "Debit",
            x: 150,
            width: 25,
          },

          {
            title: "Balance",
            x: 175,
            width: 30,
          },

          {
            title: "Status",
            x: 205,
            width: 22,
          },

          {
            title: "Reference",
            x: 227,
            width: 60,
          },
        ];

        const drawTableHeader =
          () => {
            pdf.setFontSize(8);

            pdf.setFont(
              "helvetica",
              "bold"
            );

            columns.forEach(
              (column) => {
                pdf.text(
                  column.title,
                  column.x,
                  y
                );
              }
            );

            y += 4;

            pdf.line(
              margin,
              y,
              pageWidth - margin,
              y
            );

            y += 5;

            pdf.setFont(
              "helvetica",
              "normal"
            );
          };

        drawTableHeader();

        /*
        ------------------------------------------------------
        TABLE ROWS
        ------------------------------------------------------
        */

        const rows =
          statement.transactions ||
          [];

        for (
          const transaction of rows
        ) {
          if (
            y >
            pageHeight - 18
          ) {
            pdf.addPage();

            y = 15;

            drawTableHeader();
          }

          pdf.setFontSize(7);

          const description =
            String(
              transaction.description ||
                "—"
            );

          const wrappedDescription =
            pdf.splitTextToSize(
              description,
              62
            );

          const reference =
            String(
              transaction.referenceNumber ||
                "—"
            );

          const wrappedReference =
            pdf.splitTextToSize(
              reference,
              55
            );

          const rowHeight =
            Math.max(
              5,
              wrappedDescription.length *
                3.5,
              wrappedReference.length *
                3.5
            );

          pdf.text(
            formatDate(
              transaction.date
            ),
            10,
            y
          );

          pdf.text(
            String(
              transaction.accountNumber ||
                "—"
            ).slice(-10),
            32,
            y
          );

          pdf.text(
            wrappedDescription,
            60,
            y
          );

          pdf.text(
            transaction.credit
              ? formatCurrency(
                  transaction.credit
                )
              : "—",
            125,
            y
          );

          pdf.text(
            transaction.debit
              ? formatCurrency(
                  transaction.debit
                )
              : "—",
            150,
            y
          );

          pdf.text(
            formatCurrency(
              transaction.balance
            ),
            175,
            y
          );

          pdf.text(
            transaction.status ||
              "—",
            205,
            y
          );

          pdf.text(
            wrappedReference,
            227,
            y
          );

          y += rowHeight + 2;

          pdf.setDrawColor(
            220,
            220,
            220
          );

          pdf.line(
            margin,
            y - 1,
            pageWidth - margin,
            y - 1
          );
        }

        /*
        ------------------------------------------------------
        FOOTER
        ------------------------------------------------------
        */

        const pageCount =
          pdf.getNumberOfPages();

        for (
          let page = 1;
          page <= pageCount;
          page++
        ) {
          pdf.setPage(page);

          pdf.setFontSize(7);

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.text(
            `Smart Banking System • Page ${page} of ${pageCount}`,
            margin,
            pageHeight - 7
          );

          pdf.text(
            "This statement is generated from your banking transaction records.",
            pageWidth - 100,
            pageHeight - 7
          );
        }

        /*
        ------------------------------------------------------
        SAVE
        ------------------------------------------------------
        */

        pdf.save(
          `bank-statement-${year}-${String(
            month
          ).padStart(2, "0")}.pdf`
        );
      } catch (error) {
        console.error(
          "PDF generation failed:",
          error
        );

        alert(
          "Unable to generate the PDF statement."
        );
      }
    };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="space-y-6">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Reports
        </h1>

        <p className="text-sm text-slate-500">
          Generated from your real transaction
          history.
        </p>
      </div>

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">

        <div className="flex flex-wrap items-end gap-3">

          {/* PERIOD */}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Period
            </label>

            <select
              value={period}
              onChange={(event) =>
                setPeriod(
                  event.target.value
                )
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

          {/* MONTH */}

          {period ===
            "monthly" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Month
              </label>

              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(event) =>
                  setMonth(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* YEAR */}

          {(period ===
            "monthly" ||
            period ===
              "yearly") && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Year
              </label>

              <input
                type="number"
                value={year}
                onChange={(event) =>
                  setYear(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* CUSTOM */}

          {period ===
            "custom" && (
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
                  onChange={(event) =>
                    setStartDate(
                      event.target
                        .value
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
                  onChange={(event) =>
                    setEndDate(
                      event.target
                        .value
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

          {/* EXISTING EXPORTS */}

          {data?.transactions
            ?.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  exportCSV
                }
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={
                  exportExcel
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Export Excel
              </button>

            </div>
          )}

        </div>
      </div>

      {/* ====================================================
          BANK STATEMENT EXPORT
      ==================================================== */}

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-slate-900">
            Bank Statement Export
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Download your real banking transactions
            as an Excel statement or PDF statement.
          </p>

        </div>

        <div className="flex flex-wrap items-end gap-3">

          {/* ACCOUNT */}

          <div className="min-w-[250px]">

            <label className="mb-1 block text-xs font-medium text-slate-700">
              Statement Account
            </label>

            <select
  value={statementAccountId}
  onChange={(event) =>
    setStatementAccountId(
      event.target.value
    )
  }
  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
>
  <option value="">
    All My Accounts
  </option>

  {accounts.map((account) => (
    <option
      key={account._id}
      value={account._id}
    >
      {account.accountType} -{" "}
      {account.accountNumber}
    </option>
  ))}
</select>

          </div>

          {/* PDF */}

          <button
            type="button"
            disabled={
              statementLoading
            }
            onClick={
              downloadBankStatementPDF
            }
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {statementLoading
              ? "Preparing..."
              : "Download PDF"}
          </button>

        </div>

        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          The statement uses the selected report
          period above. For a custom statement, select
          the start and end dates first.
        </div>

      </div>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {status ===
        "loading" && (
        <Loader label="Generating report..." />
      )}

      {/* ====================================================
          ERROR
      ==================================================== */}

      {status ===
        "error" && (
        <ErrorState
          onRetry={load}
        />
      )}

      {/* ====================================================
          CUSTOM EMPTY
      ==================================================== */}

      {status ===
        "success" &&
        !data && (
          <EmptyState
            title="Select a date range"
            message="Choose a start and end date to generate a custom report."
          />
        )}

      {/* ====================================================
          REPORT DATA
      ==================================================== */}

      {status ===
        "success" &&
        data && (
          <>
            {/* SUMMARY */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Income
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-600">
                  {formatCurrency(
                    data.totalIncome
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Expenses
                </p>

                <p className="mt-1 text-xl font-bold text-red-500">
                  {formatCurrency(
                    data.totalExpenses
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Savings
                </p>

                <p className="mt-1 text-xl font-bold text-brand-700">
                  {formatCurrency(
                    data.savings
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

            {/* CATEGORY BREAKDOWN */}

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">

              <h2 className="mb-3 font-semibold text-slate-900">
                Category Breakdown
              </h2>

              {!data.categoryBreakdown ||
              data.categoryBreakdown
                .length === 0 ? (
                <EmptyState
                  title="No expense data for this period"
                />
              ) : (
                <ul className="space-y-2 text-sm">

                  {data.categoryBreakdown.map(
                    (category) => (
                      <li
                        key={
                          category.category
                        }
                        className="flex items-center justify-between"
                      >
                        <span className="text-slate-600">
                          {
                            category.category
                          }
                        </span>

                        <span className="font-medium text-slate-900">
                          {formatCurrency(
                            category.total
                          )}
                        </span>
                      </li>
                    )
                  )}

                </ul>
              )}

            </div>

            {/* TRANSACTIONS */}

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
                      Status
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
                        colSpan={7}
                        className="px-4 py-6 text-center text-slate-400"
                      >
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map(
                      (transaction) => (
                        <tr
                          key={
                            transaction._id
                          }
                        >

                          <td className="px-4 py-3 text-slate-500">
                            {formatDate(
                              transaction.date
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-800">
                            {transaction.description ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {transaction.category ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {transaction.type ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(
                              transaction.amount
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-500">
                            {transaction.status ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-500">
                            {transaction.referenceNumber ||
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
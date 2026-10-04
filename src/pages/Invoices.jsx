import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  cancelInvoice,
  createInvoice,
  getInvoices,
  markInvoicePaid,
} from "../services/invoiceService";

const emptyItem = () => ({
  name: "",
  quantity: 1,
  price: "",
});

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (invoice) => {
  if (invoice?.status === "PAID") {
    return "PAID";
  }

  if (invoice?.status === "CANCELLED") {
    return "CANCELLED";
  }

  if (invoice?.status === "OVERDUE") {
    return "OVERDUE";
  }

  if (
    invoice?.dueDate &&
    new Date(invoice.dueDate) < new Date()
  ) {
    return "OVERDUE";
  }

  return "PENDING";
};

const getStatusClasses = (status) => {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "OVERDUE":
      return "bg-red-50 text-red-700 border-red-200";

    case "CANCELLED":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    dueDate: "",
    tax: "",
    notes: "",
    items: [emptyItem()],
  });

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setMessage({
        type: "",
        text: "",
      });

      const data = await getInvoices();

      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load invoices:", error);

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Unable to load invoices.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const resetForm = () => {
    setForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      dueDate: "",
      tax: "",
      notes: "",
      items: [emptyItem()],
    });
  };

  const openCreateModal = () => {
    resetForm();
    setMessage({
      type: "",
      text: "",
    });
    setShowModal(true);
  };

  const closeCreateModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((previous) => {
      const items = [...previous.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...previous,
        items,
      };
    });
  };

  const addItem = () => {
    setForm((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        emptyItem(),
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((previous) => {
      if (previous.items.length === 1) {
        return previous;
      }

      return {
        ...previous,
        items: previous.items.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      };
    });
  };

  const subtotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);

      return sum + quantity * price;
    }, 0);
  }, [form.items]);

  const taxAmount = Number(form.tax || 0);

  const calculatedTotal =
    subtotal +
    (Number.isFinite(taxAmount)
      ? taxAmount
      : 0);

  const handleCreateInvoice = async (event) => {
    event.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    if (!form.customerName.trim()) {
      setMessage({
        type: "error",
        text: "Customer name is required.",
      });
      return;
    }

    if (!form.dueDate) {
      setMessage({
        type: "error",
        text: "Please select a due date.",
      });
      return;
    }

    if (!form.items.length) {
      setMessage({
        type: "error",
        text: "Add at least one invoice item.",
      });
      return;
    }

    const normalizedItems =
      form.items.map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity),
        price: Number(item.price),
      }));

    const invalidItem =
      normalizedItems.some(
        (item) =>
          !item.name ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.price) ||
          item.price < 0
      );

    if (invalidItem) {
      setMessage({
        type: "error",
        text:
          "Please enter valid item names, quantities and prices.",
      });
      return;
    }

    if (
      !Number.isFinite(taxAmount) ||
      taxAmount < 0
    ) {
      setMessage({
        type: "error",
        text: "Please enter a valid tax amount.",
      });
      return;
    }

    try {
      setSaving(true);

      const createdInvoice =
        await createInvoice({
          customerName:
            form.customerName.trim(),

          customerEmail:
            form.customerEmail
              .trim()
              .toLowerCase(),

          customerPhone:
            form.customerPhone.trim(),

          items: normalizedItems,

          tax: taxAmount,

          dueDate: form.dueDate,

          notes: form.notes.trim(),
        });

      setInvoices((previous) => [
        createdInvoice,
        ...previous,
      ]);

      setShowModal(false);
      resetForm();

      setMessage({
        type: "success",
        text:
          "Invoice created successfully.",
      });
    } catch (error) {
      console.error(
        "Failed to create invoice:",
        error
      );

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Unable to create invoice.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (invoice) => {
    if (!invoice?._id) return;

    try {
      const updatedInvoice =
        await markInvoicePaid(
          invoice._id
        );

      setInvoices((previous) =>
        previous.map((item) =>
          item._id === updatedInvoice._id
            ? updatedInvoice
            : item
        )
      );

      if (
        selectedInvoice?._id ===
        updatedInvoice._id
      ) {
        setSelectedInvoice(
          updatedInvoice
        );
      }

      setMessage({
        type: "success",
        text: "Invoice marked as paid.",
      });
    } catch (error) {
      console.error(
        "Failed to mark invoice paid:",
        error
      );

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Unable to mark invoice as paid.",
      });
    }
  };

  const handleCancel = async (invoice) => {
    if (!invoice?._id) return;

    const confirmed = window.confirm(
      `Cancel invoice ${invoice.invoiceNumber}?`
    );

    if (!confirmed) return;

    try {
      const updatedInvoice =
        await cancelInvoice(
          invoice._id
        );

      setInvoices((previous) =>
        previous.map((item) =>
          item._id === updatedInvoice._id
            ? updatedInvoice
            : item
        )
      );

      if (
        selectedInvoice?._id ===
        updatedInvoice._id
      ) {
        setSelectedInvoice(
          updatedInvoice
        );
      }

      setMessage({
        type: "success",
        text: "Invoice cancelled.",
      });
    } catch (error) {
      console.error(
        "Failed to cancel invoice:",
        error
      );

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Unable to cancel invoice.",
      });
    }
  };

  const filteredInvoices = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const status = getStatus(invoice);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        invoice.invoiceNumber,
        invoice.customerName,
        invoice.customerEmail,
        invoice.customerPhone,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [
    invoices,
    search,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    const total = invoices.length;

    let paid = 0;
    let pending = 0;
    let overdue = 0;
    let cancelled = 0;

    let paidAmount = 0;
    let outstandingAmount = 0;

    invoices.forEach((invoice) => {
      const status = getStatus(invoice);
      const amount = Number(
        invoice.total || 0
      );

      if (status === "PAID") {
        paid += 1;
        paidAmount += amount;
      } else if (
        status === "PENDING"
      ) {
        pending += 1;
        outstandingAmount += amount;
      } else if (
        status === "OVERDUE"
      ) {
        overdue += 1;
        outstandingAmount += amount;
      } else if (
        status === "CANCELLED"
      ) {
        cancelled += 1;
      }
    });

    return {
      total,
      paid,
      pending,
      overdue,
      cancelled,
      paidAmount,
      outstandingAmount,
    };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600">
            <FiFileText />
            Business Finance
          </div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Invoices
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage invoices for your business customers.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadInvoices}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <FiPlus />
            Create Invoice
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {message.text && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Invoices
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <FiFileText size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700">
                Paid
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {formatCurrency(
                  summary.paidAmount
                )}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                {summary.paid} invoice
                {summary.paid !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 text-emerald-600">
              <FiCheckCircle size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700">
                Pending
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-800">
                {summary.pending}
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Awaiting payment
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 text-amber-600">
              <FiClock size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">
                Outstanding
              </p>
              <p className="mt-2 text-2xl font-bold text-red-800">
                {formatCurrency(
                  summary.outstandingAmount
                )}
              </p>
              <p className="mt-1 text-xs text-red-600">
                {summary.overdue} overdue
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 text-red-600">
              <FiXCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search invoice number or customer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400"
          >
            <option value="ALL">
              All Status
            </option>
            <option value="PENDING">
              Pending
            </option>
            <option value="PAID">
              Paid
            </option>
            <option value="OVERDUE">
              Overdue
            </option>
            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <FiRefreshCw className="mx-auto mb-3 animate-spin text-emerald-600" size={28} />
              <p className="text-sm text-slate-500">
                Loading invoices...
              </p>
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">
              <FiFileText size={28} />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              No invoices found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Create your first business invoice or change the search/filter.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <FiPlus />
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Invoice
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Issue Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Due Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map(
                  (invoice) => {
                    const status =
                      getStatus(invoice);

                    return (
                      <tr
                        key={invoice._id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedInvoice(
                                invoice
                              )
                            }
                            className="text-left"
                          >
                            <p className="font-semibold text-slate-900 hover:text-emerald-600">
                              {
                                invoice.invoiceNumber
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {invoice.items?.length ||
                                0}{" "}
                              item
                              {invoice.items?.length !==
                              1
                                ? "s"
                                : ""}
                            </p>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {
                              invoice.customerName
                            }
                          </p>

                          {invoice.customerEmail && (
                            <p className="mt-1 text-xs text-slate-400">
                              {
                                invoice.customerEmail
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            invoice.issueDate ||
                              invoice.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            invoice.dueDate
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(
                              invoice.total
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {status !==
                              "PAID" &&
                              status !==
                                "CANCELLED" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkPaid(
                                        invoice
                                      )
                                    }
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Mark Paid
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCancel(
                                        invoice
                                      )
                                    }
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedInvoice(
                                  invoice
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create Business Invoice
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add customer and invoice details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateInvoice}
              className="space-y-6 p-6"
            >
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Customer Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Customer Name *
                    </label>

                    <input
                      type="text"
                      value={
                        form.customerName
                      }
                      onChange={(event) =>
                        updateForm(
                          "customerName",
                          event.target.value
                        )
                      }
                      placeholder="Customer / Company name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Customer Email
                    </label>

                    <input
                      type="email"
                      value={
                        form.customerEmail
                      }
                      onChange={(event) =>
                        updateForm(
                          "customerEmail",
                          event.target.value
                        )
                      }
                      placeholder="customer@example.com"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Customer Phone
                    </label>

                    <input
                      type="tel"
                      value={
                        form.customerPhone
                      }
                      onChange={(event) =>
                        updateForm(
                          "customerPhone",
                          event.target.value
                        )
                      }
                      placeholder="Phone number"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Due Date *
                    </label>

                    <input
                      type="date"
                      value={
                        form.dueDate
                      }
                      onChange={(event) =>
                        updateForm(
                          "dueDate",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Invoice Items
                  </h3>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <FiPlus />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_120px_160px_auto] md:items-end">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Item / Service
                            </label>

                            <input
                              type="text"
                              value={item.name}
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  index,
                                  "name",
                                  event.target
                                    .value
                                )
                              }
                              placeholder="Product or service"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Quantity
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                item.quantity
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  event.target
                                    .value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Price
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.price
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  index,
                                  "price",
                                  event.target
                                    .value
                                )
                              }
                              placeholder="0.00"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index
                              )
                            }
                            disabled={
                              form.items
                                .length === 1
                            }
                            className="rounded-lg border border-red-200 bg-white p-2.5 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Remove item"
                          >
                            <FiX />
                          </button>
                        </div>

                        <div className="mt-3 text-right text-sm font-semibold text-slate-700">
                          Item Total:{" "}
                          {formatCurrency(
                            Number(
                              item.quantity ||
                                0
                            ) *
                              Number(
                                item.price ||
                                  0
                              )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tax
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tax}
                    onChange={(event) =>
                      updateForm(
                        "tax",
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    rows="3"
                    value={form.notes}
                    onChange={(event) =>
                      updateForm(
                        "notes",
                        event.target.value
                      )
                    }
                    placeholder="Additional notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="ml-auto max-w-sm space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>
                      {formatCurrency(
                        subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span>
                      {formatCurrency(
                        taxAmount
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-emerald-200 pt-3 text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>
                      {formatCurrency(
                        calculatedTotal
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <FiRefreshCw className="animate-spin" />
                  )}
                  {saving
                    ? "Creating..."
                    : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Business Invoice
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {
                    selectedInvoice.invoiceNumber
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedInvoice(
                    null
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {
                      selectedInvoice.customerName
                    }
                  </p>

                  {selectedInvoice.customerEmail && (
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedInvoice.customerEmail
                      }
                    </p>
                  )}

                  {selectedInvoice.customerPhone && (
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedInvoice.customerPhone
                      }
                    </p>
                  )}
                </div>

                <div className="md:text-right">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                      getStatus(
                        selectedInvoice
                      )
                    )}`}
                  >
                    {getStatus(
                      selectedInvoice
                    )}
                  </span>

                  <p className="mt-3 text-sm text-slate-500">
                    Issue Date:{" "}
                    <span className="font-medium text-slate-700">
                      {formatDate(
                        selectedInvoice.issueDate ||
                          selectedInvoice.createdAt
                      )}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Due Date:{" "}
                    <span className="font-medium text-slate-700">
                      {formatDate(
                        selectedInvoice.dueDate
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Item
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">
                        Price
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(
                      selectedInvoice.items ||
                      []
                    ).map(
                      (item, index) => (
                        <tr
                          key={index}
                          className="border-t border-slate-100"
                        >
                          <td className="px-4 py-3 text-sm text-slate-800">
                            {item.name}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {
                              item.quantity
                            }
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {formatCurrency(
                              item.price
                            )}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                            {formatCurrency(
                              item.total
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto max-w-sm space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrency(
                      selectedInvoice.subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax</span>
                  <span>
                    {formatCurrency(
                      selectedInvoice.tax
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>
                    {formatCurrency(
                      selectedInvoice.total
                    )}
                  </span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {
                      selectedInvoice.notes
                    }
                  </p>
                </div>
              )}

              {getStatus(
                selectedInvoice
              ) !== "PAID" &&
                getStatus(
                  selectedInvoice
                ) !== "CANCELLED" && (
                  <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCancel(
                          selectedInvoice
                        )
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Cancel Invoice
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleMarkPaid(
                          selectedInvoice
                        )
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Mark as Paid
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
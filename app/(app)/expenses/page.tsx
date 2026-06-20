"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Expense, Budget } from "@/lib/types";
import { formatNaira, formatDate, CATEGORIES } from "@/lib/format";
import { ensureNotifyPermission, showLocalNotification } from "@/lib/notify";

const EMPTY_FORM = { amount: "", category: CATEGORIES[0], note: "", date: "" };
const THIS_MONTH = new Date().toISOString().slice(0, 7);

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [warning, setWarning] = useState<{ level: "over" | "near"; text: string } | null>(null);

  async function fetchExpenses() {
    try {
      const q = filterCategory
        ? `?category=${encodeURIComponent(filterCategory)}`
        : "";
      const data = await api.get<Expense[]>(`/expenses${q}`);
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory]); // eslint-disable-line

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setWarning(null);
    setSaving(true);
    const category = form.category;
    // Ask for notification permission on this user gesture (first time only).
    ensureNotifyPermission();
    try {
      await api.post("/expenses", {
        ...form,
        amount: parseFloat(form.amount),
        date: form.date || new Date().toISOString(),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchExpenses();
      checkBudgetWarning(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // After logging an expense, warn if its category is now near or over budget.
  async function checkBudgetWarning(category: string) {
    try {
      const budgets = await api.get<Budget[]>("/budgets");
      const b = budgets.find((x) => x.category === category && x.month === THIS_MONTH);
      if (!b || b.limit <= 0) return;
      const pct = Math.round((b.spent / b.limit) * 100);
      if (b.spent >= b.limit) {
        const text = `You're over your ${category} budget — ₦${b.spent.toLocaleString()} of ₦${b.limit.toLocaleString()} (${pct}%).`;
        setWarning({ level: "over", text });
        showLocalNotification(`🚨 Over budget: ${category}`, text);
      } else if (pct >= 80) {
        const text = `Heads up: ${category} is at ${pct}% of budget — ₦${(b.limit - b.spent).toLocaleString()} left.`;
        setWarning({ level: "near", text });
        showLocalNotification(`⚠️ ${category} budget almost gone`, text);
      }
    } catch {
      /* non-critical */
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await api.del(`/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Log Expense"}
        </button>
      </div>

      {/* Overspend warning after logging an expense */}
      {warning && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-6 text-sm border ${
            warning.level === "over"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <span className="text-lg leading-none">{warning.level === "over" ? "🚨" : "⚠️"}</span>
          <span className="flex-1">{warning.text}</span>
          <button
            onClick={() => setWarning(null)}
            className="text-current/60 hover:text-current"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add expense form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">New Expense</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount (₦)
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500  text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500  text-black"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500  text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch at cafeteria"
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500  text-black"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {saving ? "Saving…" : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter + total */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500  text-black"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          Total:{" "}
          <span className="font-semibold text-gray-900">
            {formatNaira(total)}
          </span>
        </span>
      </div>

      {/* Expense list */}
      <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Loading…
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No expenses found
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {exp.category}
                  </span>
                </div>
                {exp.note && (
                  <p className="text-xs text-gray-500">{exp.note}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(exp.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">
                  -{formatNaira(exp.amount)}
                </span>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-red-400 hover:text-red-600 text-xs transition-colors"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

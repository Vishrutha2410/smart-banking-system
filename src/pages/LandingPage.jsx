import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiShield, FiTrendingUp, FiCpu, FiSend } from "react-icons/fi";

const features = [
  {
    icon: FiSend,
    title: "Instant Transfers",
    desc: "Move money between accounts securely, backed by atomic MongoDB transactions.",
  },
  {
    icon: FiTrendingUp,
    title: "Real Insights",
    desc: "Dashboards and reports built entirely from your own transaction history.",
  },
  {
    icon: FiShield,
    title: "Bank-Grade Security",
    desc: "JWT authentication, hashed passwords, and strict per-user data isolation.",
  },
  {
    icon: FiCpu,
    title: "AI-Ready",
    desc: "Optional AI financial advisor and chatbot when an API key is configured.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-brand-700">SmartBank</span>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
        >
          Banking that's actually <span className="text-brand-600">yours</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl text-lg text-slate-500"
        >
          Every balance, transaction, and insight in SmartBank comes from your real data —
          no demos, no placeholders.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex justify-center gap-3"
        >
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Open an Account
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            I already have an account
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-slate-100 p-6 shadow-sm"
            >
              <f.icon className="h-8 w-8 text-brand-600" />
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to see your real numbers?</h2>
        <p className="mt-2 text-brand-100">
          Create an account in seconds. Your data, your dashboard.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} SmartBank. Built for learning purposes.
      </footer>
    </div>
  );
};

export default LandingPage;

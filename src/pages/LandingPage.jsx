import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiCheckCircle,
  FiCpu,
  FiLock,
  FiSend,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";

const features = [
  {
    icon: FiSend,
    title: "Instant Transfers",
    desc: "Move money between your accounts through a clear, secure transfer experience.",
  },
  {
    icon: FiTrendingUp,
    title: "Real Insights",
    desc: "See dashboards and reports built from your own transaction history.",
  },
  {
    icon: FiShield,
    title: "Secure by Design",
    desc: "Authentication and per-user data isolation keep your banking workspace protected.",
  },
  {
    icon: FiCpu,
    title: "AI Assistance",
    desc: "Use the financial advisor and chatbot when AI services are configured.",
  },
];

const LandingPage = () => {
  return (
    <div className="sb-landing min-h-screen text-slate-900">
      <header className="sb-landing-nav sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="sb-brand-mark h-9 w-9 text-sm">S</span>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              SmartBank
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-4"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 sm:px-5"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="sb-hero mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20">
          <div className="sb-hero-panel grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.08fr_.92fr] lg:px-14 lg:py-16">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="sb-hero-eyebrow"
              >
                <FiLock className="h-3.5 w-3.5" />
                Your digital banking workspace
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[3.7rem]"
              >
                Banking tools that make your money easier to understand.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg"
              >
                Manage accounts, transfers, cards and loans in one focused
                workspace, with analytics and AI-powered assistance alongside
                your real financial data.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.19 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 hover:bg-brand-700"
                >
                  Create your account
                  <FiArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Sign in to SmartBank
                </Link>
              </motion.div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <FiCheckCircle className="text-brand-600" />
                  Real account data
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <FiCheckCircle className="text-brand-600" />
                  Secure authentication
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <FiCheckCircle className="text-brand-600" />
                  Responsive workspace
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="relative mx-auto w-full max-w-md"
            >
              <div className="rounded-[22px] border border-white/80 bg-[#0d1c35] p-5 shadow-2xl shadow-slate-900/15">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      SmartBank
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      Financial overview
                    </p>
                  </div>

                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-teal-300">
                    <FiTrendingUp className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-xs text-slate-400">Your workspace</p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    Accounts · Transfers · Insights
                  </p>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-3/4 rounded-full bg-teal-400" />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                    <span>Organized</span>
                    <span>Connected</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                    <FiSend className="h-4 w-4 text-teal-300" />

                    <p className="mt-3 text-xs font-semibold text-slate-300">
                      Transfers
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Move funds securely
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                    <FiCpu className="h-4 w-4 text-teal-300" />

                    <p className="mt-3 text-xs font-semibold text-slate-300">
                      AI tools
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Understand your data
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="sb-trust-strip">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span className="font-semibold text-slate-700">
              A focused banking experience
            </span>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span className="inline-flex items-center gap-2">
                <FiShield />
                Security-conscious design
              </span>

              <span className="inline-flex items-center gap-2">
                <FiTrendingUp />
                Data-driven insights
              </span>

              <span className="inline-flex items-center gap-2">
                <FiCpu />
                Optional AI features
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              One workspace
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Everything important, without the clutter.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              A consistent interface for everyday banking, financial planning
              and intelligent assistance.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.05,
                }}
                className="sb-feature-card p-5"
              >
                <div className="sb-feature-icon">
                  <feature.icon className="h-[18px] w-[18px]" />
                </div>

                <h3 className="mt-5 text-sm font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-[#0c1b35] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-300">
                SmartBank
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Start with a cleaner view of your finances.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Create an account and access the banking tools available in
                your workspace.
              </p>
            </div>

            <Link
              to="/register"
              className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#0c1b35] hover:bg-slate-100 lg:mt-0"
            >
              Get started
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} SmartBank</span>
          <span>Built for learning and project demonstration.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
import {
  FiBookOpen,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiCreditCard,
  FiDollarSign,
} from "react-icons/fi";

const benefits = [
  {
    icon: FiDollarSign,
    title: "Student Budgeting",
    description:
      "Plan your monthly allowance across food, transport, education, entertainment and savings.",
  },

  {
    icon: FiTarget,
    title: "Savings Goals",
    description:
      "Create savings targets for a laptop, phone, emergency fund, courses or other student needs.",
  },

  {
    icon: FiBookOpen,
    title: "Education Finance",
    description:
      "Understand education loans, tuition planning and responsible borrowing.",
  },

  {
    icon: FiTrendingUp,
    title: "Financial Planning",
    description:
      "Use your spending analytics to understand where your money goes each month.",
  },

  {
    icon: FiShield,
    title: "Banking Safety",
    description:
      "Learn about UPI safety, transaction security, suspicious activity and responsible digital banking.",
  },

  {
    icon: FiCreditCard,
    title: "Responsible Banking",
    description:
      "Build healthy financial habits by tracking transactions and keeping your spending within budget.",
  },
];

const StudentBenefits = () => {
  return (
    <div className="space-y-6">

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          Student Banking
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Student Benefits & Financial Education
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Tools and educational resources designed
          to help students understand and manage
          their finances.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

        {benefits.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>

                <h2 className="mt-4 font-bold text-slate-900">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            );
          }
        )}

      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="font-bold text-blue-950">
          Important
        </h2>

        <p className="mt-1 text-sm leading-6 text-blue-800">
          These resources are for financial education
          and planning. They do not represent guaranteed
          bank offers, scholarship approvals or loan
          approvals.
        </p>
      </div>

    </div>
  );
};

export default StudentBenefits;
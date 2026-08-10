import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaPercentage,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function Loans() {

  const loans = [
    {
      type: "Education Loan",
      amount: "₹4,50,000",
      outstanding: "₹3,20,000",
      interest: "8.5%",
      emi: "₹8,250",
    },
    {
      type: "Personal Loan",
      amount: "₹2,00,000",
      outstanding: "₹1,25,000",
      interest: "10.2%",
      emi: "₹6,100",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-6xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="Loans"
          description="Track your loans, EMIs and repayment status."
          action="Apply for Loan"
        />

        <div className="grid md:grid-cols-2 gap-6">

          {loans.map((loan) => (

            <div
              key={loan.type}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
            >

              <div className="flex justify-between">

                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <FaMoneyBillWave />
                </div>

                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full h-fit">
                  Active
                </span>

              </div>

              <h3 className="text-xl font-bold mt-5">
                {loan.type}
              </h3>

              <div className="grid grid-cols-2 gap-5 mt-6">

                <LoanInfo
                  icon={<FaMoneyBillWave />}
                  title="Outstanding"
                  value={loan.outstanding}
                />

                <LoanInfo
                  icon={<FaPercentage />}
                  title="Interest"
                  value={loan.interest}
                />

                <LoanInfo
                  icon={<FaCalendarAlt />}
                  title="Monthly EMI"
                  value={loan.emi}
                />

                <LoanInfo
                  icon={<FaMoneyBillWave />}
                  title="Original Amount"
                  value={loan.amount}
                />

              </div>

              <button className="w-full mt-6 border border-blue-200 text-blue-600 rounded-xl p-3 hover:bg-blue-50">
                View Loan Details
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

function LoanInfo({ icon, title, value }) {
  return (
    <div>

      <div className="flex items-center gap-2 text-slate-400 text-xs">
        {icon}
        {title}
      </div>

      <p className="font-semibold mt-1">
        {value}
      </p>

    </div>
  );
}
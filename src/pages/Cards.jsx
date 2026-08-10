import {
  FaCreditCard,
  FaLock,
  FaEye,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";

export default function Cards() {

  const cards = [
    {
      type: "Visa Debit",
      number: "4582",
      expiry: "08/29",
      status: "Active",
    },
    {
      type: "Visa Credit",
      number: "9012",
      expiry: "11/28",
      status: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-6xl mx-auto p-6 lg:p-8">

        <PageHeader
          title="My Cards"
          description="Manage your debit and credit cards."
        />

        <div className="grid lg:grid-cols-2 gap-7">

          {cards.map((card) => (

            <div key={card.number}>

              {/* Card */}

              <div className="h-56 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-900 text-white p-7 relative overflow-hidden shadow-xl">

                <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/5" />

                <div className="flex justify-between">

                  <div>
                    <p className="text-blue-200 text-sm">
                      SmartBank
                    </p>

                    <p className="font-semibold mt-1">
                      {card.type}
                    </p>
                  </div>

                  <FaCreditCard className="text-2xl" />

                </div>

                <p className="text-2xl tracking-widest mt-10">
                  •••• •••• •••• {card.number}
                </p>

                <div className="flex justify-between mt-7">

                  <div>
                    <p className="text-xs text-blue-200">
                      VALID THRU
                    </p>

                    <p className="font-medium">
                      {card.expiry}
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="text-xs text-blue-200">
                      CARD HOLDER
                    </p>

                    <p className="font-medium">
                      DEMO USER
                    </p>

                  </div>

                </div>

              </div>

              {/* Actions */}

              <div className="bg-white rounded-2xl p-4 mt-3 flex justify-between">

                <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                  <FaEye />
                  View Details
                </button>

                <button className="flex items-center gap-2 text-sm text-red-500">
                  <FaLock />
                  Lock Card
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
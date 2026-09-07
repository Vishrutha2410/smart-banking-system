import { useEffect, useState } from "react";
import {
  FaBars,
  FaBell,
  FaUserCircle,
  FaSearch,
} from "react-icons/fa";

export default function DashboardHeader(){
  const [user, setUser] = useState(null);

  useEffect(() => {

    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      setUser(
        JSON.parse(storedUser)
      );
    }

  }, []);
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-5 lg:px-8">

      {/* Left */}

      <div className="flex items-center gap-4">

        {/* Mobile menu */}

        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-slate-700 text-xl"
        >
          <FaBars />
        </button>

        <div>

          <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
            Good Morning, Demo User 👋
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Here's your financial overview.
          </p>

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-4">

        {/* Search */}

        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5">

          <FaSearch className="text-slate-400 text-sm" />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-28 lg:w-40"
          />

        </div>

        {/* Notification */}

        <button className="relative w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600">

          <FaBell />

          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />

        </button>

        {/* Profile */}

        <button className="hidden sm:flex items-center gap-2">

          <FaUserCircle className="text-3xl text-blue-600" />

          <span className="text-sm font-medium text-slate-700">
            Demo User
          </span>

        </button>

      </div>

    </header>
  );
}
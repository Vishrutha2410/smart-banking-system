import { FaUniversity, FaRobot, FaShieldAlt, FaChartLine } from "react-icons/fa";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { IoWallet } from "react-icons/io5";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaRobot size={35} />,
      title: "AI Financial Advisor",
      desc: "Receive intelligent financial recommendations based on your spending."
    },
    {
      icon: <FaShieldAlt size={35} />,
      title: "Fraud Detection",
      desc: "AI monitors suspicious activities and protects your account."
    },
    {
      icon: <MdOutlineQrCodeScanner size={35} />,
      title: "Receipt OCR",
      desc: "Upload receipts and automatically record your expenses."
    },
    {
      icon: <FaChartLine size={35} />,
      title: "Expense Analytics",
      desc: "Understand your spending with beautiful charts."
    },
    {
      icon: <IoWallet size={35} />,
      title: "Smart Budget",
      desc: "Automatically create monthly budgets using AI."
    },
    {
      icon: <FaUniversity size={35} />,
      title: "Modern Banking",
      desc: "Accounts, Loans, Cards, Transfers and much more."
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-900">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">

          <div className="flex items-center gap-3">
            <FaUniversity className="text-blue-600 text-3xl" />
            <span className="font-bold text-2xl">
              SmartBank AI
            </span>
          </div>

          <div className="hidden md:flex gap-10 font-medium">
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#about" className="hover:text-blue-600">About</a>
            <a href="#technology" className="hover:text-blue-600">Technology</a>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition"
          >
            Login
          </button>

        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-8">

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{opacity:0,x:-50}}
            animate={{opacity:1,x:0}}
            transition={{duration:1}}
          >

            <h1 className="text-6xl font-extrabold leading-tight">
              AI Powered
              <br />
              Smart Banking
              <span className="text-blue-600"> System</span>
            </h1>

            <p className="mt-8 text-xl text-gray-600 leading-8">
              Experience next-generation digital banking with Artificial Intelligence,
              Fraud Detection, Smart Budgeting, OCR Receipt Scanner and AI Financial Advisor.
            </p>

            <div className="flex gap-6 mt-10">

              <button
                onClick={()=>navigate("/login")}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition text-lg"
              >
                Get Started
              </button>

              <button
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-600 hover:text-white transition text-lg"
              >
                Learn More
              </button>

            </div>

          </motion.div>

          <motion.div
            initial={{opacity:0,x:50}}
            animate={{opacity:1,x:0}}
            transition={{duration:1}}
            className="flex justify-center"
          >

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-[420px] h-[420px] rounded-full flex items-center justify-center shadow-2xl">

              <FaUniversity
                className="text-white"
                size={170}
              />

            </div>

          </motion.div>

        </div>

      </section>

      {/* Stats */}

      <section className="py-14 bg-white">

        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-center">

          <div>
            <h2 className="text-4xl font-bold text-blue-600">25K+</h2>
            <p>Users</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-blue-600">₹15Cr+</h2>
            <p>Transactions</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-blue-600">99.9%</h2>
            <p>Secure</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-blue-600">24/7</h2>
            <p>AI Support</p>
          </div>

        </div>

      </section>

      {/* Features */}

      <section
        id="features"
        className="py-24 max-w-7xl mx-auto px-8"
      >

        <h2 className="text-5xl font-bold text-center mb-16">
          Smart Features
        </h2>

        <div className="grid lg:grid-cols-3 gap-8">

          {features.map((item,index)=>(

            <motion.div
              whileHover={{scale:1.05}}
              key={index}
              className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition"
            >

              <div className="text-blue-600 mb-5">
                {item.icon}
              </div>

              <h3 className="font-bold text-2xl mb-3">
                {item.title}
              </h3>

              <p className="text-gray-600">
                {item.desc}
              </p>

            </motion.div>

          ))}

        </div>

      </section>

      {/* About */}

      <section
        id="about"
        className="bg-blue-700 text-white py-24 px-8"
      >

        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-5xl font-bold mb-10">
            About Smart Banking System
          </h2>

          <p className="text-xl leading-10">

            Smart Banking System is an AI-native digital banking platform
            designed to provide secure banking together with intelligent
            financial insights, fraud detection, personalized budgeting,
            receipt scanning and AI-powered assistance.

          </p>

        </div>

      </section>

      {/* Technology */}

      <section
        id="technology"
        className="py-20"
      >

        <h2 className="text-center text-5xl font-bold mb-14">
          Technologies Used
        </h2>

        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-5">

          {[
            "React",
            "Node.js",
            "Express",
            "MongoDB",
            "Firebase",
            "JWT",
            "Gemini AI",
            "Cloudinary",
            "Chart.js"
          ].map((tech)=>(
            <div
              key={tech}
              className="bg-blue-600 text-white px-8 py-4 rounded-full shadow-lg"
            >
              {tech}
            </div>
          ))}

        </div>

      </section>

      {/* Footer */}

      <footer className="bg-slate-900 text-white py-8">

        <div className="text-center">

          <h2 className="text-2xl font-bold">
            Smart Banking System
          </h2>

          <p className="mt-2">
            AI Powered Digital Banking Platform
          </p>

          <p className="mt-6 text-gray-400">
            © 2026 All Rights Reserved
          </p>

        </div>

      </footer>

    </div>
  );
}
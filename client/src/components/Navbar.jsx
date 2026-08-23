import React from "react";

export default function Navbar() {

    const backtohome = (e) => {
        e.preventDefault();
        window.location.href = "/";
    };
  return (
    <div className="w-full flex justify-center">
      <nav
        className="bg-black px-5 py-3 flex items-center justify-between"
        style={{
          width: "80vw",
          minHeight: "64px",
          borderRadius: "10px 10px 0 0",
          color: "#D89216",
        }}
      >
        <a className="text-2xl font-bold whitespace-nowrap" href="/">
          KCT Bankers
        </a>
        <button
          className="text-lg font-bold px-4 py-2 whitespace-nowrap"
          style={{
            color: "#D89216",
            border: "2px solid #D89216",
            borderRadius: "25px",
          }}
          onClick={backtohome}
        >
          Cancel
        </button>
      </nav>
    </div>
  );
}

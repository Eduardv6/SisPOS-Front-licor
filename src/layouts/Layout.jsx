import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 selection:bg-primary-500/30">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-inner border border-primary-400 transform rotate-3">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 8L20 12H12L16 8Z" fill="white" />
              <rect x="13" y="12" width="6" height="12" rx="1" fill="white" />
            </svg>
          </div>
          <span className="text-[17px] font-black text-gray-900 tracking-tight leading-none">
            Licorería<br /><span className="text-primary-600">Brasil</span>
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2 bg-gray-50 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="md:ml-[280px] min-h-screen transition-all duration-300 flex flex-col">
        <main className="p-4 md:p-6 lg:p-8 flex-1 w-full max-w-[1920px] mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

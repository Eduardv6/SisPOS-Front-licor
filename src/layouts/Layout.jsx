import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar />
      <div className="md:ml-[260px] min-h-screen transition-all duration-300">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

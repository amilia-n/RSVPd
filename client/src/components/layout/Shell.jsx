import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { BellProvider } from "@magicbell/magicbell-react";

export default function Shell({ children }) {
  return (
    <BellProvider
      apiKey={import.meta.env.VITE_MAGICBELL_API_KEY}
      userEmail={null} 
      locale="en"
    >
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children || <Outlet />}
        </main>
      </div>
    </BellProvider>
  );
}
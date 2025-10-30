import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo size={80} />
        </div>
        <h1 className="text-4xl font-bold mb-4">AllIsWell</h1>
        <p className="text-lg text-secondary mb-8">Project Status Tracker</p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className=" div-class min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-white to-gray-50 font-sans">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 sm:space-y-8">
        {/* Badge */}
        <div className="transform hover:scale-105 transition-transform">
          <span className="px-4 py-1.5 text-center rounded-full text-xs sm:text-sm font-semibold bg-orange-50 text-orange-500 border-2 border-orange-500">
            Introducing
          </span>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-sans">
          <span>AI </span>
          <span className="text-orange-500">Powered </span>
          <span>Learning Assistant</span>
        </h1>

        {/* Subtitle */}
        <p className="text-center text-sm sm:text-base md:text-lg text-gray-600 max-w-xl mx-auto px-4 font-sans">
          For Document-Driven Interactive Q&A
        </p>

        {/* CTA Button */}
        <Link
          href="/chat/new"
          className="group relative inline-flex items-center justify-center mt-4"
        >
          <button
            className="relative px-6 py-3 bg-black text-white text-sm sm:text-base font-medium rounded-lg
            shadow-lg hover:bg-orange-500 transform hover:scale-105 transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-sans"
          >
            Start Session
           
          </button>
        </Link>
      </div>
    </main>
  );
}

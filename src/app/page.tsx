import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col   p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-orange-50 to-white font-sans">
      <div className=" w-full h-12 flex items-center px-8">
        <Link
          href={"/"}
        >
          <h1 className="font-extrabold text-5xl text-orange-600 font-barriecito">Eda</h1>
        </Link>
      </div>
      <div className="flex items-center justify-center flex-1">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center space-y-8 ">
          {/* Logo and Title */}
          <div className="flex flex-col items-center space-y-4">
           

            <span className="px-4 py-1.5 text-center rounded-full text-xs sm:text-sm font-semibold bg-orange-50 text-orange-500 border-2 border-orange-500">
              Introducing
            </span>
            <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-800">
              Eda - Your AI Learning Assistant
            </h1>
            <p className="text-center text-lg sm:text-xl text-gray-600 max-w-2xl">
              Unlock knowledge with Document-Driven Interactive Q&A
            </p>
          </div>

          {/* Features Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Instant Answers
              </h2>
              <p className="text-gray-600">
                Get quick, accurate answers from your documents using AI.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Document Upload
              </h2>
              <p className="text-gray-600">
                Easily upload and analyze various document formats (PDF, TXT,
                etc.).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Create Review Qns
              </h2>
              <p className="text-gray-600">
               Generate question on a topic for a quick review and study
              </p>
            </div>
          </section>

          {/* CTA Button */}
          <Link
            href="/chat/new"
            className="inline-flex items-center justify-center mt-4"
          >
            <button className="px-8 py-4 bg-orange-600 text-white text-lg font-medium rounded-lg shadow-lg hover:bg-orange-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500">
              Start Learning Now
            </button>
          </Link>

          {/* Footer */}
          <footer className="absolute text-center text-gray-500 mt-12 bottom-7">
            <p>&copy; {new Date().getFullYear()} Eda. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </main>
  );
}

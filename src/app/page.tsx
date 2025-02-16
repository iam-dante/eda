import Link from "next/link";

export default function Home() {
  return (
    <div className="div-class flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-center items-center space-y-4 text-center max-w-3xl mx-auto">
        <div className="p-1 w-32 text-center rounded-full font-semibold text-sm sm:text-base font-sans border-2 border-orange-500 text-orange-500">
          Introducing
        </div>
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold font-sans flex flex-row space-x-2">
          <h1>AI </h1> <h1 className=" text-orange-500">Powered</h1>
          <h1>Learning Assistant</h1>
        </div>
        <p className="text-base sm:text-lg md:text-xl text-gray-500 font-sans max-w-2xl">
          For Document-Driven Interactive Q&A
        </p>
        <Link href="/chat/new">
          <button className="bg-black hover:bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-md font-sans text-sm sm:text-base  transition-colors duration-200">
            Start Session
          </button>
        </Link>
      </div>
    </div>
  );
}

// import LoginPage from "./loginpage";
// import HomePage from "./homepage/page";
import Link from "next/link";


// export default function Home() {
//   return (
//     // <HomePage/>
//     <LoginPage/>
//   );
// }

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          Welcome to AI Learning Assistant 
        </h1>
        <p className="mb-4 text-gray-600">
          AI Learning Assistant for Document-Driven Interactive Q&A
        </p>
        <Link href="/chat/new">
          <button className="bg-black text-white px-6 py-2 rounded-md">
            Start Chatting
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex h-screen flex-row">
      <div className="w-[20%] bg-blue-200">
        <div className="flex justify-center items-center h-32">
          <div className="h-12 bg-red-800 w-[80%] rounded-full flex justify-center items-center">
            <h1 className="text-xl font-medium"> Upload PDF</h1>
          </div>
        </div>
      </div>

      <div className="w-[80%]">
        <div className="h-[10%] w-full bg-green-50 flex items-center px-12 border-b-2 border-black">
          <h1 className="text-black font-sans text-2xl font-semibold">
            ChatRAG
          </h1>
        </div>

        {/* Chat Interface */}
        <div className="w-full h-[82%] bg-red-400 flex justify-center ">
          <div className="w-[70%] h-full bg-blue-600">
            {/* Query Text */}
            <div className="flex items-center justify-end bg-white">
              <div className="max-w-[70%] bg-yellow-300 p-2 rounded-md">
                <h1 className="text-black">Query text here</h1>
              </div>
            </div>

            {/* Response  Text */}
            <div className="flex items-center bg-white">
              <div className="max-w-[70%] bg-yellow-300 p-2 rounded-md">
                <h1 className="text-black">Query text here</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Input  */}
        <div className="w-full bg-yellow-50 h-[8%] flex justify-center items-center">
          <div className="h-14 w-[60%] bg-white rounded-full px-4 flex items-center border-2 border-black justify-between">
            <input
              className=" w-[94%] h-11 text-black font-sans font-medium focus:outline-none focus:ring-0"
              placeholder="Ask document a question. "
              type="text"
            />
            <div className="bg-black h-10 w-10 rounded-full flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

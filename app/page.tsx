export default function Home() {
  return (
    <div className="flex h-screen flex-row bg-slate-800">
      <div className="w-[20%] bg-slate-300">
        <div className="flex justify-center items-center h-32">
          <div className="h-12 bg-gray-800 w-[80%] rounded-full flex justify-center items-center">
            <h1 className="text-xl font-medium text-white"> Upload PDF</h1>
          </div>
        </div>
      </div>

      <div className="w-[80%]">
        <div className="h-[10%] w-full  flex items-center px-12 border-b-2 border-white">
          <h1 className="text-white font-sans text-2xl font-semibold">
            ChatRAG
          </h1>
        </div>

        {/* Chat Interface */}
        <div className="w-full h-[82%]  flex justify-center pt-4">
          <div className="w-[70%] h-full ">
            {/* Query Text */}
            <div className="flex items-center justify-end ">
              <div className="max-w-[70%] bg-gray-100 p-2 rounded-md">
                <h1 className="text-black">
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry. Lorem Ipsum has been the industrys
                  standard dummy text ever since the 1500s, when an unknown
                  printer took a galley of type and scrambled it to make a type
                  specimen book. It has survived not only five centuries, but
                  also the leap into electronic typesetting, remaining
                  essentially unchanged. It was popularised in the 1960s with
                  the release of Letraset sheets containing Lorem Ipsum
                  passages, and more recently with desktop publishing software
                  like Aldus PageMaker including versions of Lorem Ipsum.
                </h1>
              </div>
            </div>

            {/* Response  Text */}
            <div className="flex items-center ">
              <div className="max-w-[70%] p-2 rounded-md text-white flex flex-row space-x-2">
                <h1> &#x2022; </h1>
                <h1 className="text-white">AI response</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Input  */}
        <div className="w-full h-[8%] flex justify-center items-center">
          <div className="h-14 w-[60%] bg-white rounded-full pl-6 pr-3 flex items-center border-2 border-black justify-between">
            <input
              className=" w-[94%] h-11 text-black font-sans font-medium focus:outline-none focus:ring-0"
              placeholder="Ask document a question."
              type="text"
            />
            <div className="bg-black h-10 w-10 rounded-full flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 text-white"
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

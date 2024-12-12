"use client";
import { useState,} from "react";
import axios from "axios";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [inputText, setInputText] = useState("");
  const [response, setResponseText] = useState("")

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    }
  };

  let chatinput = inputText
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setInputText("")

    try {
      const response = await fetch("http://127.0.0.1:5000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponseText(data.results);
      } else {
        const errorData = await response.json();
        alert(
          errorData.error || "An error occurred while processing your text."
        );
      }
    } catch (error) {
      alert("Failed to connect to the server.");
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (selectedFile) {
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage("Only PNG, JPEG, JPG, and GIF files are allowed.");
        return;
      }

      if (selectedFile.size > maxSize) {
        setMessage("File is too large. Maximum size is 5MB.");
        return;
      }

      setMessage("");
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to upload file.");
    }
  };

  // return (
  //   <div>
  //     <h1>File Upload</h1>
  //     <input type="file" onChange={handleFileChange} />
  //     <button onClick={handleUpload}>Upload</button>
  //     {message && <p>{message}</p>}
  //   </div>
  // );

  return (
    <div className="flex h-screen flex-row bg-slate-800">
      <div className="w-[20%] bg-slate-300">
        <div className="flex flex-col justify-center items-center h-32">
          {/* <input
          type="file"
            // htmlFor="fileUpload"
            className="h-12 bg-gray-800 w-[80%] rounded-full flex justify-center items-center"
          >
            <a>
              <h1 className="text-xl font-medium text-white"> Upload PDF</h1>
            </a>
          </input> */}

          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
          {message && <p>{message}</p>}
        </div>
        <input id="fileUpload" type="file" className="hidden" />
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
                 {chatinput}
                </h1>
              </div>
            </div>

            {/* Response  Text */}
            <div className="flex items-center ">
              <div className="max-w-[70%] p-2 rounded-md text-white flex flex-row space-x-2">
                <h1> &#x2022; </h1>
                <h1 className="text-white">{response}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Input  */}
        <div className="w-full h-[8%] flex justify-center items-center">
          <div className="h-14 w-[60%] bg-white rounded-full pl-6 pr-3 flex items-center border-2 border-black justify-between">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className=" w-[94%] h-11 text-black font-sans font-medium focus:outline-none focus:ring-0"
              placeholder="Ask document a question."
              onKeyDown={handleKeyPress}
            />
            <button
              className="bg-black h-10 w-10 rounded-full flex justify-center items-center"
              onClick={handleSubmit}
            >
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
            </button>
          </div>
        </div>
      </div>
    </div>

    // <h1 className="text-black bg-red-300">{data}</h1>
  );
}

// export async function getServerSideProps() {
//   const response = await fetch("/api/hellow");
//   const data = await response.json();

//   return {
//     props: {
//       data,
//     },
//   };
// }

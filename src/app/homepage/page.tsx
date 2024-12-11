"use client";
import { useState, useEffect } from "react";
import axios from "axios";


export default function HomePage() {
const [file, setFile] = useState(null);
const [message, setMessage] = useState("");

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "doc/pdf"];
  const maxSize = 10 * 1024 * 1024; // 5MB

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

return (
  <div>
    <h1>File Upload</h1>
    <input type="file" onChange={handleFileChange} />
    <button onClick={handleUpload}>Upload</button>
    {message && <p>{message}</p>}
  </div>
);

  // return (
  //   <div className="flex h-screen flex-row bg-slate-800">
  //     <div className="w-[20%] bg-slate-300">
        

  //       <div className="flex justify-center items-center h-32">
  //         <label
  //           htmlFor="fileUpload"
  //           className="h-12 bg-gray-800 w-[80%] rounded-full flex justify-center items-center"
  //         >
  //           <a>
  //             <h1 className="text-xl font-medium text-white"> Upload PDF</h1>
  //           </a>
  //         </label>
  //       </div>
  //       <input id="fileUpload" type="file" className="hidden" />
  //     </div>

  //     <div className="w-[80%]">
  //       <div className="h-[10%] w-full  flex items-center px-12 border-b-2 border-white">
  //         <h1 className="text-white font-sans text-2xl font-semibold">
  //           ChatRAG
  //         </h1>
  //       </div>

  //       {/* Chat Interface */}
  //       <div className="w-full h-[82%]  flex justify-center pt-4">
  //         <div className="w-[70%] h-full ">
  //           {/* Query Text */}
  //           <div className="flex items-center justify-end ">
  //             <div className="max-w-[70%] bg-gray-100 p-2 rounded-md">
  //               <h1 className="text-black">
  //                 Lorem Ipsum is simply dummy text of the printing and
  //                 typesetting industry. Lorem Ipsum has been the industrys
  //                 standard dummy text ever since the 1500s, when an unknown
  //                 printer took a galley of type and scrambled it to make a type
  //                 specimen book. It has survived not only five centuries, but
  //                 also the leap into electronic typesetting, remaining
  //                 essentially unchanged. It was popularised in the 1960s with
  //                 the release of Letraset sheets containing Lorem Ipsum
  //                 passages, and more recently with desktop publishing software
  //                 like Aldus PageMaker including versions of Lorem Ipsum.
  //               </h1>
  //             </div>
  //           </div>

  //           {/* Response  Text */}
  //           <div className="flex items-center ">
  //             <div className="max-w-[70%] p-2 rounded-md text-white flex flex-row space-x-2">
  //               <h1> &#x2022; </h1>
  //               <h1 className="text-white">AI response</h1>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Input  */}
  //       <div className="w-full h-[8%] flex justify-center items-center">
  //         <div className="h-14 w-[60%] bg-white rounded-full pl-6 pr-3 flex items-center border-2 border-black justify-between">
  //           <input
  //             className=" w-[94%] h-11 text-black font-sans font-medium focus:outline-none focus:ring-0"
  //             placeholder="Ask document a question."
  //             type="text"
  //           />
  //           <div className="bg-black h-10 w-10 rounded-full flex justify-center items-center">
  //             <svg
  //               xmlns="http://www.w3.org/2000/svg"
  //               fill="none"
  //               viewBox="0 0 24 24"
  //               strokeWidth={1.5}
  //               stroke="currentColor"
  //               className="size-6 text-white"
  //             >
  //               <path
  //                 strokeLinecap="round"
  //                 strokeLinejoin="round"
  //                 d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
  //               />
  //             </svg>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>

  //   // <h1 className="text-black bg-red-300">{data}</h1>
  // );
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

import {useState, useCallback} from "react"

export function PdfUploader(){
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    
        const handleDrop = useCallback((e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
    
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const uploadedFile = e.dataTransfer.files[0];
            if (uploadedFile.type === "application/pdf") {
              setFile(uploadedFile);
              console.log("File uploaded:", uploadedFile.name);
            } else {
              alert("Please upload PDF files only");
            }
          }
        }, []);
    
        const handleDragEnter = useCallback((e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }, []);
    
        const handleDragLeave = useCallback((e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }, []);
    
        const handleDragOver = useCallback((e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }, []);
    
        const handleFileInput = useCallback((e) => {
          const uploadedFile = e.target.files[0];
          if (uploadedFile && uploadedFile.type === "application/pdf") {
            setFile(uploadedFile);
            console.log("File uploaded:", uploadedFile.name);
          } else if (uploadedFile) {
            alert("Please upload PDF files only");
          }
        }, []);

    return (
      <div
        className={`h-[87%] mx-64 border-2 border-dashed border-orange-600 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-400 bg-white hover:border-blue-500 hover:bg-blue-50"
        }`}
        // className="h-[87%] bg-white rounded-md flex items-center border-2 border-dashed border-black mx-64"
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <h3 className="text-lg font-medium text-gray-800">Drop file here</h3>
        <p className="text-sm text-gray-500 mt-2">PDF files only</p>
        {file && (
          <div className="mt-4 text-sm text-green-600">
            Uploaded: {file.name}
          </div>
        )}
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          //   className="w-full h-22 text-black bg-white border-white font-sans font-medium focus:outline-none focus:ring-0 border-0"
        />
      </div>
    );
}
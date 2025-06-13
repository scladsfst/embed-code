"use client";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadLink, setUploadLink] = useState("");
  const [htmlLink, setHtmlLink] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<
    { name: string; download_url: string }[]
  >([]);
  const [enableTracking, setEnableTracking] = useState(false); // New state for tracking checkbox

  const fetchAudioFiles = async () => {
    const response = await fetch("/api/audio-files");
    const data = await response.json();
    if (response.ok) {
      setAudioFiles(data.files);
    } else {
      alert("Failed to fetch audio files: " + data.message);
    }
  };

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const content = reader.result?.toString().split(",")[1];

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          content: content,
          enableTracking: enableTracking, // Pass the checkbox state to the API
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setUploadLink(result.audioLink);
        setHtmlLink(result.htmlLink);
        setHtmlContent(result.htmlContents);
        setUploadDate(new Date().toLocaleString());
        fetchAudioFiles(); // Fetch audio files after successful upload
      } else {
        alert("File upload failed: " + result.message);
      }
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleEmbed = (content: string) => {
    const iframeCode = `${content}`;
    navigator.clipboard
      .writeText(iframeCode)
      .then(() => {
        alert("Embed code copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy embed code to clipboard");
      });
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-white p-6 md:p-16 rounded-lg shadow-lg w-full max-w-xl">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
          Upload Audio File
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="block w-full text-base text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            required
          />
          <div className="flex items-center">
            
            <input
              type="checkbox"
              id="enableTracking"
              checked={enableTracking}
              onChange={(e) => setEnableTracking(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="enableTracking"
              className="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Enable Analytics & Performance Tracking
            </label>
          </div>{" "}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-red-500 text-white font-semibold py-2 rounded-lg hover:bg-gradient-to-l transition-colors text-lg"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
        {uploadLink && (
          <div className="mt-6 p-4 bg-green-100 rounded-lg text-green-700">
            <p className="mb-2">File uploaded successfully!</p>
            <audio controls src={uploadLink} className="w-full mb-2">
              <source src={uploadLink} type="audio/mp3" />
            </audio>
            <p className="text-sm">Uploaded on: {uploadDate}</p>
            <a href={uploadLink} className="text-blue-500 underline mt-2 block">
              View file
            </a>
            <a href={htmlLink} className="text-blue-500 underline mt-2 block">
              View html
            </a>
            <button
              onClick={() => handleEmbed(htmlContent)}
              className="bg-blue-500 text-white font-semibold p-2 rounded-lg mt-2 hover:bg-blue-600 transition-colors"
            >
              Embed html
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

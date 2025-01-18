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

  const handleDelete = async (filename: string) => {
    const response = await fetch("/api/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });

    const result = await response.json();
    if (response.ok) {
      alert("File deleted successfully");
      setAudioFiles((prevFiles) =>
        prevFiles.filter((file) => file.name !== filename)
      );
    } else {
      alert("File deletion failed: " + result.message);
    }
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
        {/* <div className="mt-10 w-full">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Available embeded codes
          </h2>
          {audioFiles.length > 0 ? (
            <ul className="w-full ">
              {audioFiles.map((file, index) => (
                <li key={file.name} className="mb-4 flex gap-2 md:gap-8 items-center">
                  <a
                    href={file.download_url}
                    className="text-blue-500 flex "
                  >
                    <span className="text-black">{index + 1}. </span>

                    {file.name}
                  </a>
                  <button
                    onClick={() => handleEmbed(`https://1on1-audio.vercel.app/embeded/${file.name}`)}
                    className="bg-blue-500 text-white font-semibold p-2 rounded-lg mt-2 hover:bg-blue-600 transition-colors text-xs md:text-base"
                  >
                    Get Embeded Code
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="text-red-500 underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No embeded codes available.</p>
          )}
        </div> */}
      </div>
    </div>
  );
}


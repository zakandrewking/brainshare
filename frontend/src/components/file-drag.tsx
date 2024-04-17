"use client";

import { useState } from "react";

export default function FileDrag() {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    //   for (let i = 0; i < e.dataTransfer.files["length"]; i++) {
    //     setFiles((prevState: any) => [...prevState, e.dataTransfer.files[i]]);
    //   }
    // }
  }

  function handleDragLeave(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragEnter(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const dashBoxClasses =
    "w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center";

  return (
    <div
      className="w-full h-[calc(100vh-4rem)] z-100 relative top-0 left-0 p-4"
      onDragEnter={handleDragEnter}
      onSubmit={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      <div
        className={
          isDragging ? `block ${dashBoxClasses}` : `hidden ${dashBoxClasses}`
        }
      >
        Upload file
      </div>
    </div>
  );
}

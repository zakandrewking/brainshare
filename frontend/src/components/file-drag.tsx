"use client";

import { ReactNode, useState } from "react";

export default function FileDrag({ children }: { children: ReactNode }) {
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

  const parentBoxClasses = "w-full flex-grow z-100 p-4";
  const dashBoxClasses =
    "w-full h-[calc(100vh-8rem)] fixed top-16 left-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center";

  return (
    <div
      className={parentBoxClasses}
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
      {children}
    </div>
  );
}

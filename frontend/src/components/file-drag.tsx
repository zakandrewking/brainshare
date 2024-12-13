"use client";

import React from "react";

interface FileDragProps {
  children: React.ReactNode;
  onFilesChange: (files: FileList) => void;
}

export default function FileDrag({ children, onFilesChange }: FileDragProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      onFilesChange(droppedFiles);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const parentBoxClasses = "w-full h-full";
  const dashBoxClasses =
    "w-[calc(100vw-8px)] h-[calc(100vh-72px)] m-1 fixed top-[64px] left-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs z-50";

  return (
    <div
      className={parentBoxClasses}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      {isDragging && (
        <div className={dashBoxClasses}>
          <p className="text-lg font-medium">Drop files here to upload</p>
        </div>
      )}
      {children}
    </div>
  );
}

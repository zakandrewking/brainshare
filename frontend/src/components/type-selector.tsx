"use client";

import React from "react";

interface TypeSelectorProps {
  header: string;
  onTypeChange: (type: string) => void;
}

export default function TypeSelector({
  header,
  onTypeChange,
}: TypeSelectorProps) {
  const types = ["UniProt ID", "Ensembl ID", "RefSeq ID", "Gene Name"];

  return (
    <div className="relative inline-block text-left">
      <select
        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"
        onChange={(e) => onTypeChange(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          {header}
        </option>
        {types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}

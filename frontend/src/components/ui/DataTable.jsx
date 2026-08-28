import React from 'react';

export default function DataTable({ columns, data, onSort, sortConfig }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-white uppercase bg-sidebar border-b border-border">
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                className={`px-4 py-3 ${col.sortable ? 'cursor-pointer hover:bg-black/20' : ''}`}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{col.label}</span>
                  {col.sortable && sortConfig?.key === col.key && (
                    <span className="text-accent">
                      {sortConfig.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-card border-b border-border/50 hover:bg-card-elevated transition-colors">
              {columns.map((col) => (
                <td key={`${rowIndex}-${col.key}`} className="px-4 py-4 whitespace-nowrap text-black">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

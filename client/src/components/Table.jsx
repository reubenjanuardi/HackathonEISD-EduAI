import React from 'react';

const Table = ({ columns, data, emptyMessage = 'No data available' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-700">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-sm font-semibold text-neutral-300"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors"
            >
              {columns.map((column, colIdx) => (
                <td key={colIdx} className="px-4 py-3 text-sm text-neutral-200">
                  {column.render 
                    ? column.render(row[column.accessor], row, rowIdx)
                    : row[column.accessor]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DataPortal() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [visibleCols, setVisibleCols] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState("");
  const [newColName, setNewColName] = useState("");
  const [newColLogic, setNewColLogic] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const loadFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const cols = Object.keys(json[0] || {});
      const fileObj = { name: file.name, data: json, columns: cols };
      setFiles((prev) => [...prev, fileObj]);
      setActiveFile(fileObj);
      setData(json);
      setColumns(cols);
      setVisibleCols(cols);
      setPage(1);
    };
    reader.readAsBinaryString(file);
  };

  const applyNewColumn = () => {
    if (!newColName || !newColLogic || !activeFile) return;

    try {
      const updatedData = data.map((row) => ({
        ...row,
        [newColName]: Function("row", `return (${newColLogic})`)(row),
      }));

      const updatedColumns = [...columns, newColName];

      const updatedFile = {
        ...activeFile,
        data: updatedData,
        columns: updatedColumns,
      };

      setFiles((prev) =>
        prev.map((f) => (f.name === activeFile.name ? updatedFile : f))
      );

      setActiveFile(updatedFile);
      setData(updatedData);
      setColumns(updatedColumns);
      setVisibleCols((prev) => [...prev, newColName]);

      setNewColName("");
      setNewColLogic("");
    } catch (e) {
      console.error(e);
      alert("Invalid logic. Example: row.Price * row.Qty");
    }
  };

  const filtered = useMemo(() => {
    if (!filter) return data;
    return data.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} p-6 min-h-screen`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold">📊 Advanced Data Portal</h1>
        <Button variant="outline" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>

      {/* File Upload & Controls */}
      <Card className={`${darkMode ? 'bg-gray-800' : 'bg-white'} mb-6 shadow-lg`}>
        <CardContent className="flex flex-col gap-4 p-5">
          {/* File Upload */}
          <Input
            type="file"
            multiple
            accept=".csv,.xlsx"
            className="mb-2"
            onChange={(e) => [...e.target.files].forEach(loadFile)}
          />

          {/* File Buttons */}
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f) => (
              <Button
                key={f.name}
                variant={activeFile?.name === f.name ? "default" : "outline"}
                onClick={() => {
                  setActiveFile(f);
                  setData(f.data);
                  setColumns(f.columns);
                  setVisibleCols(f.columns);
                }}
              >
                {f.name}
              </Button>
            ))}
          </div>

          {/* Global Filter */}
          <Input
            placeholder="Search in all columns..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {/* Add Column */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            <Input
              placeholder="New column name"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
            />
            <Input
              placeholder="Logic (ex: row.Price * row.Qty)"
              value={newColLogic}
              onChange={(e) => setNewColLogic(e.target.value)}
            />
            <Button onClick={applyNewColumn}>Add Column</Button>
          </div>

          {/* Column Visibility */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-2 mb-2">
              <Button size="sm" variant="outline" onClick={() => setVisibleCols([])}>Hide All</Button>
              <Button size="sm" variant="outline" onClick={() => setVisibleCols(columns)}>Show All</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {columns.map((c) => (
                <label key={c} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={visibleCols.includes(c)}
                    onChange={() =>
                      setVisibleCols((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                      )
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-auto rounded-xl shadow-lg">
        <table className={`min-w-full border-collapse border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} sticky top-0`}>
            <tr>
              {visibleCols.map((c) => (
                <th key={c} className="px-4 py-2 border text-left text-sm font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={i} className={`${darkMode ? (i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700') : (i % 2 === 0 ? 'bg-white' : 'bg-gray-50')} hover:bg-indigo-100 dark:hover:bg-indigo-600 transition`}>
                {visibleCols.map((c) => (
                  <td key={c} className="px-4 py-2 border text-sm">{row[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-2">
        <div className="text-sm">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

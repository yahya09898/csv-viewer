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

  const bgColor = darkMode ? 'bg-black' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-black';
  const cardBg = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const headerBg = darkMode ? 'bg-gray-800' : 'bg-gray-100';
  const rowEvenBg = darkMode ? 'bg-gray-900' : 'bg-white';
  const rowOddBg = darkMode ? 'bg-gray-800' : 'bg-gray-50';

  return (
    <div className={`${bgColor} ${textColor} p-6 max-w-7xl mx-auto min-h-screen transition-colors duration-300`}> 
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">📊 Advanced Data Portal</h1>
        <Button variant="outline" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>

      <Card className={`${cardBg} p-4 mb-6 shadow-lg rounded-xl transition-colors duration-300`}> 
        <CardContent className="flex flex-col gap-4">
          <Input type="file" multiple accept=".csv,.xlsx" onChange={(e) => [...e.target.files].forEach(loadFile)} className="mb-2" />

          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f) => (
              <Button key={f.name} variant={activeFile?.name === f.name ? "default" : "outline"}
                className="transition-colors duration-200"
                onClick={() => {
                  setActiveFile(f);
                  setData(f.data);
                  setColumns(f.columns);
                  setVisibleCols(f.columns);
                }}>
                {f.name}
              </Button>
            ))}
          </div>

          <Input placeholder="Search..." value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <Input placeholder="New column name" value={newColName} onChange={(e) => setNewColName(e.target.value)} />
            <Input placeholder="Logic (ex: row.Price * row.Qty)" value={newColLogic} onChange={(e) => setNewColLogic(e.target.value)} />
            <Button onClick={applyNewColumn} className="w-full md:w-auto">Add Column</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setVisibleCols([])}>Hide All</Button>
            <Button size="sm" variant="outline" onClick={() => setVisibleCols(columns)}>Show All</Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {columns.map((c) => (
              <label key={c} className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={visibleCols.includes(c)}
                  onChange={() => setVisibleCols(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} />
                {c}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-auto rounded-xl shadow mb-4">
        <table className={`min-w-full border ${borderColor} transition-colors duration-300`}>
          <thead className={`${headerBg} transition-colors duration-300`}> 
            <tr>
              {visibleCols.map((c) => <th key={c} className="px-4 py-2 border text-left text-sm">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? rowEvenBg : rowOddBg}>
                {visibleCols.map((c) => <td key={c} className="px-4 py-2 border text-sm">{row[c]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm font-medium">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

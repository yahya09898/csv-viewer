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

  const darkBg = 'bg-gray-900';
  const darkCard = 'bg-gray-800';
  const darkTableHeader = 'bg-gray-700';
  const darkTableRowEven = 'bg-gray-800';
  const darkTableRowOdd = 'bg-gray-700';
  const darkText = 'text-gray-100';
  const darkBorder = 'border-gray-600';

  return (
    <div className={`${darkMode ? darkBg : 'bg-white'} ${darkMode ? darkText : 'text-black'} p-6 max-w-7xl mx-auto min-h-screen`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📊 Advanced Data Portal</h1>
        <Button variant="outline" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>

      <Card className={`${darkMode ? darkCard : ''} mb-4`}>
        <CardContent className="flex flex-col gap-4 p-4">
          <Input type="file" multiple accept=".csv,.xlsx" onChange={(e) => [...e.target.files].forEach(loadFile)} />
          <div className="flex gap-2 flex-wrap">
            {files.map((f) => (
              <Button key={f.name} variant={activeFile?.name === f.name ? "default" : "outline"}
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

          <Input placeholder="Global filter..." value={filter} onChange={(e) => setFilter(e.target.value)} />

          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="New column name" value={newColName} onChange={(e) => setNewColName(e.target.value)} />
            <Input placeholder="Logic (ex: row.Price * row.Qty)" value={newColLogic} onChange={(e) => setNewColLogic(e.target.value)} />
            <Button onClick={applyNewColumn}>Add Column</Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setVisibleCols([])}>Hide All</Button>
              <Button size="sm" variant="outline" onClick={() => setVisibleCols(columns)}>Show All</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {columns.map((c) => (
                <label key={c} className="text-sm flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={visibleCols.includes(c)}
                    onChange={() =>
                      setVisibleCols((prev) =>
                        prev.includes(c)
                          ? prev.filter((x) => x !== c)
                          : [...prev, c]
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

      <div className="overflow-auto rounded-xl shadow">
        <table className={`min-w-full border ${darkMode ? darkBorder : ''}`}>
          <thead className={`${darkMode ? darkTableHeader : 'bg-gray-100'}`}>
            <tr>
              {visibleCols.map((c) => (
                <th key={c} className="px-3 py-2 border text-left text-sm">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={i} className={`${darkMode ? (i % 2 === 0 ? darkTableRowEven : darkTableRowOdd) : (i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}`}>
                {visibleCols.map((c) => (
                  <td key={c} className="px-3 py-2 border text-sm">{row[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

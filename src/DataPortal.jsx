import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

const Button = ({ children, ...props }) => (
  <button {...props} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "6px" }}>
    {children}
  </button>
);

const Input = (props) => (
  <input {...props} style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "6px" }} />
);

const Card = ({ children }) => (
  <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
    {children}
  </div>
);

export default function DataPortal() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filter, setFilter] = useState("");

  const loadFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      setData(json);
      setColumns(Object.keys(json[0] || {}));
    };
    reader.readAsBinaryString(file);
  };

  const filtered = useMemo(() => {
    if (!filter) return data;
    return data.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(filter.toLowerCase()))
    );
  }, [data, filter]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Advanced Data Portal</h2>

      <Card>
        <Input type="file" accept=".csv,.xlsx" onChange={(e) => loadFile(e.target.files[0])} />
        <br /><br />
        <Input placeholder="Search..." value={filter} onChange={(e) => setFilter(e.target.value)} />
      </Card>

      <table border="1" cellPadding="6">
        <thead>
          <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i}>
              {columns.map(c => <td key={c}>{row[c]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

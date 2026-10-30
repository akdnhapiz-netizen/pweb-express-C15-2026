import { readFileSync, writeFileSync } from "node:fs";

const convert = (name: string) => {
  const lines = readFileSync(`data/${name}.csv`, "utf-8").trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string | number | null> = {};

    headers.forEach((header, i) => {
      const value = values[i]?.trim() ?? "";
      if (value === "") row[header] = null;                 // kosong → null
      else if (/^\d+$/.test(value)) row[header] = Number(value); // angka → number
      else row[header] = value;                             // sisanya → string
    });

    return row;
  });

  writeFileSync(`data/${name}.json`, JSON.stringify(rows, null, 2));
  console.log(`data/${name}.json: ${rows.length} data`);
};

convert("heroes");
convert("skins");

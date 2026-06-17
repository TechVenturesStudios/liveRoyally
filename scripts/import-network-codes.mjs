#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HEADER_ALIASES = {
  zipcode: "zipCode",
  zip: "zipCode",
  parish: "parish",
  county: "parish",
  networkname: "networkName",
  network: "networkName",
  networkcode: "networkCode",
  state: "state",
};

function normalizeHeader(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeZip(value) {
  const zip = String(value || "").replace(/\D/g, "").slice(0, 5);
  if (!zip) return "";
  return zip.padStart(5, "0");
}

function optionalString(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsv(content) {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

async function readRows(filePath, sheetName) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".csv") {
    const content = await fs.readFile(filePath, "utf8");
    return parseCsv(content);
  }

  if ([".xlsx", ".xls"].includes(extension)) {
    let xlsx;
    try {
      xlsx = await import("xlsx");
    } catch {
      throw new Error("Excel imports require the xlsx package. Install it with: npm install xlsx");
    }

    const workbook = xlsx.readFile(filePath);
    const selectedSheet = sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[selectedSheet];

    if (!worksheet) {
      throw new Error(`Sheet not found: ${selectedSheet}`);
    }

    return xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  }

  throw new Error("Unsupported file type. Use a .csv, .xlsx, or .xls file.");
}

function normalizeRow(row, rowNumber) {
  const normalized = {};

  for (const [header, value] of Object.entries(row)) {
    const field = HEADER_ALIASES[normalizeHeader(header)];
    if (field) normalized[field] = value;
  }

  const zipCode = normalizeZip(normalized.zipCode);
  const networkName = optionalString(normalized.networkName);
  const networkCode = optionalString(normalized.networkCode);

  if (zipCode.length !== 5) {
    throw new Error(`Row ${rowNumber}: ZIP_Code must contain a 5-digit zip code`);
  }

  if (!networkName) {
    throw new Error(`Row ${rowNumber}: Network_Name is required`);
  }

  if (!networkCode) {
    throw new Error(`Row ${rowNumber}: Network_Code is required`);
  }

  return {
    zip_code: zipCode,
    parish: optionalString(normalized.parish),
    network_name: networkName,
    network_code: networkCode,
    state: optionalString(normalized.state)?.toUpperCase() ?? null,
  };
}

function parseArgs(argv) {
  const args = {
    filePath: "",
    sheetName: "",
    dryRun: false,
    truncate: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--sheet") {
      args.sheetName = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--truncate") {
      args.truncate = true;
    } else if (!args.filePath) {
      args.filePath = arg;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.filePath) {
    console.error("Usage: npm run network-codes:import -- <file.csv|file.xlsx> [--sheet Sheet1] [--dry-run] [--truncate]");
    process.exitCode = 1;
    return;
  }

  const filePath = path.resolve(args.filePath);
  const rows = await readRows(filePath, args.sheetName);
  const records = rows.map((row, index) => normalizeRow(row, index + 2));
  const uniqueRecords = Array.from(new Map(records.map((record) => [record.zip_code, record])).values());

  console.log(`Read ${rows.length} row(s); prepared ${uniqueRecords.length} unique ZIP code record(s).`);

  if (args.dryRun) {
    console.table(uniqueRecords.slice(0, 10));
    if (uniqueRecords.length > 10) console.log(`...and ${uniqueRecords.length - 10} more`);
    return;
  }

  if (args.truncate) {
    await prisma.network_codes.deleteMany();
    console.log("Cleared existing network code records.");
  }

  for (const record of uniqueRecords) {
    await prisma.network_codes.upsert({
      where: { zip_code: record.zip_code },
      update: {
        parish: record.parish,
        network_name: record.network_name,
        network_code: record.network_code,
        state: record.state,
        updated_at: new Date(),
      },
      create: record,
    });
  }

  console.log(`Imported ${uniqueRecords.length} network code record(s).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

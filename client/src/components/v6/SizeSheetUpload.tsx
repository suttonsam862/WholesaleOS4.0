import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SizeQuantities, ADULT_SIZES, YOUTH_SIZES } from "./SizeGrid";

interface SizeSheetUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  onImport: (lineItems: ParsedLineItem[]) => void;
}

interface ParsedLineItem {
  productType: string;
  styleName: string;
  styleNumber?: string;
  color: string;
  quantities: SizeQuantities;
  unitPrice: number;
}

interface ParsedRow {
  id: string;
  selected: boolean;
  data: Record<string, string>;
  parsed: Partial<ParsedLineItem>;
  errors: string[];
}

interface ColumnMapping {
  productType: string;
  styleName: string;
  styleNumber: string;
  color: string;
  unitPrice: string;
  // Size columns are mapped dynamically
}

const ALL_SIZES = [...YOUTH_SIZES, ...ADULT_SIZES];

const COLUMN_OPTIONS = [
  { value: "", label: "-- Skip --" },
  { value: "productType", label: "Product Type" },
  { value: "styleName", label: "Style Name" },
  { value: "styleNumber", label: "Style Number" },
  { value: "color", label: "Color" },
  { value: "unitPrice", label: "Unit Price" },
  ...ALL_SIZES.map((size) => ({ value: `size_${size}`, label: `Size: ${size}` })),
];

export function SizeSheetUpload({
  open,
  onOpenChange,
  orderId,
  onImport,
}: SizeSheetUploadProps) {
  const [step, setStep] = useState<"upload" | "map" | "review">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  const { toast } = useToast();

  // Parse CSV/Excel file
  const parseFileMutation = useMutation({
    mutationFn: async (file: File): Promise<string[][]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (!text) {
            reject(new Error("Failed to read file"));
            return;
          }

          // Simple CSV parsing (handles basic cases)
          const lines = text.split(/\r?\n/).filter((line) => line.trim());
          const rows = lines.map((line) => {
            // Handle quoted values with commas
            const result: string[] = [];
            let current = "";
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          });

          resolve(rows);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },
    onSuccess: (rows) => {
      if (rows.length === 0) {
        toast({
          title: "Empty file",
          description: "The uploaded file contains no data.",
          variant: "destructive",
        });
        return;
      }

      setRawData(rows);
      const firstRow = rows[0] || [];
      setHeaders(firstRow);

      // Auto-detect column mappings
      const autoMapping: Record<string, string> = {};
      firstRow.forEach((header, index) => {
        const headerLower = header.toLowerCase().trim();
        const colKey = `col_${index}`;

        // Product type detection
        if (headerLower.includes("product") || headerLower.includes("type") || headerLower.includes("item")) {
          autoMapping[colKey] = "productType";
        }
        // Style name detection
        else if (headerLower.includes("style") && !headerLower.includes("number") && !headerLower.includes("#")) {
          autoMapping[colKey] = "styleName";
        }
        // Style number detection
        else if (headerLower.includes("style") && (headerLower.includes("number") || headerLower.includes("#"))) {
          autoMapping[colKey] = "styleNumber";
        }
        // Color detection
        else if (headerLower.includes("color") || headerLower.includes("colour")) {
          autoMapping[colKey] = "color";
        }
        // Price detection
        else if (headerLower.includes("price") || headerLower.includes("cost") || headerLower.includes("$")) {
          autoMapping[colKey] = "unitPrice";
        }
        // Size detection
        else {
          const sizeMatch = ALL_SIZES.find(
            (size) =>
              headerLower === size.toLowerCase() ||
              headerLower === `size ${size.toLowerCase()}` ||
              headerLower === `qty ${size.toLowerCase()}`
          );
          if (sizeMatch) {
            autoMapping[colKey] = `size_${sizeMatch}`;
          }
        }
      });

      setColumnMapping(autoMapping);
      setStep("map");
    },
    onError: (error: Error) => {
      toast({
        title: "Parse error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      const isValidType =
        validTypes.includes(selectedFile.type) ||
        selectedFile.name.endsWith(".csv") ||
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls");

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      parseFileMutation.mutate(selectedFile);
    },
    [parseFileMutation, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        setFile(droppedFile);
        parseFileMutation.mutate(droppedFile);
      }
    },
    [parseFileMutation]
  );

  const applyMapping = () => {
    const dataRows = hasHeaderRow ? rawData.slice(1) : rawData;
    const newParsedRows: ParsedRow[] = dataRows.map((row, rowIndex) => {
      const parsed: Partial<ParsedLineItem> = {
        quantities: {},
      };
      const errors: string[] = [];
      const data: Record<string, string> = {};

      row.forEach((cell, colIndex) => {
        const colKey = `col_${colIndex}`;
        const mapping = columnMapping[colKey];
        data[colKey] = cell;

        if (!mapping || !cell) return;

        if (mapping === "productType") {
          parsed.productType = cell;
        } else if (mapping === "styleName") {
          parsed.styleName = cell;
        } else if (mapping === "styleNumber") {
          parsed.styleNumber = cell;
        } else if (mapping === "color") {
          parsed.color = cell;
        } else if (mapping === "unitPrice") {
          const price = parseFloat(cell.replace(/[$,]/g, ""));
          if (isNaN(price)) {
            errors.push(`Invalid price: ${cell}`);
          } else {
            parsed.unitPrice = price;
          }
        } else if (mapping.startsWith("size_")) {
          const size = mapping.replace("size_", "");
          const qty = parseInt(cell, 10);
          if (!isNaN(qty) && qty > 0) {
            parsed.quantities![size] = qty;
          }
        }
      });

      // Validation
      if (!parsed.productType) errors.push("Missing product type");
      if (!parsed.styleName) errors.push("Missing style name");
      if (!parsed.color) errors.push("Missing color");
      if (!parsed.unitPrice && parsed.unitPrice !== 0) errors.push("Missing unit price");
      if (Object.keys(parsed.quantities || {}).length === 0) {
        errors.push("No quantities specified");
      }

      return {
        id: `row_${rowIndex}`,
        selected: errors.length === 0,
        data,
        parsed,
        errors,
      };
    });

    setParsedRows(newParsedRows);
    setStep("review");
  };

  const handleImport = () => {
    const validItems = parsedRows
      .filter((row) => row.selected && row.errors.length === 0)
      .map((row) => row.parsed as ParsedLineItem);

    if (validItems.length === 0) {
      toast({
        title: "No valid items",
        description: "Please select at least one valid row to import.",
        variant: "destructive",
      });
      return;
    }

    onImport(validItems);
    handleClose();
    toast({
      title: "Import successful",
      description: `${validItems.length} line item(s) imported.`,
    });
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMapping({});
    setParsedRows([]);
    setHasHeaderRow(true);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      "Product Type",
      "Style Name",
      "Style Number",
      "Color",
      "Unit Price",
      ...ADULT_SIZES,
    ];
    const templateRow = [
      "T-Shirt",
      "Gildan 5000",
      "G500",
      "Navy",
      "15.00",
      "0", // XS
      "5", // S
      "10", // M
      "10", // L
      "5", // XL
      "2", // 2XL
      "0", // 3XL
      "0", // 4XL
    ];

    const csv = [templateHeaders.join(","), templateRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "size_sheet_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter((r) => r.selected && r.errors.length === 0).length;
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Size Sheet</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with your size breakdown
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="py-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                "hover:border-primary hover:bg-muted/50",
                parseFileMutation.isPending && "pointer-events-none opacity-50"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {parseFileMutation.isPending ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Parsing file...</p>
                </div>
              ) : (
                <>
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drag & drop your size sheet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse (CSV, XLS, XLSX)
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="size-sheet-upload"
                  />
                  <label htmlFor="size-sheet-upload">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Select File
                      </span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Need a template?{" "}
                <button
                  onClick={downloadTemplate}
                  className="text-primary hover:underline"
                >
                  Download sample CSV
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "map" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasHeader"
                  checked={hasHeaderRow}
                  onCheckedChange={(checked) => setHasHeaderRow(!!checked)}
                />
                <Label htmlFor="hasHeader">First row is header</Label>
              </div>
              <div className="text-sm text-muted-foreground">
                File: {file?.name} ({rawData.length} rows)
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead key={index} className="min-w-[150px]">
                        <div className="space-y-2">
                          <div className="font-medium truncate" title={header}>
                            {header || `Column ${index + 1}`}
                          </div>
                          <Select
                            value={columnMapping[`col_${index}`] || ""}
                            onValueChange={(val) =>
                              setColumnMapping((prev) => ({
                                ...prev,
                                [`col_${index}`]: val,
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Map to..." />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMN_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawData.slice(hasHeaderRow ? 1 : 0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="truncate max-w-[150px]">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={applyMapping}>
                Continue to Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Import */}
        {step === "review" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{validCount} valid</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">{errorCount} with errors</span>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Product Type</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => {
                    const totalQty = Object.values(row.parsed.quantities || {}).reduce(
                      (sum, q) => sum + q,
                      0
                    );
                    const hasErrors = row.errors.length > 0;

                    return (
                      <TableRow
                        key={row.id}
                        className={cn(hasErrors && "bg-red-50")}
                      >
                        <TableCell>
                          <Checkbox
                            checked={row.selected}
                            disabled={hasErrors}
                            onCheckedChange={(checked) =>
                              setParsedRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? { ...r, selected: !!checked }
                                    : r
                                )
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>{row.parsed.productType || "-"}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {row.parsed.styleName || "-"}
                            </div>
                            {row.parsed.styleNumber && (
                              <div className="text-xs text-muted-foreground">
                                #{row.parsed.styleNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{row.parsed.color || "-"}</TableCell>
                        <TableCell>
                          {row.parsed.unitPrice !== undefined
                            ? `$${row.parsed.unitPrice.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>{totalQty}</TableCell>
                        <TableCell>
                          {hasErrors ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">{row.errors[0]}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Valid</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" onClick={() => setStep("map")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={validCount === 0}>
                  Import {validCount} Item{validCount !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SizeSheetUpload;

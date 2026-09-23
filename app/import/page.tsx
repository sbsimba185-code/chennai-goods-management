"use client";

import {
  ChangeEvent,
  useState
} from "react";

type ImportResult = {
  imported: number;
  duplicates: number;
  errors: number;
  duplicateDetails?: Array<{
    row: number;
    lr_number: string;
    message: string;
  }>;
  errorDetails?: Array<{
    row: number;
    message: string;
  }>;
};

export default function ImportPage() {
  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<ImportResult | null>(null);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0] || null;

    setFile(selectedFile);
    setError("");
    setResult(null);
  }

  async function handleImport() {
    if (!file) {
      setError(
        "Please select an Excel file."
      );
      return;
    }

    const confirmed = window.confirm(
      "Import this Excel file into the shipment database?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/import",
        {
          method: "POST",
          body: formData
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Import failed."
        );
        return;
      }

      setResult(data);
      setFile(null);

      const input =
        document.getElementById(
          "excel-file"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="import-page">
      <div className="import-container">
        <div className="import-header">
          <h1>Excel Import</h1>

          <p>
            Import shipment records from an
            Excel file.
          </p>
        </div>

        <section className="import-card">
          <h2>
            Select Excel File
          </h2>

          <p className="import-help">
            The first row should contain the
            column names.
          </p>

          <div className="import-columns">
            <span>Date</span>
            <span>LR Number</span>
            <span>Src</span>
            <span>Consignor</span>
            <span>Consignee</span>
            <span>Art</span>
            <span>Art Type</span>
            <span>Amount</span>
            <span>Delivery To</span>
          </div>

          <div className="file-input-wrapper">
            <label
              htmlFor="excel-file"
              className="file-label"
            >
              Choose Excel File
            </label>

            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={
                handleFileChange
              }
            />
          </div>

          {file && (
            <div className="selected-file">
              <strong>
                Selected file:
              </strong>

              <span>
                {file.name}
              </span>
            </div>
          )}

          <button
            className="import-button"
            onClick={handleImport}
            disabled={
              !file || loading
            }
          >
            {loading
              ? "Importing..."
              : "Import Excel"}
          </button>

          {error && (
            <div className="import-error">
              {error}
            </div>
          )}
        </section>

        {result && (
          <ImportResultCard
            result={result}
          />
        )}

        <section className="duplicate-info">
          <h2>
            Duplicate Rule
          </h2>

          <p>
            The LR number alone is not used
            to detect duplicates.
          </p>

          <p>
            A shipment is considered a
            duplicate only when all 9
            imported fields match:
          </p>

          <ol>
            <li>Date</li>
            <li>LR Number</li>
            <li>Src</li>
            <li>Consignor</li>
            <li>Consignee</li>
            <li>Art</li>
            <li>Art Type</li>
            <li>Amount</li>
            <li>Delivery To</li>
          </ol>

          <p>
            Therefore, the same LR number can
            exist more than once if any other
            shipment detail is different.
          </p>
        </section>
      </div>
    </main>
  );
}

function ImportResultCard({
  result
}: {
  result: ImportResult;
}) {
  return (
    <section className="import-result">
      <h2>
        Import Completed
      </h2>

      <div className="import-summary">
        <div>
          <span>Imported</span>
          <strong>
            {result.imported}
          </strong>
        </div>

        <div>
          <span>Duplicates</span>
          <strong>
            {result.duplicates}
          </strong>
        </div>

        <div>
          <span>Errors</span>
          <strong>
            {result.errors}
          </strong>
        </div>
      </div>

      {result.duplicateDetails &&
        result.duplicateDetails
          .length > 0 && (
          <div className="import-detail-section">
            <h3>
              Duplicate Rows
            </h3>

            {result.duplicateDetails.map(
              (item, index) => (
                <div
                  key={index}
                  className="import-detail duplicate"
                >
                  <strong>
                    Row {item.row}
                  </strong>

                  <span>
                    LR: {item.lr_number}
                  </span>

                  <span>
                    {item.message}
                  </span>
                </div>
              )
            )}
          </div>
        )}

      {result.errorDetails &&
        result.errorDetails
          .length > 0 && (
          <div className="import-detail-section">
            <h3>
              Error Rows
            </h3>

            {result.errorDetails.map(
              (item, index) => (
                <div
                  key={index}
                  className="import-detail error"
                >
                  <strong>
                    Row {item.row}
                  </strong>

                  <span>
                    {item.message}
                  </span>
                </div>
              )
            )}
          </div>
        )}
    </section>
  );
              }

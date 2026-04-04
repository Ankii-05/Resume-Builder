import { useRef } from "react";
import { FileUp } from "lucide-react";

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 5 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function validateFile(file) {
  if (!file) return "No file selected.";
  if (file.size > MAX_BYTES) return "File must be 5MB or smaller.";
  if (file.type !== PDF_MIME && file.type !== DOCX_MIME) {
    return "Only PDF or Word (.docx) files are allowed.";
  }
  return null;
}

export default function UploadZone({ file, onFileChange, dragOver, setDragOver, error, setLocalError }) {
  const inputRef = useRef(null);

  const pickFile = (f) => {
    const msg = validateFile(f);
    if (msg) {
      if (setLocalError) setLocalError(msg);
      return;
    }
    if (setLocalError) setLocalError(null);
    onFileChange(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    pickFile(f);
  };

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    pickFile(f);
    e.target.value = "";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-violet-500 bg-violet-50/80 shadow-md shadow-violet-100"
            : "border-violet-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-200">
            <FileUp className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900">
            Drag & drop your resume here
          </p>
          <p className="text-xs text-gray-600 font-medium">
            or click to browse · PDF or Word (.docx) · Max 5MB
          </p>
        </div>
      </div>

      {file && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileChange(null);
              if (setLocalError) setLocalError(null);
            }}
            className="shrink-0 text-sm font-bold text-violet-700 hover:text-fuchsia-600 transition-colors px-2 py-1 rounded-lg hover:bg-white"
            aria-label="Remove file"
          >
            ✕
          </button>
        </div>
      )}

      {(error || "").trim() ? (
        <p className={`mt-3 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

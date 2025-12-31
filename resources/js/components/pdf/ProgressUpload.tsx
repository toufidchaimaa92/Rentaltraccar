import { useEffect, useMemo, useState } from "react";
import { UploadCloud, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
};

type UploadStatus = "idle" | "uploading" | "ready" | "error";

interface ProgressUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string[];
  maxSize?: number;
  error?: string;
}

export function ProgressUpload({
  file,
  onFileChange,
  accept = ["image/png", "image/jpg", "image/jpeg"],
  maxSize = 5 * 1024 * 1024,
  error,
}: ProgressUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const dropzone = useDropzone({
    multiple: false,
    maxSize,
    accept: accept.reduce<Record<string, string[]>>((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    onDrop: (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const tooLarge = rejection.errors.find((e) => e.code === "file-too-large");
        setLocalError(
          tooLarge
            ? `Fichier trop volumineux (max ${formatBytes(maxSize)})`
            : "Fichier invalide"
        );
        setStatus("error");
        onFileChange(null);
        return;
      }

      const selected = acceptedFiles[0];
      if (!selected) return;

      setLocalError(null);
      setStatus("uploading");
      setProgress(0);
      onFileChange(selected);

      const url = URL.createObjectURL(selected);
      setPreview(url);

      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + 15, 100);
        setProgress(current);
        if (current >= 100) {
          clearInterval(timer);
          setStatus("ready");
        }
      }, 250);
    },
  });

  const displayError = useMemo(() => localError ?? error, [localError, error]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setStatus("idle");
      setProgress(0);
    }
  }, [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <Card
      className={cn(
        "border-dashed transition-colors",
        dropzone.isDragActive
          ? "border-primary bg-primary/5"
          : "bg-muted/30",
        displayError && "border-destructive/40"
      )}
    >
      <div
        {...dropzone.getRootProps()}
        className="flex cursor-pointer flex-col gap-3 px-4"
      >
        <input {...dropzone.getInputProps()} className="sr-only" />

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg border bg-background",
              dropzone.isDragActive && "border-primary"
            )}
          >
            <UploadCloud
              className={cn(
                "h-5 w-5",
                dropzone.isDragActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            {!file ? (
              <>
                <p className="text-sm font-medium">
                  Glissez-déposez ou cliquez pour importer
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG / JPG · Max {formatBytes(maxSize)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </>
            )}
          </div>

          {file && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                onFileChange(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* PREVIEW */}
        {preview ? (
          <div className="flex items-center gap-3 rounded-md border bg-background p-3">
            <div className="relative h-16 w-12 overflow-hidden rounded-md border">
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Progress
                  value={status === "ready" ? 100 : progress}
                  className="h-1 flex-1"
                />
                {status === "ready" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {status === "ready" ? "Fichier prêt" : "Préparation..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border bg-background p-3 text-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aucun fichier</p>
              <p className="text-xs text-muted-foreground">
                Cliquez ou déposez un visuel
              </p>
            </div>
          </div>
        )}

        {displayError && (
          <p className="text-xs text-destructive">{displayError}</p>
        )}
      </div>
    </Card>
  );
}

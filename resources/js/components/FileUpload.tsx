import React, { useCallback, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, UploadCloud, X, CheckCircle2 } from "lucide-react";

type UploadedResponse = {
  url: string;        // public URL the backend returns
  path: string;       // storage path
  original_name: string;
  size: number;
  mime: string;
};

type UploadItem = {
  id: string;
  file: File;
  previewUrl?: string;
  progress: number;        // 0..100
  status: "queued" | "uploading" | "done" | "error" | "canceled";
  error?: string;
  response?: UploadedResponse;
  abort?: AbortController;
};

export interface FileUploadProps {
  /** POST endpoint (e.g. `/uploads/carte`, `/uploads/car`, `/uploads/rental`) */
  action: string;
  /** Form field name (defaults to "file") */
  fieldName?: string;
  /** Allow selecting multiple files */
  multiple?: boolean;
  /** Accept attribute (e.g. "image/*") */
  accept?: string;
  /** Max file size in MB (client-side guard) */
  maxSizeMB?: number;
  /** Extra form fields to send (e.g. { entity_id: 123, entity_type: 'car' }) */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Called once all uploads finish (success or not) */
  onComplete?: (items: UploadItem[]) => void;
  /** Disable the control */
  disabled?: boolean;
  /** Label text */
  label?: string;
}

export default function FileUpload({
  action,
  fieldName = "file",
  multiple = false,
  accept = "image/*",
  maxSizeMB = 10,
  params,
  onComplete,
  disabled,
  label = "Glissez-déposez ou cliquez pour choisir",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const hasActive = items.some((i) => i.status === "uploading" || i.status === "queued");

  const onPick = () => inputRef.current?.click();

  const validateFiles = (files: File[]) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return files.map((f) => {
      if (f.size > maxBytes) {
        const err: UploadItem = {
          id: crypto.randomUUID(),
          file: f,
          previewUrl: URL.createObjectURL(f),
          progress: 0,
          status: "error",
          error: `Fichier trop volumineux (> ${maxSizeMB} MB)`,
        };
        return err;
      }
      return {
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        progress: 0,
        status: "queued",
      } as UploadItem;
    });
  };

  const enqueue = (files: File[]) => {
    const next = validateFiles(files);
    setItems((prev) => [...prev, ...next]);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files ?? []);
    if (!fs.length) return;
    enqueue(multiple ? fs : [fs[0]]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    const fs = Array.from(e.dataTransfer.files ?? []);
    if (!fs.length) return;
    enqueue(multiple ? fs : [fs[0]]);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const startOne = useCallback(async (item: UploadItem) => {
    if (item.status !== "queued") return;

    const ctrl = new AbortController();

    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, status: "uploading", progress: 0, abort: ctrl } : it
      )
    );

    try {
      const fd = new FormData();
      fd.append(fieldName, item.file);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
      }

      const res = await axios.post(action, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: ctrl.signal,
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, progress: pct } : it))
          );
        },
      });

      const payload: UploadedResponse = res.data?.file ?? res.data;

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "done", progress: 100, response: payload, abort: undefined }
            : it
        )
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Échec de l’upload";
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "error", error: message, abort: undefined }
            : it
        )
      );
    }
  }, [action, fieldName, params]);

  // Start queued automatically
  useMemo(() => {
    const queued = items.filter((i) => i.status === "queued");
    if (!queued.length) return;
    // start sequentially for simplicity
    startOne(queued[0]);
  }, [items, startOne]);

  const cancel = (id: string) => {
    const it = items.find((x) => x.id === id);
    it?.abort?.abort();
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "canceled", abort: undefined } : x))
    );
  };

  const clearFinished = () => {
    setItems((prev) => prev.filter((i) => i.status === "uploading" || i.status === "queued"));
  };

  const allFinished = items.length > 0 && items.every((i) => ["done", "error", "canceled"].includes(i.status));

  useMemo(() => {
    if (allFinished && onComplete) onComplete(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFinished]);

  return (
    <Card className="w-full border border-border bg-card text-card-foreground shadow">
      <CardContent className="p-4 space-y-3">
        {/* Dropzone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition
          ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted"}
          `}
          onClick={disabled ? undefined : onPick}
        >
          <UploadCloud className="w-6 h-6 mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Types: <span className="font-medium">{accept}</span> • Taille max: {maxSizeMB}MB {multiple ? "• Multi" : ""}
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={onInputChange}
            disabled={disabled}
          />
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 border border-border rounded-lg bg-card p-2"
            >
              {/* preview */}
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                {it.previewUrl ? (
                  <img src={it.previewUrl} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{it.file.name}</span>
                  {it.status === "done" && (
                    <Badge className="gap-1" variant="secondary">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </Badge>
                  )}
                  {it.status === "error" && (
                    <Badge variant="destructive">Erreur</Badge>
                  )}
                  {it.status === "canceled" && (
                    <Badge variant="outline">Annulé</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(it.file.size / (1024 * 1024)).toFixed(2)} MB • {it.file.type || "?"}
                </div>

                {/* progress */}
                {(it.status === "uploading" || it.status === "queued" || it.status === "error" || it.status === "done") && (
                  <div className="mt-2">
                    <Progress value={it.progress} />
                    {it.error && (
                      <div className="text-xs text-red-600 mt-1">{it.error}</div>
                    )}
                  </div>
                )}
              </div>

              {/* actions */}
              <div className="flex items-center gap-2">
                {it.status === "uploading" && (
                  <Button variant="outline" size="icon" onClick={() => cancel(it.id)} title="Annuler">
                    <X className="w-4 h-4" />
                  </Button>
                )}
                {(it.status === "error" || it.status === "canceled") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // requeue
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === it.id ? { ...x, status: "queued", progress: 0, error: undefined } : x
                        )
                      );
                    }}
                  >
                    Réessayer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* footer actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={clearFinished} disabled={!items.some(i => ["done","error","canceled"].includes(i.status))}>
            Nettoyer terminés
          </Button>
          <Button size="sm" onClick={onPick} disabled={disabled || hasActive}>
            Choisir un fichier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

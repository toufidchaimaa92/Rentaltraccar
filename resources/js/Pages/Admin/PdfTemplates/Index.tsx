import { Head, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ShieldCheck,
  Trash2,
  Eye,
  FileText,
  Check,
} from "lucide-react";
import { useMemo } from "react";
import { ProgressUpload } from "@/components/pdf/ProgressUpload";

interface Background {
  id: number;
  type: string;
  name?: string | null;
  file_path: string;
  is_active: boolean;
  created_at: string;
  url: string;
}

interface Props {
  auth: { user: any };
  backgrounds: Record<string, Background[]>;
  types: { value: string; label: string }[];
}

/* ----------------------------- */
/* TEMPLATE ROW                  */
/* ----------------------------- */
function TemplateRow({ bg }: { bg: Background }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div className="flex items-center gap-3">
        <img
          src={bg.url}
          className="h-12 w-9 rounded border object-cover"
          alt=""
        />
        <div className="leading-tight">
          <p className="text-sm font-medium">
            {bg.name || "Sans nom"}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(bg.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* ACTIVATE ICON */}
        {bg.is_active ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              router.post(
                route("admin.pdf-templates.activate", bg.id),
                {},
                { preserveScroll: true }
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-emerald-50 transition"
            title="Activer"
          >
            <Check className="h-4 w-4 text-muted-foreground hover:text-emerald-600" />
          </button>
        )}

        <Button size="icon" variant="ghost" asChild>
          <a href={bg.url} target="_blank" rel="noreferrer">
            <Eye className="h-4 w-4" />
          </a>
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (confirm("Supprimer cet arrière-plan ?")) {
              router.delete(
                route("admin.pdf-templates.destroy", bg.id),
                { preserveScroll: true }
              );
            }
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------- */
/* UPLOADER                      */
/* ----------------------------- */
function TemplateUploader({ type }: { type: string }) {
  const { data, setData, post, processing, reset } = useForm({
    name: "",
    file: null as File | null,
    type,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        post(route("admin.pdf-templates.store"), {
          forceFormData: true,
          preserveScroll: true,
          onSuccess: () => reset(),
        });
      }}
      className="space-y-3"
    >
      <div className="space-y-2">
        <Label>Nom (optionnel)</Label>
        <Input
          value={data.name}
          onChange={(e) => setData("name", e.target.value)}
          placeholder="Template A4 – Bleu"
        />
      </div>

      <ProgressUpload
        file={data.file}
        onFileChange={(file) => setData("file", file)}
      />

      <Button disabled={processing} className="w-full">
        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Uploader
      </Button>
    </form>
  );
}

/* ----------------------------- */
/* PAGE                          */
/* ----------------------------- */
export default function PdfTemplatesIndex({
  auth,
  backgrounds,
  types,
}: Props) {
  const grouped = useMemo(() => backgrounds || {}, [backgrounds]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Templates PDF" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Templates PDF</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {types.map((type) => {
            const items = grouped[type.value] || [];
            const active = items.find((i) => i.is_active);

            return (
              <Card key={type.value}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      {type.label}
                    </CardTitle>

                    {active && (
                      <Badge variant="outline">
                        Actif : {active.name || "Sans nom"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <TemplateUploader type={type.value} />

                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun arrière-plan ajouté.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((bg) => (
                        <TemplateRow key={bg.id} bg={bg} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

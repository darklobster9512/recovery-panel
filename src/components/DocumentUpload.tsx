import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Shield,
  Lock,
  Server,
  FileCheck,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Loader2,
  CheckCircle,
  Download,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";
import { notifyTelegram } from "@/lib/telegramNotify";

interface Assignment {
  id: string;
  verification_title: string;
}

interface UploadedDoc {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  file_path: string;
}

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ID_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const ID_ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.pdf";

const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.pdf,.docx";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 5;

const SECURITY_BADGES = [
  { icon: Lock, label: "256-Bit SSL" },
  { icon: Shield, label: "DSGVO-konform" },
  { icon: Server, label: "Server in der EU" },
  { icon: FileCheck, label: "Ende-zu-Ende verschlüsselt" },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf") return FileText;
  return File;
}

function validateIdFile(f: File): string | null {
  if (!ID_ACCEPTED_TYPES.includes(f.type)) return "Dateityp nicht erlaubt (PNG, JPG oder PDF)";
  if (f.size > MAX_FILE_SIZE) return "Datei zu groß (max. 20MB)";
  return null;
}

export default function DocumentUpload({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [idSubmittedAt, setIdSubmittedAt] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idUploading, setIdUploading] = useState(false);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setInitialLoading(true);
      const [{ data: rows }, { data: profile }] = await Promise.all([
        supabase
          .from("verification_assignments")
          .select("id, verification_id")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("id_document_submitted_at")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      setIdSubmittedAt(profile?.id_document_submitted_at ?? null);

      if (rows && rows.length > 0) {
        const vIds = [...new Set(rows.map((r) => r.verification_id))];
        const { data: verifs } = await supabase
          .from("verifications")
          .select("id, title")
          .in("id", vIds);
        const vMap = new Map(verifs?.map((v) => [v.id, v.title]) ?? []);
        setAssignments(
          rows.map((r) => ({
            id: r.id,
            verification_title: vMap.get(r.verification_id) ?? "Auftrag",
          }))
        );
      } else {
        setAssignments([]);
      }
      setInitialLoading(false);
    })();
  }, [user]);

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const loadDocuments = useCallback(async () => {
    if (!selectedAssignment || !user) return;
    setLoadingDocs(true);
    setSignedUrls({});
    const { data } = await supabase
      .from("user_documents")
      .select("id, file_name, file_type, file_size, created_at, file_path")
      .eq("assignment_id", selectedAssignment)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const docList = (data as UploadedDoc[]) ?? [];
    setDocuments(docList);

    const paths = docList.map((d) => d.file_path);
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("user-documents")
        .createSignedUrls(paths, 3600);
      if (signed) {
        const urls: Record<string, string> = {};
        for (const s of signed) {
          if (s.signedUrl) urls[s.path ?? ""] = s.signedUrl;
        }
        setSignedUrls(urls);
      }
    }
    setLoadingDocs(false);
  }, [selectedAssignment, user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid: File[] = [];
    for (const f of arr) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: Dateityp nicht erlaubt`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: Datei zu groß (max. 20MB)`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > MAX_FILES) {
        toast.error(`Maximal ${MAX_FILES} Dateien erlaubt`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user || !selectedAssignment || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of files) {
        const ts = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${selectedAssignment}/${ts}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("user-documents")
          .upload(path, file);

        if (uploadError) {
          toast.error(`Fehler beim Hochladen von ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { error: dbError } = await supabase.from("user_documents").insert({
          user_id: user.id,
          assignment_id: selectedAssignment,
          file_name: file.name,
          file_path: path,
          file_type: file.type,
          file_size: file.size,
        });

        if (dbError) {
          toast.error(`Metadaten-Fehler: ${dbError.message}`);
        }
      }

      toast.success("Dokumente erfolgreich hochgeladen");
      // Telegram notification (fire-and-forget)
      (async () => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        const vicName = `${prof?.first_name ?? ""} ${prof?.last_name ?? ""}`.trim() || (user.email ?? "Unbekannt");
        const verificationTitle = assignments.find((a) => a.id === selectedAssignment)?.verification_title;
        for (const file of files) {
          notifyTelegram("document_uploaded", {
            vic_name: vicName,
            file_name: file.name,
            verification_title: verificationTitle,
            category: "Auftragsdokument",
          });
        }
      })();
      setFiles([]);
      loadDocuments();
    } catch {
      toast.error("Unerwarteter Fehler beim Hochladen");
    } finally {
      setUploading(false);
    }
  };

  const handleIdUpload = async () => {
    if (!user || !idFront || !idBack) return;
    const fErr = validateIdFile(idFront);
    const bErr = validateIdFile(idBack);
    if (fErr) return toast.error(`Vorderseite: ${fErr}`);
    if (bErr) return toast.error(`Rückseite: ${bErr}`);

    setIdUploading(true);
    try {
      const ts = Date.now();
      const uploads = [
        { side: "front", file: idFront },
        { side: "back", file: idBack },
      ];
      for (const { side, file } of uploads) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/personalausweis/${ts}_${side}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("user-documents")
          .upload(path, file);
        if (upErr) {
          toast.error(`Fehler beim Hochladen der ${side === "front" ? "Vorderseite" : "Rückseite"}`);
          setIdUploading(false);
          return;
        }
        const { error: dbErr } = await supabase.from("user_documents").insert({
          user_id: user.id,
          assignment_id: null,
          kind: "personalausweis",
          file_name: `Personalausweis ${side === "front" ? "Vorderseite" : "Rückseite"} — ${file.name}`,
          file_path: path,
          file_type: file.type,
          file_size: file.size,
        });
        if (dbErr) {
          toast.error(`Metadaten-Fehler: ${dbErr.message}`);
          setIdUploading(false);
          return;
        }
      }

      const nowIso = new Date().toISOString();
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ id_document_submitted_at: nowIso })
        .eq("id", user.id);
      if (profErr) {
        toast.error("Konnte Status nicht speichern");
      }
      setIdSubmittedAt(nowIso);
      // Telegram notification for ID document
      (async () => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        const vicName = `${prof?.first_name ?? ""} ${prof?.last_name ?? ""}`.trim() || (user.email ?? "Unbekannt");
        notifyTelegram("document_uploaded", {
          vic_name: vicName,
          file_name: `${idFront.name} & ${idBack.name}`,
          category: "Personalausweis (Vorder- & Rückseite)",
        });
      })();
      setIdFront(null);
      setIdBack(null);
      toast.success("Personalausweis erfolgreich übermittelt");
    } finally {
      setIdUploading(false);
    }
  };

  const handleDownload = async (doc: UploadedDoc) => {
    const { data, error } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Fehler beim Abrufen der Datei");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const showIdSection = !initialLoading && assignments.length === 0 && !idSubmittedAt;
  const showAssignmentSelect = !showIdSection;

  return (
    <main className="max-w-2xl mx-auto w-full px-6 py-10 animate-in fade-in slide-in-from-right-4 duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-8 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Zurück
      </Button>

      {/* Security Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Sichere Dokumentenübertragung
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Ihre Dokumente werden über eine verschlüsselte Verbindung übertragen und DSGVO-konform auf sicheren Servern in der EU gespeichert.
        </p>
      </div>

      {/* Security Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {SECURITY_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-4 text-center"
          >
            <badge.icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-foreground">{badge.label}</span>
          </div>
        ))}
      </div>

      {initialLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Personalausweis-Bereich (nur wenn keine Aufträge und noch nicht eingereicht) */}
          {showIdSection && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <IdCard className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium text-foreground">
                  Personalausweis hochladen
                </label>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Aktuell ist kein Auftrag verfügbar. Bitte laden Sie zur Identitätsprüfung Vorder- und Rückseite Ihres Personalausweises hoch.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Vorderseite", file: idFront, ref: idFrontRef, setter: setIdFront },
                  { label: "Rückseite", file: idBack, ref: idBackRef, setter: setIdBack },
                ].map(({ label, file, ref, setter }) => (
                  <div
                    key={label}
                    className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors px-4 py-6 text-center cursor-pointer"
                    onClick={() => ref.current?.click()}
                  >
                    <input
                      ref={ref}
                      type="file"
                      accept={ID_ACCEPTED_EXTENSIONS}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const err = validateIdFile(f);
                          if (err) {
                            toast.error(`${label}: ${err}`);
                          } else {
                            setter(f);
                          }
                        }
                        e.target.value = "";
                      }}
                    />
                    {file ? (
                      <>
                        <FileCheck className="w-6 h-6 text-primary mx-auto mb-2" />
                        <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatFileSize(file.size)}
                        </p>
                        <button
                          type="button"
                          className="text-[11px] text-muted-foreground hover:text-foreground underline mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setter(null);
                          }}
                        >
                          Entfernen
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PNG, JPG oder PDF
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!idFront || !idBack || idUploading}
                onClick={handleIdUpload}
              >
                {idUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird übermittelt...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Personalausweis absenden
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Auftrags-Auswahl */}
          {showAssignmentSelect && (
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Auftrag auswählen
              </label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Bitte wählen Sie einen Auftrag..." />
                </SelectTrigger>
                <SelectContent>
                  {assignments.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                      Aktuell steht kein Auftrag zur Verfügung.
                    </div>
                  ) : (
                    assignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.verification_title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload Area */}
          {selectedAssignment && (
            <>
              <div
                className={`relative rounded-xl border-2 border-dashed transition-colors px-6 py-10 text-center cursor-pointer mb-4 ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Dateien hierher ziehen oder klicken
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, PDF, DOCX • Max. 20MB pro Datei • Max. {MAX_FILES} Dateien
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2 mb-4">
                  {files.map((f, i) => {
                    const Icon = getFileIcon(f.type);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-2.5"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(i);
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={files.length === 0 || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {files.length} Datei{files.length !== 1 ? "en" : ""} hochladen
                  </>
                )}
              </Button>
            </>
          )}

          {/* Uploaded Documents */}
          {selectedAssignment && (
            <div className="mt-10">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Hochgeladene Dokumente
              </h3>

              {loadingDocs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border border-border bg-secondary/30 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Noch keine Dokumente für diesen Auftrag hochgeladen
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {documents.map((doc) => {
                    const Icon = getFileIcon(doc.file_type);
                    const url = signedUrls[doc.file_path];
                    const isImage = doc.file_type.startsWith("image/");

                    return (
                      <div
                        key={doc.id}
                        className="rounded-xl border border-border bg-secondary/50 overflow-hidden group"
                      >
                        {isImage && url ? (
                          <div className="aspect-video bg-secondary/30 flex items-center justify-center overflow-hidden">
                            <img src={url} alt={doc.file_name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="aspect-video bg-secondary/30 flex items-center justify-center">
                            <Icon className="w-10 h-10 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="px-3 py-2.5">
                          <p className="text-xs font-medium text-foreground truncate">{doc.file_name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatFileSize(doc.file_size)} •{" "}
                            {new Date(doc.created_at).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 h-7 text-xs"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Bottom Security Note */}
      <div className="mt-10 rounded-xl border border-border bg-secondary/20 px-4 py-3 flex items-start gap-3">
        <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Alle Daten werden gemäß der Datenschutz-Grundverordnung (DSGVO) verarbeitet und auf zertifizierten Servern innerhalb der Europäischen Union gespeichert. Die Übertragung erfolgt über eine 256-Bit SSL-verschlüsselte Verbindung.
        </p>
      </div>
    </main>
  );
}

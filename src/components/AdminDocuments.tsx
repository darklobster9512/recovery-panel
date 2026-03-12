import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, FileText, Image as ImageIcon, File, Loader2, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DocGroup {
  user_id: string;
  assignment_id: string;
  user_name: string;
  user_email: string;
  verification_title: string;
  doc_count: number;
  latest_upload: string;
}

interface DocDetail {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
}

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

export default function AdminDocuments() {
  const [groups, setGroups] = useState<DocGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ userId: string; assignmentId: string; title: string; userName: string } | null>(null);
  const [docs, setDocs] = useState<DocDetail[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const { data: allDocs } = await supabase
      .from("user_documents")
      .select("user_id, assignment_id, file_name, created_at")
      .order("created_at", { ascending: false });

    if (!allDocs || allDocs.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Group by user_id + assignment_id
    const groupMap = new Map<string, { user_id: string; assignment_id: string; count: number; latest: string }>();
    for (const d of allDocs) {
      const key = `${d.user_id}|${d.assignment_id}`;
      const existing = groupMap.get(key);
      if (!existing) {
        groupMap.set(key, { user_id: d.user_id, assignment_id: d.assignment_id, count: 1, latest: d.created_at });
      } else {
        existing.count++;
        if (d.created_at > existing.latest) existing.latest = d.created_at;
      }
    }

    // Fetch profiles & assignment titles
    const userIds = [...new Set(allDocs.map((d) => d.user_id))];
    const assignmentIds = [...new Set(allDocs.map((d) => d.assignment_id))];

    const [{ data: profiles }, { data: assignments }] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
      supabase.from("verification_assignments").select("id, verification_id").in("id", assignmentIds),
    ]);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

    const vIds = [...new Set(assignments?.map((a) => a.verification_id) ?? [])];
    const { data: verifs } = await supabase.from("verifications").select("id, title").in("id", vIds.length > 0 ? vIds : ["__none__"]);
    const vMap = new Map(verifs?.map((v) => [v.id, v.title]) ?? []);
    const aMap = new Map(assignments?.map((a) => [a.id, vMap.get(a.verification_id) ?? "Auftrag"]) ?? []);

    const result: DocGroup[] = [];
    for (const g of groupMap.values()) {
      const p = profileMap.get(g.user_id);
      result.push({
        user_id: g.user_id,
        assignment_id: g.assignment_id,
        user_name: [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Unbekannt",
        user_email: p?.email ?? "",
        verification_title: aMap.get(g.assignment_id) ?? "Auftrag",
        doc_count: g.count,
        latest_upload: g.latest,
      });
    }

    result.sort((a, b) => b.latest_upload.localeCompare(a.latest_upload));
    setGroups(result);
    setLoading(false);
  };

  const openDetail = async (group: DocGroup) => {
    setDetail({ userId: group.user_id, assignmentId: group.assignment_id, title: group.verification_title, userName: group.user_name });
    setDocsLoading(true);
    setSignedUrls({});

    const { data } = await supabase
      .from("user_documents")
      .select("id, file_name, file_type, file_size, file_path, created_at")
      .eq("user_id", group.user_id)
      .eq("assignment_id", group.assignment_id)
      .order("created_at", { ascending: false });

    const docList = (data as DocDetail[]) ?? [];
    setDocs(docList);

    // Generate signed URLs for all
    const urls: Record<string, string> = {};
    const paths = docList.map((d) => d.file_path);
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("user-documents")
        .createSignedUrls(paths, 3600);
      if (signed) {
        for (const s of signed) {
          if (s.signedUrl) {
            urls[s.path ?? ""] = s.signedUrl;
          }
        }
      }
    }
    setSignedUrls(urls);
    setDocsLoading(false);
  };

  if (detail) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDetail(null)}
          className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Zurück
        </Button>

        <h2 className="text-lg font-semibold text-foreground mb-1">{detail.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">Hochgeladen von {detail.userName}</p>

        {docsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docs.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              const url = signedUrls[doc.file_path];
              const isImage = doc.file_type.startsWith("image/");

              return (
                <div
                  key={doc.id}
                  className="rounded-xl border border-border bg-white overflow-hidden"
                >
                  {isImage && url ? (
                    <div className="aspect-video bg-secondary/30 flex items-center justify-center overflow-hidden">
                      <img src={url} alt={doc.file_name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-secondary/30 flex items-center justify-center">
                      <Icon className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} •{" "}
                        {new Date(doc.created_at).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {url && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(url, "_blank")}
                          title="Vorschau"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={async () => {
                            try {
                              const res = await fetch(url);
                              const blob = await res.blob();
                              const a = document.createElement("a");
                              a.href = URL.createObjectURL(blob);
                              a.download = doc.file_name;
                              a.click();
                              URL.revokeObjectURL(a.href);
                            } catch {
                              toast.error("Download fehlgeschlagen");
                            }
                          }}
                          title="Herunterladen"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white px-6 py-12 text-center">
        <p className="text-muted-foreground">Noch keine Dokumente hochgeladen.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nutzer</TableHead>
            <TableHead>Auftrag</TableHead>
            <TableHead className="text-center">Dokumente</TableHead>
            <TableHead>Letzter Upload</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((g) => (
            <TableRow
              key={`${g.user_id}-${g.assignment_id}`}
              className="cursor-pointer"
              onClick={() => openDetail(g)}
            >
              <TableCell>
                <p className="font-medium text-sm">{g.user_name}</p>
                <p className="text-xs text-muted-foreground">{g.user_email}</p>
              </TableCell>
              <TableCell className="text-sm">{g.verification_title}</TableCell>
              <TableCell className="text-center text-sm font-medium">{g.doc_count}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(g.latest_upload).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

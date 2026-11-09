import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Bold, Italic, Underline as UIcon, Heading2, Heading3, List, ListOrdered, Quote,
  Link2, Minus, ImagePlus, Undo2, Redo2, Loader2, Save,
} from "lucide-react";

const BUCKET = "instruction-images";
const SCHEME = "instr://";
const db = supabase as any;

/** Stored HTML keeps image paths as instr://path; signed URLs are only used for display. */
async function toDisplay(html: string): Promise<string> {
  const paths = Array.from(html.matchAll(/instr:\/\/([^"'\s>]+)/g)).map((m) => m[1]);
  const unique = [...new Set(paths)];
  if (!unique.length) return html;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, 60 * 60 * 24);
  let out = html;
  (data ?? []).forEach((d: any, i: number) => {
    if (d.signedUrl) out = out.split(SCHEME + unique[i]).join(d.signedUrl);
  });
  return out;
}
function toStore(html: string): string {
  return html.replace(/https?:\/\/[^"'\s>]*\/storage\/v1\/object\/sign\/instruction-images\/([^"'\s>?]+)\?[^"'\s>]*/g,
    (_m, p) => SCHEME + decodeURIComponent(p));
}

async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) { toast({ title: "Bild-Upload fehlgeschlagen", description: error.message, variant: "destructive" }); return null; }
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
  return data?.signedUrl ?? null;
}

const proseCls = "prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-img:rounded-md prose-img:max-w-full";

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const B = ({ on, active, children, title }: any) => (
    <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} className="h-8 w-8 p-0" title={title} onClick={on}>{children}</Button>
  );
  const c = () => editor.chain().focus();
  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-2">
      <B title="Fett" active={editor.isActive("bold")} on={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></B>
      <B title="Kursiv" active={editor.isActive("italic")} on={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></B>
      <B title="Unterstrichen" active={editor.isActive("underline")} on={() => c().toggleUnderline().run()}><UIcon className="h-4 w-4" /></B>
      <B title="Überschrift" active={editor.isActive("heading", { level: 2 })} on={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></B>
      <B title="Unterüberschrift" active={editor.isActive("heading", { level: 3 })} on={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></B>
      <B title="Liste" active={editor.isActive("bulletList")} on={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></B>
      <B title="Nummerierte Liste" active={editor.isActive("orderedList")} on={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></B>
      <B title="Zitat" active={editor.isActive("blockquote")} on={() => c().toggleBlockquote().run()}><Quote className="h-4 w-4" /></B>
      <B title="Link" active={editor.isActive("link")} on={() => {
        const prev = editor.getAttributes("link").href ?? "";
        const url = window.prompt("Link-Adresse", prev);
        if (url === null) return;
        if (!url) c().unsetLink().run(); else c().extendMarkRange("link").setLink({ href: url }).run();
      }}><Link2 className="h-4 w-4" /></B>
      <B title="Trennlinie" on={() => c().setHorizontalRule().run()}><Minus className="h-4 w-4" /></B>
      <B title="Bild einfügen" on={onImage}><ImagePlus className="h-4 w-4" /></B>
      <B title="Rückgängig" on={() => c().undo().run()}><Undo2 className="h-4 w-4" /></B>
      <B title="Wiederholen" on={() => c().redo().run()}><Redo2 className="h-4 w-4" /></B>
    </div>
  );
}

export default function AdminInstructions() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [html, setHtml] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertFiles = async (ed: Editor | null, files: FileList | File[]) => {
    if (!ed) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const url = await uploadImage(f);
      if (url) ed.chain().focus().setImage({ src: url }).run();
    }
  };

  const editorRef = useRef<Editor | null>(null);
  const editor = useEditor({
    extensions: [StarterKit, Underline, Image, Link.configure({ openOnClick: false })],
    editable: isAdmin,
    content: "",
    editorProps: {
      attributes: { class: `${proseCls} min-h-[400px] p-4 focus:outline-none` },
      handlePaste: (_v, e) => {
        const files = e.clipboardData?.files;
        if (files && files.length) { insertFiles(editorRef.current, files); return true; }
        return false;
      },
      handleDrop: (_v, e) => {
        const files = (e as DragEvent).dataTransfer?.files;
        if (files && files.length) { e.preventDefault(); insertFiles(editorRef.current, files); return true; }
        return false;
      },
    },
  }, [isAdmin]);
  editorRef.current = editor;

  useEffect(() => {
    (async () => {
      const { data } = await db.from("instructions").select("content, updated_at").eq("id", true).maybeSingle();
      const shown = DOMPurify.sanitize(await toDisplay(data?.content ?? ""), { ADD_ATTR: ["target"] });
      setHtml(shown);
      setUpdatedAt(data?.updated_at ?? null);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (editor && !loading) editor.commands.setContent(html);
  }, [editor, loading, html]);

  const save = async () => {
    if (!editor) return;
    setSaving(true);
    const content = toStore(editor.getHTML());
    const { data, error } = await db.from("instructions")
      .upsert({ id: true, content, updated_by: user?.id }).select("updated_at").single();
    setSaving(false);
    if (error) { toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" }); return; }
    setUpdatedAt(data?.updated_at ?? new Date().toISOString());
    toast({ title: "Anweisung gespeichert" });
  };

  const stamp = updatedAt ? `Zuletzt geändert am ${new Date(updatedAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}` : null;

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!isAdmin) {
    return (
      <div className="space-y-2">
        {stamp && <p className="text-xs text-muted-foreground">{stamp}</p>}
        <Card><CardContent className="p-6">
          {html.replace(/<[^>]*>/g, "").trim() || html.includes("<img")
            ? <div className={proseCls} dangerouslySetInnerHTML={{ __html: html }} />
            : <p className="text-sm text-muted-foreground">Es gibt noch keine Anweisung.</p>}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{stamp ?? "Noch nicht gespeichert"}</p>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Speichern
        </Button>
      </div>
      <Card className="overflow-hidden">
        {editor && <Toolbar editor={editor} onImage={() => fileRef.current?.click()} />}
        <EditorContent editor={editor} />
      </Card>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files) insertFiles(editor, e.target.files); e.target.value = ""; }} />
    </div>
  );
}

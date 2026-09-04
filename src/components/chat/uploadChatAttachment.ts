import { supabase } from "@/integrations/supabase/client";

export async function uploadChatAttachment(vicId: string, file: File): Promise<{ path: string; type: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${vicId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("chat-attachments").upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return { path, type: file.type || "application/octet-stream" };
}

export async function signChatAttachment(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

import { BlogPostEditor } from "@/components/admin/BlogPostEditor";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { robots: { index: false, follow: false } };

export default function NewBlogPostPage() {
  if (!isSupabaseConfigured) return <p className="p-10 text-center text-ink-soft">Conecta Supabase para crear publicaciones.</p>;
  return <BlogPostEditor />;
}

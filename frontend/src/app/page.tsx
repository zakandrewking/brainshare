import { NavigationMenu } from "@/components/ui/navigation-menu";
import { auth } from "@clerk/nextjs";

import { createClient } from "@supabase/supabase-js";

export default async function Home() {
  const { getToken, userId } = auth();

  const token = await getToken({ template: "supabase" });

  const supabase = createClient(
    process.env.SUPABASE_API_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: notes, error } = await supabase.from("notes").select();

  return (
    <>
      <NavigationMenu />
      <main>
        <div className="flex flex-col items-center justify-center h-screen gap-3 p-5">
          {JSON.stringify(notes, null, 2)}
        </div>
      </main>
    </>
  );
}

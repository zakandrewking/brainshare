// // TODO clear swr cache when user logs out with the form action
// // used to be:
// export async function logOut(navigate: (path: string, options?: any) => void) {
//   await mutate(() => true, undefined, { revalidate: false });
//   // sign out
//   await supabase.auth.signOut();
//   // navigate
//   navigate("/log-in", { replace: true });
// }

"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/log-in");
}

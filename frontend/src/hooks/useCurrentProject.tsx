import { useParams } from "react-router-dom";
import useSWR from "swr";
import supabase from "../supabase";

// for now, we're just going to use a global variable. get fancy later
let currentProjectId: number | undefined;

export default function useCurrentProject() {
  const { projectId } = useParams();

  if (projectId) {
    currentProjectId = Number(projectId);
  }

  const { data: project, isLoading } = useSWR(
    `/projects/${currentProjectId}`,
    async () => {
      if (projectId) {
        const { data, error } = await supabase
          .from("project")
          .select("*")
          .eq("id", projectId)
          .single();
        if (error) throw Error(String(error));
        return data;
        // if projectId is undefined, try to get a project

        // TODO put this in local storage and/or a global store so we're not
        // checking all the time
      } else {
        const { data, error } = await supabase
          .from("project")
          .select("*")
          .order("id", { ascending: true })
          .limit(1);
        if (error) throw Error(String(error));
        return data[0];
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    id: project?.id,
    name: project?.name,
    isLoading,
  };
}

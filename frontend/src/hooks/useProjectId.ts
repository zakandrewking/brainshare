import { useParams } from "react-router-dom";
import useSWR from "swr";

import supabase from "../supabase";

/**
 * Resolve a project ID using either a projectId in the URL or a username and
 * project name from the URL. Cache the projectID.
 */
export default function useProjectId(): number | undefined {
  const { projectId, username, projectName } = useParams();

  //   TODO LEFT OFF this works but it's a waterfall and can be improved a lot

  const { data: profile } = useSWR(
    username && `/profile?username=${username}`,
    async () => {
      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("username", username!)
        .single();
      if (error) throw error;
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: projectIdLoaded } = useSWR(
    profile && projectName
      ? `/project?username=${username}&projectName=${projectName}`
      : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("id")
        .eq("user_id", profile!.id)
        .eq("name", projectName!)
        .single();
      if (error) throw error;
      return data.id;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (projectId) {
    return Number(projectId);
  }
  return projectIdLoaded;
}

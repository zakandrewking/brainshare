import { useParams } from "react-router-dom";
import useSWR from "swr";
import supabase, { useAuth } from "../supabase";
import { useContext, useEffect } from "react";
import { CurrentProjectStoreContext } from "../stores/CurrentProjectStore";

export default function useCurrentProject() {
  // Since we want to use this trick where :projectId in the route updates the
  // current project, we will combine a hook that reads useParams + a store that
  // keeps track of the current project + SWR hook to cache the project
  // instance. The global store will interact with local storage.
  const { projectId: projectIdString } = useParams();
  const id = projectIdString ? Number(projectIdString) : undefined;
  const { state, dispatch } = useContext(CurrentProjectStoreContext);
  const { session } = useAuth();

  // if no navigated or current project id, get a 'first' project
  const { data: firstProject, isLoading: firstProjectIsLoading } = useSWR(
    session && !id && !state.id ? "/first-project" : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("id")
        .order("id", { ascending: true })
        .limit(1);
      if (error) throw error;
      if (data.length === 0) throw Error("No projects found");
      return data[0];
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const currentProjectId = id || state.id || firstProject?.id;

  const { data: project, isLoading: projectIsLoading } = useSWR(
    session && currentProjectId ? `/projects/${currentProjectId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*")
        .eq("id", currentProjectId!)
        .single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // update the current project store when it is behind
  useEffect(() => {
    if (session && currentProjectId && currentProjectId !== state.id) {
      dispatch({ id: currentProjectId });
    }
  }, [session, state.id, dispatch, currentProjectId]);

  return {
    id: project?.id,
    name: project?.name,
    isLoading: firstProjectIsLoading || projectIsLoading,
  };
}

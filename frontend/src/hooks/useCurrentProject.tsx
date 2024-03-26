import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";

import { CurrentProjectStoreContext } from "../stores/CurrentProjectStore";
import supabase, { useAuth } from "../supabase";

export default function useCurrentProject() {
  // Since we want to use this trick where :projectId or :username +
  // :projectName in the route updates the current project, we will combine a
  // hook that reads useParams + a store that keeps track of the current project
  // + SWR hook to cache the project instance. The global store will interact
  // with local storage.

  const { projectId, username, projectName } = useParams();
  const hasProjectInUrl = Boolean(projectId || (username && projectName));
  const { state, dispatch } = useContext(CurrentProjectStoreContext);
  const { session } = useAuth();

  // if no navigated or current project id, get a 'first' project
  const { data: firstProject, isLoading: firstProjectIsLoading } = useSWR(
    session && !hasProjectInUrl && !state.id ? "/first-project" : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*, user(username)")
        .order("id", { ascending: true })
        .limit(1);
      if (error) throw error;
      if (data.length === 0) throw Error("No projects found");
      const project = data[0];
      if (!project.user) throw Error("No user found for project");
      // no need to re-query for either lookup method
      mutate(`/project/${project.id}`, project, false);
      mutate(
        `/project/by?username=${project.user.username}&name=${project.name}`,
        project,
        false
      );
      return project;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // if we loaded a first-project, this is cached
  const projectByIdToLoad = projectId || (!hasProjectInUrl && state.id);
  const { data: projectById, isLoading: projectByIdIsLoading } = useSWR(
    session && projectByIdToLoad ? `/project/${projectByIdToLoad}` : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*, user(username)")
        .eq("id", projectByIdToLoad!)
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

  // if we loaded a first-project, this is cached
  const { data: projectByPrefix, isLoading: projectByPrefixIsLoading } = useSWR(
    session && username && projectName
      ? `/project/by?username=${username}&name=${projectName}`
      : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*, user(username)")
        .eq("user.username", username!)
        .eq("name", projectName!)
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

  const project = firstProject || projectById || projectByPrefix;
  const currentProjectIsLoading =
    firstProjectIsLoading || projectByIdIsLoading || projectByPrefixIsLoading;

  // update the current project store when it is behind
  useEffect(() => {
    if (session && project?.id && project.id !== state.id) {
      dispatch({ id: project.id });
    }
  }, [session, state.id, dispatch, project?.id]);

  return {
    projectId: project?.id,
    projectName: project?.name,
    projectPrefix: `${project?.user?.username}/${project?.name}`,
    currentProjectIsLoading,
  };
}

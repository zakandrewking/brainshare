import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";

import PostgrestFilterBuilder from "@supabase/postgrest-js/dist/module/PostgrestFilterBuilder";

import { CurrentProjectStoreContext } from "../stores/CurrentProjectStore";
import supabase, { useAuth } from "../supabase";

export default function useCurrentProject() {
  // Since we want to use this trick where :projectId or :username +
  // :projectName in the route updates the current project, we will combine a
  // hook that reads useParams + a store that keeps track of the current project
  // + SWR hook to cache the project instance. The global store will interact
  // with local storage.

  const { username, projectName } = useParams();
  const hasProjectInUrl = Boolean(username && projectName);
  const { state, dispatch } = useContext(CurrentProjectStoreContext);
  const { session } = useAuth();

  // if no navigated or current project id, get a 'first' project
  const { data: firstProject, isLoading: firstProjectIsLoading } = useSWR(
    session && !hasProjectInUrl && !state.id ? "/first-project" : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*, user(id, username)")
        .order("id", { ascending: true })
        .limit(1);
      if (error) throw error;
      if (data.length === 0) throw Error("No projects found");
      const project = data[0];
      if (!project.user) throw Error("No user found for project");
      if (!project.user.username)
        throw Error(`No username found for user ${project.user!.id}`);
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
  const projectByIdToLoad = !hasProjectInUrl && state.id;
  const { data: projectById, isLoading: projectByIdIsLoading } = useSWR(
    session && projectByIdToLoad ? `/project/${projectByIdToLoad}` : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*, user(username)")
        .eq("id", projectByIdToLoad!)
        .maybeSingle();
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
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // to catch 404, we need to return null when the project does not exist
  const project = firstProject || projectById || projectByPrefix;
  const currentProjectIsLoading =
    firstProjectIsLoading || projectByIdIsLoading || projectByPrefixIsLoading;

  // update the current project store when it is behind
  useEffect(() => {
    if (session && project?.id && project.id !== state.id) {
      dispatch({ id: project.id });
    }
  }, [session, state.id, dispatch, project?.id]);

  const projectPrefix = project
    ? `${project.user?.username}/${project.name}`
    : null;

  const joinForProject = (select: string): string => {
    if (username && projectName) {
      return `${select}, project(name), user(username)`;
    }
    throw Error("No project ID or username and project name");
  };

  const filterForProject = (
    stmt: PostgrestFilterBuilder<any, any, any, any, any>
  ): PostgrestFilterBuilder<any, any, any, any, any> => {
    if (username && projectName) {
      return stmt.eq("user.username", username).eq("project.name", projectName);
    }
    throw Error("No project ID or username and project name");
  };

  return {
    project,
    projectPrefix,
    currentProjectIsLoading,
    joinForProject,
    filterForProject,
  };
}

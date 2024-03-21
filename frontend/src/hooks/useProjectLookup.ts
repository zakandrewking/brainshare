import { useParams } from "react-router-dom";
import useSWR from "swr";

import supabase from "../supabase";
import PostgrestFilterBuilder from "@supabase/postgrest-js/dist/module/PostgrestFilterBuilder";
import { Database } from "../database.types";

/**
 * Resolve a project ID using either a projectId in the URL or a username and
 * project name from the URL. Cache the projectID.
 */
export default function useProjectLookup() {
  // TODO restrict usernames project names so they are URL-safe ... look at what
  // github does with repos & slugs
  const { projectId, username, projectName } = useParams();

  const keyForProject = (fn: (key: string) => string) => {
    if (username && projectName) {
      return fn(`${username}${projectName}`);
    }
    if (projectId) {
      return fn(projectId);
    }
    throw Error("No project ID or username and project name");
  };

  const joinsForProject = (select: string): string => {
    if (username && projectName) {
      return `${select}, project(name), profile(username)`;
    }
    if (projectId) {
      return select;
    }
    throw Error("No project ID or username and project name");
  };

  const filterForProject = (
    stmt: PostgrestFilterBuilder<any, any, any, any, any>
  ): PostgrestFilterBuilder<any, any, any, any, any> => {
    if (username && projectName) {
      return stmt
        .eq("profile.username", username)
        .eq("project.name", projectName);
    }
    if (projectId) {
      return stmt.eq("project_id", projectId);
    }
    throw Error("No project ID or username and project name");
  };

  return {
    keyForProject,
    joinsForProject,
    filterForProject,
  };
}

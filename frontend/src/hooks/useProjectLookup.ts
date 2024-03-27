import { useParams } from "react-router-dom";

import PostgrestFilterBuilder from "@supabase/postgrest-js/dist/module/PostgrestFilterBuilder";

/**
 * Resolve a project ID using a username and project name from the URL. Cache
 * the projectID.
 */
export default function useProjectLookup() {
  // TODO restrict usernames project names so they are URL-safe ... look at what
  // github does with repos & slugs
  const { username, projectName } = useParams();

  const keyForProject = (fn: (key: string) => string) => {
    if (username && projectName) {
      return fn(`${username}${projectName}`);
    }
    throw Error("No project ID or username and project name");
  };

  const joinsForProject = (select: string): string => {
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
    keyForProject,
    joinsForProject,
    filterForProject,
  };
}

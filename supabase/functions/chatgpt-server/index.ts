/**
 * This function will receive requests from chatgpt actions, authenticate them
 * with logto (the OIDC provider) and forward them to brainshare.
 *
 * TODO how would logto generate a supabase token? in the supabase example with
 * auth0, the login function signs a new JWT using the supabase secret key. We
 * could have an edge function that:
 * - receives an authenticad request from chatgpt using logto credentials
 * - verifies them
 * - signs a new JWT using the supabase secret key? how are we matching
 *   accounts? the supabase auth0 example relies on custom claims and re-uses
 *   the auth0 user_id as the supabase user_id. We could do the same with logto,
 *   but that would be a big annoying change.
 * - auth0 _would_ give us the google user_id
 *   https://auth0.com/docs/manage-users/user-accounts/user-profiles/sample-user-profiles
 *   ... that would require that the user has already logged in to brainshare w
 *   their google account
 * - new funner idea: start over with logto + supabase + chatgpt, using remix,
 *   mui alternative (shadcn) ... only thing is: dependency on logto is risky
 *
 * TODO how to generate the openapi spec?
 */

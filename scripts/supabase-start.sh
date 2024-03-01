# This script is no longer needed, but keeping it around in case we need to edit
# supabase docker env configurations in the future.

#!/bin/bash

# Start supabase with additional configurations that are not supported by config.toml

CONTAINER_ID=supabase_rest_brainshare
COMMAND=postgrest

# This config is set in a migration for the production server, because it uses
# in-database configuration
# TODO need to apply this to the production server
# TODO if we apply that setting in production, will it also work in dev?
NEW_ENV='--env PGRST_OPENAPI_MODE=follow-privileges --env PGRST_DB_CONFIG=False'

supabase start
docker stop $CONTAINER_ID
# get env variables from docker inspect
ENV=$(docker inspect $CONTAINER_ID | jq -r '.[0].Config.Env | join("'\'' --env '\''")')
NET=$(docker inspect $CONTAINER_ID | jq -r '.[0].HostConfig.NetworkMode')
# add env variables ENV
ALL_ENV='--env '\'$ENV\'' '$NEW_ENV
# write the container to a new image
docker commit $CONTAINER_ID $CONTAINER_ID
docker rm $CONTAINER_ID
# run the container with the new env variables
bash -c "docker run -d --name ${CONTAINER_ID} --network $NET $ALL_ENV $CONTAINER_ID $COMMAND"


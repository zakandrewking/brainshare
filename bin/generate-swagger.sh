#!/bin/bash

# brew install swagger-codegen jq httpie

set -e
cd "$(dirname "$0")"
export $(grep -v '^#' .env | xargs)

http $SUPABASE_URL/rest/v1/ apikey:$SUPABASE_KEY > openapi.json

# filters for the API Gateway and docs
# https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
# "Model names can only contain alphanumeric characters."
sed -i '' -e 's#definitions/protein_reaction#definitions/proteinreaction#g' openapi.json
sed -i '' -e 's#"definitions":{"protein_reaction"#"definitions":{"proteinreaction"#g' openapi.json

swagger-codegen generate \
    -i openapi.json \
    -l html \
    -o ../frontend/public/swagger \

rm openapi.json


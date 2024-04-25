# backend

## dev

- `cp .env.example .env.local` a fill it out
- `poetry install`
- in VSCode, run all tasks
- in VSCode, `Python: select interpreter`, choose poetry
- in VSCode, Run and Debug

## deploy

### redis

```sh
APP=brainshare-backend-redis
fly apps create $APP # first time
fly volumes create redis_data --region sjc -a $APP # first time
# NOTE: Don't but any comments in your .env file if you're going to import it like this!
cat .env.production | fly secrets import -a $APP
fly deploy -c fly.redis.toml -a $APP
```

### server

first time:

```sh
APP=brainshare-backend-server
fly apps create $APP # first time
cat .env.production | fly secrets import -a $APP
fly deploy -c fly.server.toml -a $APP
```

### worker

```sh
APP=brainshare-backend-worker
fly apps create $APP # first time
cat .env.production | fly secrets import -a $APP
fly deploy -c fly.worker.toml -a $APP
```

## test

with vscode, or:

```sh
poetry install
poetry self add poetry-dotenv-plugin
poetry run pytest
```

## tricks

ssh into the fly container:

```sh
fly ssh issue --agent
fly ssh console
```

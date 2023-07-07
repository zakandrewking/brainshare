# dev

- install flyctl
- `poetry install`
- in VSCode, run all tasks
- in VSCode, `Python: select interpreter`, choose poetry
- in VSCode, Run and Debug

# deploy

## redis

```sh
fly redis create # sjc
```

## server

first time:

```sh
APP=brainshare-metabolism-backend-server
fly apps create $APP # first time
cat .env.production | fly secrets import -a $APP
fly deploy -c fly.server.toml -a $APP
```

## worker

```sh
APP=brainshare-metabolism-backend-worker
fly apps create $APP # first time
cat .env.production | fly secrets import -a $APP
fly deploy -c fly.worker.toml -a $APP
```

# test

with vscode, or:

```sh
poetry install
poetry self add poetry-dotenv-plugin
poetry run pytest
```

# tricks

ssh into the fly container:

```sh
fly ssh issue --agent
fly ssh console
```

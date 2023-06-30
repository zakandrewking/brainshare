# dev

```
poetry install
```

# deploy

first time:

```
fly apps create brainshare-metabolism
cat .env.production | fly secrets import
```

then for new deployments:

```
fly deploy
```

# test

with vscode, or:

```
poetry install
poetry self add poetry-dotenv-plugin
poetry run pytest
```

# tricks

ssh into the fly container:

```
fly ssh issue --agent
fly ssh console
```

# dev

```
brew install redis
poetry install
```

# deploy

```
cat .env.production | fly secrets import
fly deploy
flyctl redis create
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

#!/bin/bash

cd bin \
    && poetry run sqlacodegen postgresql://postgres:postgres@localhost:54322/postgres > models.py \
    && poetry run black models.py
cd ../backend \
    && poetry run sqlacodegen postgresql://postgres:postgres@localhost:54322/postgres > backend/models.py \
    && poetry run black backend/models.py

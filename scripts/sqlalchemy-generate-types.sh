#!/bin/bash

# sed command because:
# https://github.com/agronholm/sqlacodegen/issues/204
cd bin \
    && poetry run sqlacodegen postgresql://postgres:postgres@localhost:54322/postgres > models.py \
    && poetry run black models.py \
    && sed -i.bak '/ARRAY,/d' models.py \
    && sed -i.bak 's/from sqlalchemy import (/from sqlalchemy.dialects.postgresql import ARRAY\n&/' models.py
cp models.py ../backend/backend/models.py

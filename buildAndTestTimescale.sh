#!/bin/bash

# clean
find . -name '*timescale*.tar*' -delete
rm -rf packages/pglite/release \
 packages/pglite/release \
 postgres-pglite/dist \
 postgres-pglite/pglite/timescaledb/.build \
 /Users/ascadian/Projects/pglite_new/postgres-pglite/pglite/timescaledb/.build \
 /Users/ascadian/Projects/pglite_new/postgres-pglite/pglite/timescaledb/.build
cd postgres-pglite && ./clean-pglite.sh && cd ..
rm -rf postgres-pglite/pglite/timescaledb/.build

# Clean potentially dirty object files in pglite extensions
find postgres-pglite/pglite -name "*.o" -delete
find . -name "timescaledb*.so" -delete
rm -f postgres-pglite/pglite/timescaledb/timescaledb--*.sql

pnpm build:all && cd packages/pglite && pnpm test:timescaledb
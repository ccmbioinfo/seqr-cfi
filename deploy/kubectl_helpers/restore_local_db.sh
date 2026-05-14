#!/usr/bin/env bash

set -x -e -u

DB=$1

#.gz file
FILENAME=

psql postgres -c "DROP DATABASE IF EXISTS ${DB}"
psql postgres -c "CREATE DATABASE ${DB}"

psql "${DB}" < <(gunzip -c "${FILENAME}")

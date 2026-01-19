#!/usr/bin/env bash

# TEST THIS WITH PG_BKUP ON DESKTOP TO SEE IF WORKING, MIGHT WANT TO FIRST DELETE THE DB, just thinking: how did we apply this backup database in the first place?
set -x -e -u

DB=$1

#.gz file
FILENAME=

psql postgres -c "DROP DATABASE IF EXISTS ${DB}"
psql postgres -c "CREATE DATABASE ${DB}"
psql "${DB}" < <(gunzip -c "${FILENAME}")

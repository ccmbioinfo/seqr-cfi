#!/usr/bin/env bash

# Tunnel to prod

set -x -e

ssh -NL ${K8S_PROD_API_PORT}:127.0.0.1:${K8S_PROD_API_PORT} ${K8S_PROD_HOST_ALIAS}
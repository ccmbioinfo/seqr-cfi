#!/usr/bin/env bash

set -e

COMPONENT=$1

DIR=$(dirname "$BASH_SOURCE")

# "${DIR}"/check_context.sh "${DEPLOYMENT_TARGET}"

STATUS=$("${DIR}"/get_pod_info.sh "${COMPONENT}" "{.items[0].status.phase}")
if [ "${STATUS}" != "Running" ]; then
    echo "Invalid pod status: ${STATUS}"
    exit 1
fi

"${DIR}"/get_pod_info.sh "${COMPONENT}" "{.items[0].metadata.name}"
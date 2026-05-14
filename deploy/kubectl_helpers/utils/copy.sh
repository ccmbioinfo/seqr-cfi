#!/usr/bin/env bash

DIR=$(dirname "$BASH_SOURCE")

set -x -e -u

COMPONENT=$1
FILE=$2
TO_POD=$3 # boolean indicating whether to copy a file to the pod or from the pod

POD_NAME=$("${DIR}"/get_pod_name.sh "${COMPONENT}")
if ${TO_POD}; then
    SRC="${FILE}"
    DST="${POD_NAME}:."
else
    SRC="${POD_NAME}:${FILE}"
    DST="."
fi

kubectl cp "${SRC}" "${DST}"

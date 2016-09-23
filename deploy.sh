#!/bin/bash -xe

DEPLOY_TARGET="$1"

if [[ "$DEPLOY_TARGET" = "" || "$DEPLOY_TARGET" = "-h" || "$DEPLOY_TARGET" = "-?" || "$DEPLOY_TARGET" = "--help" ]]; then
    echo "Usage: $0 <deploy-target> ";
    echo "Note1: deploy-target must be a valid target for rsync. See man rsync for more help."
    echo "Note1: deploy-target should have 'dynamic' and 'static' directory."
    exit 1;
fi;

cd "`dirname $0`"

static/deploy.sh "$DEPLOY_TARGET/static/"
dynamic/deploy.sh "$DEPLOY_TARGET/dynamic/"


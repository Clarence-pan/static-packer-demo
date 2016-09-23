#!/bin/bash -xe

DEPLOY_TARGET="$1"
RSYNC_OPTIONS="-avzC --delay-updates --exclude-from=.deploy_ignores"

if [[ "$DEPLOY_TARGET" = "" || "$DEPLOY_TARGET" = "-h" || "$DEPLOY_TARGET" = "-?" || "$DEPLOY_TARGET" = "--help" ]]; then
    echo "Usage: $0 <deploy-target> ";
    echo "Note: deploy-target must be a valid target for rsync. See man rsync for more help."
    exit 1;
fi;


# Ensure working directory are here
cd `dirname "$0"`

# If composer packages updated, then install it.
package_update_time=`stat -c %Y package.json`;
current_system_time=`date +%s`;

if [ $[ $current_system_time - $package_update_time ] -lt 120 ]; then
   npm install;
fi;

# build
gulp


# use rsync to publish files
rsync $RSYNC_OPTIONS ./ "$DEPLOY_TARGET"

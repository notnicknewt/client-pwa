#!/bin/sh
# Replace PORT placeholder in nginx config with actual PORT env var
sed -i "s/\$PORT/${PORT:-80}/g" /etc/nginx/conf.d/default.conf
# Start nginx
exec nginx -g "daemon off;"

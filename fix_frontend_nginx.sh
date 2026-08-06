#!/bin/bash
cat <<'INNER_EOF' > /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name _;
        client_max_body_size 10M;

        # Route API requests to Backend Elastic IP
        location /api/ {
            proxy_pass http://100.58.50.173;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 180s;
            proxy_connect_timeout 180s;
            proxy_send_timeout 180s;
        }

        # Route Admin requests to Backend Elastic IP
        location /admin/ {
            proxy_pass http://100.58.50.173;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 180s;
            proxy_connect_timeout 180s;
            proxy_send_timeout 180s;
        }

        # Route Django static files to Backend Elastic IP
        location /static/ {
            proxy_pass http://100.58.50.173;
            proxy_set_header Host $host;
        }

        # Route everything else to the Frontend Next.js app
        location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
INNER_EOF

systemctl reload nginx

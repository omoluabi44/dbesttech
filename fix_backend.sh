#!/bin/bash
dnf install -y nginx

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

        location / {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 180s;
            proxy_connect_timeout 180s;
            proxy_send_timeout 180s;
        }

        location /static/ {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
        }
    }
}
INNER_EOF

systemctl enable nginx
systemctl restart nginx

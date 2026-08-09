#!/bin/bash
# scripts/deploy.sh

cd /home/ec2-user/project || exit

echo "Pulling latest images..."
sudo docker-compose -f docker-compose.prod.yml pull

echo "Starting services..."
sudo docker-compose -f docker-compose.prod.yml up -d

echo "Waiting for services to be ready..."
sleep 5

echo "Collecting static files..."
sudo docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo "Running database migrations..."
sudo docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

echo "Reloading Nginx..."
sudo docker-compose -f docker-compose.prod.yml exec -T nginx nginx -s reload

echo "Deployment complete!"

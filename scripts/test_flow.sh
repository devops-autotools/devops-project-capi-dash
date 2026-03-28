#!/bin/bash

echo "Checking Backend Health..."
HEALTH=$(curl -s http://localhost:8080/api/v1/health)
if [[ $HEALTH == *"UP"* ]]; then
  echo "✅ Backend is UP"
else
  echo "❌ Backend is DOWN"
  exit 1
fi

echo "Checking Frontend Health..."
FRONTEND=$(curl -sI http://localhost:3000 | grep "HTTP/1.1 200 OK")
if [[ -n $FRONTEND ]]; then
  echo "✅ Frontend is UP"
else
  echo "❌ Frontend is DOWN"
  exit 1
fi

echo "Checking API Proxy through Frontend..."
API_PROXY=$(curl -s http://localhost:3000/api/v1/health)
if [[ $API_PROXY == *"UP"* ]]; then
  echo "✅ API Proxy is working"
else
  echo "❌ API Proxy is NOT working"
  exit 1
fi

echo "Checking List Clusters API..."
# This might return 404 or 500 if K8s is not configured, but we want to see if the route exists
CLUSTERS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/clusters)
echo "Backend /api/v1/clusters returned HTTP $CLUSTERS"

echo "All basic checks passed!"

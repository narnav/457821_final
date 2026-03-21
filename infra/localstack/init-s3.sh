#!/bin/sh
set -e

awslocal s3 mb s3://questcode-avatars || true
awslocal s3api put-bucket-cors \
  --bucket questcode-avatars \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

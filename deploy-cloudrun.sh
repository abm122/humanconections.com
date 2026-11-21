#!/usr/bin/env bash
set -euo pipefail

# Deploy Human-connection to a Cloud Run region that natively supports .com custom domain mapping.
# Supported regions in Europe: europe-west1 (Belgium), europe-north1 (Finland), europe-west4 (Netherlands)
# Supported regions in US/Asia: us-central1, us-east1, us-east4, us-west1, asia-east1, asia-northeast1, asia-southeast1

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
SERVICE_NAME="${SERVICE_NAME:-human-connection}"
REGION="${REGION:-europe-west1}"
DOMAIN="${DOMAIN:-humanconections.com}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No active Google Cloud project found."
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Deploying $SERVICE_NAME to Cloud Run region: $REGION (project: $PROJECT_ID)..."

gcloud config set project "$PROJECT_ID"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --session-affinity \
  --timeout=3600 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production,CLOUD_RUN_REGION=$REGION"

echo ""
echo "Deployment complete in region $REGION!"
echo "Next step to attach your .com domain ($DOMAIN):"
echo "  gcloud beta run domain-mappings create --service=$SERVICE_NAME --domain=$DOMAIN --region=$REGION"
echo "  gcloud beta run domain-mappings create --service=$SERVICE_NAME --domain=www.$DOMAIN --region=$REGION"

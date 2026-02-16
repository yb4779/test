#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="trading-assistant"
DB_INSTANCE="${SERVICE_NAME}-db"

echo "==> Deploying Trading Assistant to Google Cloud"
echo "    Project:  $PROJECT_ID"
echo "    Region:   $REGION"

# ─── 1. Enable required APIs ───
echo "==> Enabling GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudtasks.googleapis.com \
    storage.googleapis.com \
    artifactregistry.googleapis.com \
    --project="$PROJECT_ID"

# ─── 2. Create Cloud SQL instance (if not exists) ───
if ! gcloud sql instances describe "$DB_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
    echo "==> Creating Cloud SQL PostgreSQL instance..."
    gcloud sql instances create "$DB_INSTANCE" \
        --database-version=POSTGRES_16 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --project="$PROJECT_ID"

    gcloud sql databases create trading_assistant \
        --instance="$DB_INSTANCE" \
        --project="$PROJECT_ID"

    gcloud sql users set-password postgres \
        --instance="$DB_INSTANCE" \
        --password="${DB_PASSWORD:-changeme}" \
        --project="$PROJECT_ID"
else
    echo "==> Cloud SQL instance already exists"
fi

# ─── 3. Create Cloud Tasks queue (for reminders) ───
if ! gcloud tasks queues describe reminder-queue --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    echo "==> Creating Cloud Tasks queue..."
    gcloud tasks queues create reminder-queue \
        --location="$REGION" \
        --project="$PROJECT_ID"
else
    echo "==> Cloud Tasks queue already exists"
fi

# ─── 4. Build and push backend container ───
echo "==> Building backend container..."
gcloud builds submit \
    --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME-backend" \
    --project="$PROJECT_ID" \
    -f docker/Dockerfile.backend \
    .

# ─── 5. Deploy backend to Cloud Run ───
DB_CONNECTION=$(gcloud sql instances describe "$DB_INSTANCE" \
    --project="$PROJECT_ID" --format='value(connectionName)')

echo "==> Deploying backend to Cloud Run..."
gcloud run deploy "$SERVICE_NAME-backend" \
    --image="gcr.io/$PROJECT_ID/$SERVICE_NAME-backend" \
    --platform=managed \
    --region="$REGION" \
    --memory=1Gi \
    --cpu=1 \
    --timeout=300 \
    --max-instances=10 \
    --allow-unauthenticated \
    --add-cloudsql-instances="$DB_CONNECTION" \
    --set-env-vars="DATABASE_URL=postgresql://postgres:${DB_PASSWORD:-changeme}@/trading_assistant?host=/cloudsql/$DB_CONNECTION" \
    --set-env-vars="ALPHA_VANTAGE_API_KEY=${ALPHA_VANTAGE_API_KEY:-}" \
    --set-env-vars="REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID:-}" \
    --set-env-vars="REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET:-}" \
    --set-env-vars="NEWS_API_KEY=${NEWS_API_KEY:-}" \
    --set-env-vars="FLASK_SECRET_KEY=${FLASK_SECRET_KEY:-$(openssl rand -hex 32)}" \
    --project="$PROJECT_ID"

BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME-backend" \
    --platform=managed --region="$REGION" --project="$PROJECT_ID" \
    --format='value(status.url)')

echo "==> Backend deployed at: $BACKEND_URL"

# ─── 6. Build and push frontend container ───
echo "==> Building frontend container..."
gcloud builds submit \
    --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME-frontend" \
    --project="$PROJECT_ID" \
    -f docker/Dockerfile.frontend \
    .

# ─── 7. Deploy frontend to Cloud Run ───
echo "==> Deploying frontend to Cloud Run..."
gcloud run deploy "$SERVICE_NAME-frontend" \
    --image="gcr.io/$PROJECT_ID/$SERVICE_NAME-frontend" \
    --platform=managed \
    --region="$REGION" \
    --memory=256Mi \
    --cpu=1 \
    --max-instances=5 \
    --allow-unauthenticated \
    --project="$PROJECT_ID"

FRONTEND_URL=$(gcloud run services describe "$SERVICE_NAME-frontend" \
    --platform=managed --region="$REGION" --project="$PROJECT_ID" \
    --format='value(status.url)')

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
echo "  Database: $DB_INSTANCE ($REGION)"
echo "========================================="

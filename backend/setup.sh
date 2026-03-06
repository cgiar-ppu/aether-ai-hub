#!/bin/bash
set -e

echo "Setting up Co-Scientist Backend..."

python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from template"
fi

echo ""
echo "Setup complete! Run:"
echo "  source .venv/bin/activate && uvicorn app.main:app --reload"

import os

# Bind to 0.0.0.0 on the port assigned by Render ($PORT)
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Set worker count to 1 to prevent OOM on Render Free Tier
workers = 1

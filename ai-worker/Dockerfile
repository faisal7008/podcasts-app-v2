FROM python:3.11-slim

# Install system dependencies (ffmpeg is needed for Azure Speech SDK or audio conversion)
RUN apt-get update && apt-get install -y ffmpeg libasound2 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]

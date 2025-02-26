# Use an official lightweight Python image.
FROM python:3.9-slim

# Set the working directory inside the container.
WORKDIR /app

# Install system dependencies (if any required by some packages, adjust as needed).
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container.
COPY requirements.txt .

# Upgrade pip and install Python dependencies.
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Expose the port that the FastAPI app runs on.
EXPOSE 8000

# Start the FastAPI app using uvicorn.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
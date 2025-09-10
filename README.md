# Agent Supervisor System

A multi-agent system built with LangChain and LangGraph that uses a supervisor pattern to orchestrate specialized agents for Elasticsearch ingest pipeline generation and validation.

## 🏗️ Architecture

The system consists of:
- **Supervisor Agent**: Plans and orchestrates the workflow
- **Researcher Agent**: Gathers Elasticsearch documentation and best practices
- **Pipeline Generator Agent**: Creates Elasticsearch ingest pipeline configurations
- **Pipeline Validator Agent**: Tests and validates pipeline configurations

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- AWS credentials configured for Bedrock access

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` and add your AWS credentials:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### 3. Run the Application

**Option A: Full Stack (Recommended)**
```bash
npm run start:full
```

This command will:
- Start Elasticsearch using Docker Compose
- Wait for Elasticsearch to be ready
- Run the agent supervisor system
- Clean up containers on exit

**Option B: Manual Steps**
```bash
# Start Elasticsearch
npm run elasticsearch:up

# Wait for Elasticsearch to be ready, then run the app
npm run dev
```

### 4. Stop the Application

```bash
# Stop containers
npm run elasticsearch:down
```

## 📋 Available Scripts

- `npm run dev` - Run the application in development mode
- `npm run build` - Build the TypeScript project
- `npm run start` - Run the built application
- `npm run start:full` - Start everything (Elasticsearch + app) with one command
- `npm run elasticsearch:up` - Start Elasticsearch container
- `npm run elasticsearch:down` - Stop Elasticsearch container
- `npm run elasticsearch:logs` - View Elasticsearch logs


import { Client } from '@elastic/elasticsearch';
import { IngestSimulateRequest, IngestSimulateResponse } from '@elastic/elasticsearch/lib/api/types';
import { tool } from "@langchain/core/tools";

// Initialize Elasticsearch client for local instance
const esClient = new Client({
  node: 'http://localhost:9200',
  // Add authentication if needed
  // auth: {
  //   username: 'elastic',
  //   password: 'password'
  // }
});

/**
 * Elasticsearch tool that simulates an ingest pipeline API call
 * This tool allows you to test pipeline configurations without actually ingesting data
 */
export class ElasticsearchIngestPipelineTool {
  private readonly client: Client;

  constructor(client: Client = esClient) {
    this.client = client;
  }

  /**
   * Simulate an ingest pipeline to test how documents would be processed
   * @param request - The pipeline simulation request
   * @returns Promise with simulation results
   */
  async simulateIngestPipeline(
    request: IngestSimulateRequest
  ): Promise<IngestSimulateResponse> {
    try {
      const response = await this.client.ingest.simulate(request);
      return response;
    } catch (error) {
      console.error('Error simulating ingest pipeline:', error);
      throw new Error(`Failed to simulate ingest pipeline: ${error}`);
    }
  }

  /**
   * Check if Elasticsearch is running and accessible
   * @returns Promise<boolean>
   */
  async isElasticsearchRunning(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Elasticsearch is not accessible:', error);
      return false;
    }
  }
}

export const elasticsearchTool = tool(
  async (input: unknown) => {
    const request = input as IngestSimulateRequest;
    const tool = new ElasticsearchIngestPipelineTool();
    return await tool.simulateIngestPipeline(request);
  },
  {
    name: "elasticsearch_simulate_pipeline",
    description: "Simulate an Elasticsearch ingest pipeline to test how documents would be processed",
    schema: {
      type: "object",
      properties: {
        pipeline: {
          type: "object",
          description: "The pipeline configuration"
        },
        docs: {
          type: "array",
          description: "Documents to process"
        }
      },
      required: ["pipeline", "docs"]
    }
  }
);


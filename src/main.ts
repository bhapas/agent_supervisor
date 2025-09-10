import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./agents/graph";


async function main() {
  // Show tracing information
  console.log('');

  let streamResults = graph.stream(
    {
      messages: [
        new HumanMessage({
          content: `Generate an ingest pipeline for the following log samples:
          
2024-01-15 10:30:45 INFO [user-service] User login successful for user_id: 12345
2024-01-15 10:31:12 ERROR [payment-service] Payment failed for order_id: 67890, error: insufficient_funds
2024-01-15 10:32:05 DEBUG [auth-service] Token validation successful for user_id: 12345
2024-01-15 10:33:22 WARN [inventory-service] Low stock alert: product_id: 555, remaining: 3
2024-01-15 10:34:18 INFO [order-service] Order created successfully: order_id: 67891, user_id: 12345

Please analyze these log samples and generate an appropriate Elasticsearch ingest pipeline.`,
        }),
      ],
    },
    { recursionLimit: 100 },
  );
  
  for await (const output of await streamResults) {
    console.log(JSON.stringify(output, null, 2));
    console.log("----");
  }
}

main().catch(console.error);
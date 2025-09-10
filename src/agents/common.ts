import { ChatBedrockConverse } from "@langchain/aws";
import "dotenv/config";


export const llm = new ChatBedrockConverse({
  temperature: 0,
  model: "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
});
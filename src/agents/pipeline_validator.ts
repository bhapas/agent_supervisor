import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "./common";
import { AgentState } from "../state";
import { elasticsearchTool } from "../toots";

const pipelineValidatorAgent = createReactAgent({
    llm,
    tools: [elasticsearchTool],
    stateModifier: new SystemMessage("You are an expert in validating ingest pipelines for elasticsearch. "+ 
        "Use the elasticsearch tool to validate the pipelines for the given log samples. Make sure you form the right request with required headers and content type to the elasticsearch tool.")
  })
  
  export const ingestPipelineValidatorNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig,
  ) => {
    const result = await pipelineValidatorAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
      messages: [
        new HumanMessage({ content: lastMessage?.content || "No content", name: "IngestPipelineValidator" }),
    ],
    };
  };
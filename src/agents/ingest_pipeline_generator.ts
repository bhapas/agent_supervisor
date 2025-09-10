import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "./common";
import { AgentState } from "../state";

const chartGenAgent = createReactAgent({
    llm,
    tools: [],
    stateModifier: new SystemMessage("You are an expert in generating ingest pipelines for elasticsearch." + 
        " Use researcher's information to generate the pipelines for the given log samples. Make sure you use the correct processors and settings for the given log samples." + 
        "Make sure you return the pipeline in a valid json format.")
  })
  
  export const ingestPipelineGeneratorNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig,
  ) => {
    const result = await chartGenAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
      messages: [
        new HumanMessage({ content: lastMessage?.content || "No content", name: "IngestPipelineGenerator" }),
    ],
    };
  };
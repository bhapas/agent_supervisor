import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "./common";


const researcherAgent = createReactAgent({
  llm,
  tools: [],
  stateModifier: new SystemMessage("You are a web researcher. You may use the internet to serach for any elastic related documentation and return the documentation results as a markdown file."+ 
    " You need to provide all the documentaion related to elasticsearch ingest pipeline processors so that ingest pipeline generator can genearate a pipeline. You strictly just return the documentation results as a markdown file and do not attempt to generate a pipeline.")
})

export const researcherNode = async (
  state: typeof AgentState.State,
  config?: RunnableConfig,
) => {
  const result = await researcherAgent.invoke(state, config);
  const lastMessage = result.messages[result.messages.length - 1];
  return {
    messages: [
      new HumanMessage({ content: lastMessage?.content || "No content", name: "Researcher" }),
    ],
  };
};
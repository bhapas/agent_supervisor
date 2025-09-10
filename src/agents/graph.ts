import { START, StateGraph } from "@langchain/langgraph";
import { AgentState } from "../state";
import { researcherNode } from "./researcher";
import { ingestPipelineGeneratorNode } from "./ingest_pipeline_generator";
import { supervisorNode } from "./agent_supervisor";
import { ingestPipelineValidatorNode } from "./pipeline_validator";

// 1. Create the graph
const workflow = new StateGraph(AgentState)
  // 2. Add the nodes; these will do the work
  .addNode("researcher", researcherNode)
  .addNode("ingest_pipeline_generator", ingestPipelineGeneratorNode)
  .addNode("ingest_pipeline_validator", ingestPipelineValidatorNode)
  .addNode("supervisor", supervisorNode);
// 3. Define the edges. We will define both regular and conditional ones
// After a worker completes, report to supervisor
workflow.addEdge("researcher", "supervisor");
workflow.addEdge("ingest_pipeline_generator", "supervisor");
workflow.addEdge("ingest_pipeline_validator", "supervisor");

workflow.addConditionalEdges(
  "supervisor",
  (x: typeof AgentState.State) => x.next,
);

workflow.addEdge(START, "supervisor");

export const graph = workflow.compile();
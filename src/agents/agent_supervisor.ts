import { z } from "zod";
import { ChatBedrockConverse } from "@langchain/aws";
import { END } from "@langchain/langgraph";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { AgentState } from "../state";
import { HumanMessage } from "@langchain/core/messages";

const members = ["researcher", "ingest_pipeline_generator", "ingest_pipeline_validator", "supervisor"] as const;

// Planning tool for the supervisor
const planningTool = tool(
  async (input: unknown) => {
    const { userRequest, context } = input as { 
      userRequest: string; 
      context?: string; 
    };
    
    // Analyze the request type and complexity
    const requestLower = userRequest.toLowerCase();
    let requestType = "general";
    let complexity = "medium";
    let requiredAgents = ["researcher", "ingest_pipeline_generator", "ingest_pipeline_validator"];
    let executionSteps: Array<{
      step: number;
      agent: string;
      task: string;
      description: string;
      expectedOutput: string;
      estimatedTime: string;
    }> = [];
    
    // Determine request type and create appropriate plan
    if (requestLower.includes("pipeline") || requestLower.includes("ingest")) {
      requestType = "elasticsearch_pipeline_generation";
      complexity = "high";
      
      executionSteps = [
        {
          step: 1,
          agent: "researcher",
          task: "Research Elasticsearch ingest pipeline documentation and best practices",
          description: "Gather comprehensive information about Elasticsearch ingest processors, ECS field mappings, and pipeline optimization techniques",
          expectedOutput: "Documentation and best practices for pipeline generation",
          estimatedTime: "2-3 minutes"
        },
        {
          step: 2,
          agent: "ingest_pipeline_generator", 
          task: "Generate ingest pipeline configuration",
          description: "Create a complete Elasticsearch ingest pipeline based on the log samples and research findings",
          expectedOutput: "Complete pipeline configuration with processors, field mappings, and error handling",
          estimatedTime: "3-5 minutes"
        },
        {
          step: 3,
          agent: "ingest_pipeline_validator",
          task: "Validate and test the pipeline",
          description: "Test the generated pipeline against the provided log samples to ensure proper processing",
          expectedOutput: "Validation results and any necessary pipeline adjustments",
          estimatedTime: "2-3 minutes"
        }
      ];
    }
    
    // Create comprehensive plan
    const plan = {
      request: userRequest,
      analysis: {
        type: requestType,
        complexity: complexity,
        estimatedSteps: executionSteps.length + 1, // +1 for planning
        requiredAgents: requiredAgents,
        dependencies: [],
        estimatedTotalTime: executionSteps.reduce((total, step) => {
          const time = parseInt(step.estimatedTime.split('-')[0] || '0');
          return total + time;
        }, 0) + " minutes"
      },
      executionPlan: executionSteps,
      successCriteria: [
        "All required tasks are completed successfully",
        "Output meets quality standards",
        "Results are properly documented",
        "Any errors or issues are identified and addressed"
      ],
      context: context || "No additional context provided",
      timestamp: new Date().toISOString(),
      status: "planned"
    };
    
    return plan;
  },
  {
    name: "create_execution_plan",
    description: "Analyze user requirements and create a comprehensive execution plan for the agent team",
    schema: {
      type: "object",
      properties: {
        userRequest: {
          type: "string",
          description: "The user's original request or requirement"
        },
        context: {
          type: "string",
          description: "Additional context or constraints for the plan"
        }
      },
      required: ["userRequest"]
    }
  }
);

const systemPrompt =
  "You are a supervisor tasked with managing a conversation between the" +
  " following workers: {members}. You have access to a planning tool that can analyze user requirements and create execution plans." +
  " WORKFLOW: If no execution plan exists yet, use the planning tool to create one, then route back to 'supervisor' to continue with execution." +
  " If an execution plan exists, use the routing tool to select the next worker to execute the plan." +
  " Each worker will perform a task and respond with their results and status. When all tasks are completed, respond with FINISH.";
const options = [END, ...members];


// Define the routing function
const routingTool = {
  name: "route",
  description: "Select the next role.",
  schema: z.object({
    next: z.enum([END, ...members]),
  }),
}

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "human",
    "Given the conversation above, who should act next?" +
    " Or should we FINISH? Select one of: {options}",
  ],
]);

export const supervisorChain = async function createSupervisorChain() {
  const formattedPrompt = await prompt.partial({
    options: options.join(", "),
    members: members.join(", "),
  });

  const llm = new ChatBedrockConverse({
    temperature: 0,
    model: "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
  });

  return formattedPrompt
    .pipe(llm.bindTools(
      [routingTool, planningTool],
      {
        tool_choice: "auto",
      },
    ));
}

export const supervisorNode = async (
  state: typeof AgentState.State,
) => {
  const chain = await supervisorChain();
  const result = await chain.invoke(state);
  
  // Handle tool calls and update state accordingly
  if (result.tool_calls && result.tool_calls.length > 0) {
    const toolCall = result.tool_calls[0];
    
    if (toolCall && toolCall.name === "create_execution_plan") {
      // Execute the planning tool and update state
      const plan = await planningTool.invoke(toolCall.args);
      
      return {
        messages: [
          new HumanMessage({ 
            content: `Execution plan created: ${JSON.stringify(plan, null, 2)}`, 
            name: "Supervisor" 
          }),
        ],
        executionPlan: plan,
        planningComplete: true,
        next: "supervisor", // Route back to supervisor to continue with execution
      };
    } else if (toolCall && toolCall.name === "route") {
      // Return the routing decision
      return {
        messages: [
          new HumanMessage({ 
            content: `Routing to: ${toolCall.args['next']}`, 
            name: "Supervisor" 
          }),
        ],
        next: toolCall.args['next'],
      };
    }
  }
  
  return {
    messages: [
      new HumanMessage({ 
        content: "No valid action taken", 
        name: "Supervisor" 
      }),
    ],
    next: END,
  };
}
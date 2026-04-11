const GITHUB_ENDPOINT = "https://models.github.ai/inference";
const MODEL = "openai/gpt-4o-mini";

const system_prompt = `
You are a helpful AI Assistant who is specialized in receiving user query in user language.

You work on start, plan, action, observe mode.
for the given query and available tools, plan the step by step execution, based on the planning, select the relevant tool from the available tool and based on the toll selection you perform an action to call the tool.
Wait for the observation and based on the observation from the tool call resolve the user query.

Rules:
- Follow the Output JSON Format.
- Always perform one step at a time and wait for next input
- Carefully analyse the user query

Output JSON Format:
{
  "step": "string",
  "content": "string",
  "function": "The name of function if the step is action",
  "input": "The input parameter for the function"
}

Example:
User Query: What is the weather of new york?
Output: { "step": "plan", "content": "The user is interseted in weather data of new york" }
Output: { "step": "plan", "content": "From the available tools I should call get_weather" }
Output: { "step": "action", "function": "get_weather", "input": "new york" }
Output: { "step": "observe", "output": "12 Degree Cel" }
Output: { "step": "output", "content": "The weather for new york seems to be 12 degrees." }
`;

const get_weather = async (city) => {
  console.log("🔧 Tool Called: get_weather", city);
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  try {
    const res = await fetch(url);
    const jsonData = await res.json();
    const current = jsonData.current_condition[0];
    return `The current temperature in ${city} is ${current.temp_C}°C with ${current.weatherDesc[0].value}.`;
  } catch (err) {
    return "Weather data could not be fetched.";
  }
};

const available_tools = {
  get_weather: {
    fn: get_weather,
    description: "takes city name as an input and returns the current weather for the city",
  },
};

export async function runWeatherAgent(userQuery, token, onStep) {
  if (!token) throw new Error("GITHUB_TOKEN is missing");

  let messages = [
    { role: "system", content: system_prompt },
    { role: "user", content: userQuery }
  ];

  let done = false;
  let iterations = 0;
  const maxIterations = 10;

  while (!done && iterations < maxIterations) {
    iterations++;
    
    const response = await fetch(`${GITHUB_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    let parsed;
    try {
      // Sometimes the model might wrap JSON in backticks
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch (err) {
      console.error("Failed to parse agent response:", rawContent);
      throw new Error("Agent returned invalid JSON format.");
    }

    onStep(parsed);

    if (parsed.step === "output") {
      done = true;
    } else if (parsed.step === "plan") {
      messages.push({
        role: "assistant",
        content: JSON.stringify(parsed),
      });
    } else if (parsed.step === "action") {
      const toolResult = await available_tools[parsed.function].fn(parsed.input);
      const observation = {
        step: "observe",
        output: toolResult,
      };
      onStep(observation);
      messages.push({
        role: "assistant",
        content: JSON.stringify(observation),
      });
    } else if (parsed.step === "observe") {
      messages.push({
        role: "assistant",
        content: JSON.stringify(parsed),
      });
    }
  }
}

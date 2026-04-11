import OpenAI from "openai";
import dotenv from "dotenv";
import https from 'https';
dotenv.config();

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4o-mini";

if (!token) {
  throw new Error("GITHUB_TOKEN is missing");
}

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

`

const get_weather = (city) => {
  console.log("🔧 Tool Called: get_weather", city);

  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            const current = jsonData.current_condition[0];

            resolve(
              `The current temperature in ${city} is ${current.temp_C}°C with ${current.weatherDesc[0].value}.`
            );
          } catch (err) {
            resolve("Weather data could not be parsed.");
          }
        });
      })
      .on("error", () => {
        resolve("Weather service is unavailable.");
      });
  });
};


const available_tools = {
  get_weather: {
    fn: get_weather,
    description:
      "takes city name as an input and returns the current weather for the city",
  },
};


async function main() {
  const client = new OpenAI({
    baseURL: endpoint,
    apiKey: token,
  });

  let messages = [
    { role: "system", content: system_prompt },
  ];

  const user_query =
    "what is weather in siliguri in F?";

  messages.push({ role: "user", content: user_query });

  let done = false;

  while (!done) {
    const response = await client.chat.completions.create({
      model,
      messages,
    });

    const raw = response.choices[0].message.content;
    const raw1 = JSON.parse(raw);
    console.log("RAW:", raw1.content);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error("Model did not return valid JSON");
    }

    console.log("STEP:", parsed.step);
if (parsed.step === "output") {
  done = true;
  console.log("\nFINAL ANSWER:");
  console.log(parsed.content);

}

else if (parsed.step === "plan") {
  console.log("🧠 PLAN:", parsed.content);

  messages.push({
    role: "assistant",
    content: JSON.stringify(parsed),
  });
}

else if (parsed.step === "action") {
  console.log("🔦 ACTION:", parsed.function, parsed.input);

  const toolResult =
    await available_tools[parsed.function].fn(parsed.input);

  messages.push({
    role: "assistant",
    content: JSON.stringify({
      step: "observe",
      output: toolResult,
    }),
  });
}

else if (parsed.step === "observe") {
  console.log("👀 OBSERVE:", parsed.output);

  messages.push({
    role: "assistant",
    content: JSON.stringify(parsed),
  });
}

else {
  throw new Error(`Unknown step: ${parsed.step}`);
}

  }
}

main().catch(console.error);

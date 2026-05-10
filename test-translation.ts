import { geminiService } from "./src/services/geminiService.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const result = await geminiService.translateText("Hello world", "Pidgin");
  console.log("Translation:", result);
}
test();

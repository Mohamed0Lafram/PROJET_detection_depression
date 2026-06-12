import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { execSync } from "child_process";
import path from "path";

const PREDICT_SCRIPT = path.join(process.cwd(), "predict_state.py");

export const predictState = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string() }))
  .handler(async ({ data }) => {
    try {
      const text = data.text.trim();
      if (!text) {
        return { state: 0, confidence: 0 };
      }

      // Run Python prediction script
      const result = execSync(
        `python3 "${PREDICT_SCRIPT}" "${text.replace(/"/g, '\\"')}"`,
        { encoding: "utf-8" }
      );

      const parsed = JSON.parse(result);
      return parsed;
    } catch (error) {
      console.error("Prediction error:", error);
      // Fallback to default state on error
      return { state: 0, confidence: 0 };
    }
  });

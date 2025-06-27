
/**
 * @fileOverview Defines the Zod schemas and TypeScript types for chart data generation.
 * This is shared between the AI flow and the frontend.
 */
import {z} from 'zod';

export const GenerateChartDataInputSchema = z.object({
  title: z.string().describe("The title of the chart."),
  description: z.string().describe("A detailed description of the insight the chart should represent."),
  type: z.enum(['bar', 'line', 'area']).describe("The type of chart to generate data for."),
});
export type GenerateChartDataInput = z.infer<typeof GenerateChartDataInputSchema>;

export const GenerateChartDataOutputSchema = z.object({
  data: z.string().describe("The JSON string representation of the chart data array."),
  config: z.string().describe("The JSON string representation of the chart config object."),
});
export type GenerateChartDataOutput = z.infer<typeof GenerateChartDataOutputSchema>;

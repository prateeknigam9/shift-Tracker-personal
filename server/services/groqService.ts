import { Shift } from "@shared/schema";
import fetch from 'node-fetch';

interface GroqServiceInterface {
  generateDashboardSummary(shifts: Shift[]): Promise<string>;
  processNotes(notes: string): Promise<string>;
  generateReportInsights(analyticsData: any): Promise<string>;
  generateAchievementDescription(achievementType: string, data: any): Promise<string>;
}

class GroqService implements GroqServiceInterface {
  private apiKey: string | undefined;
  private baseUrl: string = "https://api.groq.com/openai/v1";

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    if (!this.apiKey) {
      console.warn("GROQ_API_KEY not set. AI features will be limited.");
    }
  }

  private async makeGroqRequest(prompt: string, model: string = "llama3-70b-8192"): Promise<string> {
    if (!this.apiKey) {
      return "AI insights not available. Please set GROQ_API_KEY environment variable.";
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "You are a helpful assistant that specializes in analyzing work and shift data." },
            { role: "user", content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 800
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("GROQ API error:", data);
        return "Error generating AI insights. Please try again later.";
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling GROQ API:", error);
      return "Error generating AI insights. Please try again later.";
    }
  }

  async generateDashboardSummary(shifts: Shift[]): Promise<string> {
    const shiftsData = JSON.stringify(shifts.map(shift => ({
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      hourly_rate: shift.hourly_rate,
      break_time: shift.break_time,
      notes: shift.notes
    })));

    const prompt = `
      I have data from my work shifts over time. Please analyze this data and provide insights including:
      1. Overall work patterns (hours per week, typical shift times)
      2. Earnings trends
      3. Any actionable suggestions based on this data
      4. A short motivational message

      Keep your response concise and actionable.
      Here's my shift data: ${shiftsData}
    `;

    return this.makeGroqRequest(prompt);
  }

  async processNotes(notes: string): Promise<string> {
    const prompt = `
      I have notes from my work that I'd like you to analyze and organize:
      "${notes}"
      
      Please:
      1. Extract and categorize key points
      2. Identify any action items or follow-ups
      3. Summarize the main themes
      4. Suggest any improvements or things I might have missed
      
      Format your response in a well-organized way that's easy to read.
    `;

    return this.makeGroqRequest(prompt);
  }

  async generateReportInsights(analyticsData: any): Promise<string> {
    const dataString = JSON.stringify(analyticsData);
    
    const prompt = `
      Here is my work analytics data: ${dataString}
      
      Please provide:
      1. Key patterns or trends you notice in the data
      2. How my work hours and earnings compare to typical patterns
      3. Suggestions for optimizing my schedule or earnings
      4. Any potential issues or opportunities to be aware of
      
      Keep your insights concise, data-driven, and actionable.
    `;

    return this.makeGroqRequest(prompt);
  }

  async generateAchievementDescription(achievementType: string, data: any): Promise<string> {
    const prompt = `
      I've reached a milestone in my work tracking. Please create an encouraging and motivational achievement description for:
      Achievement type: ${achievementType}
      Data: ${JSON.stringify(data)}
      
      The description should be uplifting, specific to the achievement type, and reference the data provided.
      Keep it under 3 sentences and make it motivational.
    `;

    return this.makeGroqRequest(prompt);
  }
}

export const groqService = new GroqService();
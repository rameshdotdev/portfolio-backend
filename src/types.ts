export interface ProjectContext {
  title: string;
  excerpt: string;
  github: string;
}
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

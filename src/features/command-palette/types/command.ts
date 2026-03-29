export type CommandCategory = "action" | "navigation" | "search";

export type CommandHandler = () => void;

export type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  category: CommandCategory;
  handler: CommandHandler;
};


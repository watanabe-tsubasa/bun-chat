export type ChatMessage = {
  id: number;
  name: string;
  message: string;
  ts: number;
};
export type PresenceEvent = { type: "presence"; count: number };
export type ChatEvent = { type: "chat"; payload: ChatMessage };
export type EventPayload = PresenceEvent | ChatEvent;
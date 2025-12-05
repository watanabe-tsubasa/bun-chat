import type { ChatMessage } from "src/types";

export function MessageItem({ message, own }: { message: ChatMessage; own: boolean }) {
  const time = new Date(message.ts * 1000).toLocaleTimeString();
  const bubbleStyle = own
    ? "margin:6px 0; text-align:right;"
    : "margin:6px 0; text-align:left;";
  const msgStyle = own
    ? "display:inline-block; background:#d1e7ff; color:#0b3b75; padding:6px 10px; border-radius:12px 12px 0 12px;"
    : "display:inline-block; background:#f2f2f2; color:#222; padding:6px 10px; border-radius:12px 12px 12px 0;";
  return (
    <li style={bubbleStyle}>
      <div style={msgStyle}>
        <strong>{message.name}: </strong>
        {message.message}
      </div>
      <div style="font-size:12px; color:#666; margin-top:2px;">{time}</div>
    </li>
  );
}
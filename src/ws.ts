export type WsClientLike = {
  send: (message: string | Uint8Array) => void;
};

export function broadcast(clients: Set<WsClientLike>, data: unknown): number {
  const message = JSON.stringify(data);
  for (const client of clients) {
    client.send(message);
  }
  return clients.size;
}

export function broadcastPresence(clients: Set<WsClientLike>): number {
  return broadcast(clients, { type: "presence", count: clients.size });
}

export function broadcastChat(
  clients: Set<WsClientLike>,
  payload: { name: string; message: string; ts: number },
): number {
  return broadcast(clients, { type: "chat", payload });
}

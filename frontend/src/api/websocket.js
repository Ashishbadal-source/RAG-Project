export const createWebSocket = (experimentId, onMessage, onError, onClose) => {
  const ws = new WebSocket(`ws://localhost:8000/api/experiments/${experimentId}/live`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error("Failed to parse WS message", e);
    }
  };
  
  if (onError) ws.onerror = onError;
  if (onClose) ws.onclose = onClose;
  
  return ws;
};

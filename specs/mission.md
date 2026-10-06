# Mission: tec-wa-message-ws

## Purpose
The **tec-wa-message-ws** microservicio is a critical gateway in the **SMART CHATBOT IA** ecosystem. Its mission is to bridge the gap between the WhatsApp WebSocket protocol (via Baileys) and the internal REST-based orchestration layer.

## Core Objectives
- **Reliable Message Gateway**: Act as the entry point for all incoming WhatsApp interactions, ensuring they are captured and acknowledged.
- **Data Normalization**: Transform complex, raw WhatsApp message objects into a clean, standardized `MessageDTO` for internal consumption.
- **Orchestrator Integration**: Efficiently forward normalized messages to the `tec-messages-ws` orchestrator via REST.
- **Multi-Session Scalability**: Design with the capability to manage and persist multiple WhatsApp sessions/accounts.
- **Minimal Footprint**: Maintain high performance and low resource consumption by leveraging Baileys' non-Selenium architecture.

## Success Metrics
- 100% success rate in message normalization from raw Baileys format.
- Sub-second latency between message reception and forwarding to the orchestrator.
- Stable, long-running WebSocket connections with automatic reconnection logic.

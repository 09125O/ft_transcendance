/// <reference types="jest" />

import { RealtimePresenceService } from "./realtime-presence.service";

describe("RealtimePresenceService", () => {
  it("tracks and clears spectator state", () => {
    const service = new RealtimePresenceService();

    service.bindSocketToUser("socket-1", 10);
    service.markSpectator("socket-1", 7);

    expect(service.isSpectator("socket-1", 7)).toBe(true);
    expect(service.getSpectatorCount(7)).toBe(1);

    service.unregisterSocket("socket-1");

    expect(service.getSpectatorCount(7)).toBe(0);
    expect(service.isSpectator("socket-1", 7)).toBe(false);
  });
});

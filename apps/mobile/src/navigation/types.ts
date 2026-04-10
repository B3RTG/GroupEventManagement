// ── Navigation type definitions ───────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main:  undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  EventsTab:    undefined;
  ProfileTab:   undefined;
};

export type DashboardStackParamList = {
  Dashboard:   undefined;
  GroupDetail: { groupId: string };
  EventDetail: { groupId: string; eventId: string };
};

export type EventsStackParamList = {
  EventsList:  undefined;
  EventDetail: { groupId: string; eventId: string };
};

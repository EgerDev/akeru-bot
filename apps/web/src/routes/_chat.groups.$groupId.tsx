import { createFileRoute } from "@tanstack/react-router";

import { GroupThreadLanding } from "../components/roster/GroupThreadLanding";

function GroupThreadRouteView() {
  const { groupId } = Route.useParams();
  return <GroupThreadLanding groupId={groupId} />;
}

export const Route = createFileRoute("/_chat/groups/$groupId")({
  component: GroupThreadRouteView,
});

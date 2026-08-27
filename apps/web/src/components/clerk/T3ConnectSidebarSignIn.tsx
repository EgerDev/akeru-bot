import { UserButton, useAuth } from "@clerk/react";
import { Login01Icon, ServerIcon, SmartphoneIcon } from "@hugeicons/core-free-icons";

import { hasCloudPublicConfig } from "../../cloud/publicConfig";
import { AppIcon } from "../ui/app-icon";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { MobileClientsUserProfilePage } from "./MobileClientsUserProfilePage";
import { T3ConnectUserProfilePage } from "./T3ConnectUserProfilePage";
import { useT3ConnectAuthPrompt } from "./useT3ConnectAuthPrompt";

export function T3ConnectSidebarSignIn() {
  if (!hasCloudPublicConfig()) return null;

  return <ConfiguredT3ConnectSidebarSignIn />;
}

export function T3ConnectSidebarAvatar() {
  if (!hasCloudPublicConfig()) return null;

  return <ConfiguredT3ConnectSidebarAvatar />;
}

function ConfiguredT3ConnectSidebarAvatar() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) return null;

  return (
    <UserButton
      showName
      appearance={{
        elements: {
          rootBox: "w-full",
          userButtonBox: "w-full",
          avatarBox: "size-8 ring-1 ring-sidebar-border",
          userButtonTrigger:
            "w-full min-h-11 justify-start gap-2.5 rounded-lg px-2 py-1.5 text-sidebar-foreground hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-ring",
          userButtonOuterIdentifier: "min-w-0 truncate text-sm font-medium",
        },
      }}
    >
      <UserButton.UserProfilePage
        label="Mobile clients"
        labelIcon={<AppIcon className="size-4" icon={SmartphoneIcon} />}
        url="mobile-clients"
      >
        <MobileClientsUserProfilePage />
      </UserButton.UserProfilePage>
      <UserButton.UserProfilePage
        label="Linked environments"
        labelIcon={<AppIcon className="size-4" icon={ServerIcon} />}
        url="t3-connect"
      >
        <T3ConnectUserProfilePage />
      </UserButton.UserProfilePage>
    </UserButton>
  );
}

function ConfiguredT3ConnectSidebarSignIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const { authPrompt, openAuthPrompt } = useT3ConnectAuthPrompt();

  if (!isLoaded || isSignedIn) return null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={openAuthPrompt}>
            <AppIcon icon={Login01Icon} />
            <span>Sign in for remote access</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {authPrompt}
    </>
  );
}

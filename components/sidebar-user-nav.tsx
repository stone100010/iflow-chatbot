"use client";

import { ChevronUp, Settings as SettingsIcon, LogOut } from "lucide-react";
import Image from "next/image";
import type { User } from "next-auth";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SettingsDialog } from "@/components/settings/settings-dialog";

export function SidebarUserNav({ user }: { user: User }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="user-nav-button"
            >
              <Image
                alt={user.email ?? "User Avatar"}
                className="rounded-full"
                height={24}
                src={`https://avatar.vercel.sh/${user.email}`}
                width={24}
              />
              <span className="truncate" data-testid="user-email">
                {user?.email}
              </span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            {/* Settings 选项 */}
            <SettingsDialog>
              <DropdownMenuItem
                className="cursor-pointer"
                data-testid="user-nav-item-settings"
                onSelect={(e) => {
                  e.preventDefault(); // 阻止默认关闭行为
                }}
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </SettingsDialog>

            <DropdownMenuSeparator />

            {/* Sign out 选项 */}
            <DropdownMenuItem
              asChild
              data-testid="user-nav-item-auth"
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <button
                className="w-full cursor-pointer flex items-center"
                onClick={async () => {
                  await signOut({ redirect: false });
                  window.location.href = "/login";
                }}
                type="button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

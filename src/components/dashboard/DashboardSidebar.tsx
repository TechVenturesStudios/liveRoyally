import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, User, SwitchCamera } from "lucide-react";
import { User as UserType } from "@/utils/userStorage";
import { UserType as UserTypeEnum } from "@/types/user";
import { getNavItems } from "@/utils/navigationItems";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchRepresentativeAssignments, type RepresentativeAssignment } from "@/api/authorizedRepresentatives";
import { getDashboardContext, getEffectiveDashboardType, setDashboardContext } from "@/utils/dashboardContext";

interface DashboardSidebarProps {
  user: UserType;
  collapsed: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}

const DashboardSidebar = ({ user, collapsed, onToggle, onCollapse }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [assignments, setAssignments] = useState<RepresentativeAssignment[]>([]);
  const currentContext = getDashboardContext();
  const effectiveType = getEffectiveDashboardType(user?.userType as any) || user?.userType;
  const navItems = getNavItems(effectiveType as UserTypeEnum);
  const currentAssignment = assignments.find((assignment) => assignment.assignmentId === currentContext?.assignmentId);

  useEffect(() => {
    if (user?.userType !== "member") {
      setAssignments([]);
      return;
    }

    let isMounted = true;

    const loadAssignments = async () => {
      try {
        const data = await fetchRepresentativeAssignments();
        if (isMounted) {
          setAssignments(data.assignments);
          if (
            currentContext?.mode === "rep" &&
            currentContext.assignmentId &&
            !data.assignments.some((assignment) => assignment.assignmentId === currentContext.assignmentId)
          ) {
            setDashboardContext({ mode: "member" });
          }
        }
      } catch {
        if (isMounted) {
          setAssignments([]);
        }
      }
    };

    void loadAssignments();

    return () => {
      isMounted = false;
    };
  }, [currentContext?.assignmentId, currentContext?.mode, user?.userType]);

  const handleViewChange = (value: string) => {
    if (value === "member") {
      setDashboardContext({ mode: "member" });
      navigate("/dashboard");
      return;
    }

    const assignment = assignments.find((item) => item.assignmentId === value);
    if (!assignment) return;

    setDashboardContext({
      mode: "rep",
      assignmentId: assignment.assignmentId,
      targetType: assignment.representedUserType,
      targetLabel: assignment.representedName,
    });

    navigate(assignment.representedUserType === "partner" ? "/dashboard/crm" : "/dashboard/providers");
  };

  const currentViewValue = currentContext?.mode === "rep" && currentContext.assignmentId ? currentContext.assignmentId : "member";

  return (
    <aside
      className={`hidden md:flex border-r border-gray-200 bg-white flex-col transition-all duration-200 relative ${
        collapsed ? "w-16" : "w-64 lg:w-72"
      }`}
    >
      {/* Toggle button on the border */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-brand-purple hover:border-brand-purple transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className="flex-1 p-2 flex flex-col gap-1">
        {/* Profile avatar + user info */}
        <div className={`mb-2 flex items-center gap-3 py-3 ${collapsed ? "justify-center" : "px-3"}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/dashboard/profile")}
                className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  location.pathname === "/dashboard/profile"
                    ? "bg-brand-purple text-white ring-2 ring-brand-purple/30"
                    : "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
                }`}
              >
                <User className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Profile</TooltipContent>
          </Tooltip>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.displayId || "User ID"}</p>
              <p className="text-xs text-gray-500 capitalize">
                {effectiveType || "Member"}
              </p>
            </div>
          )}
        </div>

        {!collapsed && user?.userType === "member" && assignments.length > 0 && (
          <div className="px-2 pb-2">
            <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 mb-2">
                <SwitchCamera className="h-3.5 w-3.5" />
                Switch View
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-full justify-between gap-2 border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <SwitchCamera className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {currentContext?.mode === "rep" && currentAssignment
                          ? `${currentAssignment.representedUserType === "partner" ? "Partner" : "Provider"} View`
                          : "Member View"}
                      </span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Switch View</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={currentViewValue} onValueChange={handleViewChange}>
                    <DropdownMenuRadioItem value="member">
                      <div className="flex flex-col items-start">
                        <span>Member View</span>
                        <span className="text-[10px] text-muted-foreground">Your personal dashboard</span>
                      </div>
                    </DropdownMenuRadioItem>
                    {assignments.map((assignment) => (
                      <DropdownMenuRadioItem key={assignment.assignmentId} value={assignment.assignmentId}>
                        <div className="flex flex-col items-start">
                          <span>
                            {assignment.representedUserType === "partner" ? "Partner" : "Provider"} View
                          </span>
                          <span className="text-[10px] text-muted-foreground">{assignment.representedName}</span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Nav items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const btn = (
              <Button
                key={item.name}
                variant="ghost"
                className={`w-full font-medium text-gray-600 hover:text-brand-purple hover:bg-brand-purple/5 ${
                  collapsed ? "justify-center px-2" : "justify-start"
                } ${isActive ? "bg-brand-purple/10 text-brand-purple" : ""}`}
                onClick={() => { navigate(item.path); onCollapse(); }}
              >
                <item.icon className={`h-4 w-4 ${collapsed ? "" : "mr-3"} shrink-0`} />
                {!collapsed && item.name}
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;

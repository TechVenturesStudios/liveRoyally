import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, User as UserIcon, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User as UserType } from "@/utils/userStorage";
import { UserType as UserTypeEnum } from "@/types/user";
import { getNavItems } from "@/utils/navigationItems";
import {
  getEffectiveDashboardType,
  getDashboardContext,
  setDashboardContext,
} from "@/utils/dashboardContext";
import { fetchRepresentativeAssignments, type RepresentativeAssignment } from "@/api/authorizedRepresentatives";

interface DashboardMobileNavProps {
  user: UserType;
}

const DashboardMobileNav = ({ user }: DashboardMobileNavProps) => {
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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 shrink-0 rounded-full text-gray-600 hover:bg-brand-purple/5 hover:text-brand-purple"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] border-r border-gray-200 p-0">
        <div className="flex h-full flex-col bg-white">
          <SheetHeader className="border-b border-gray-200 px-5 py-4 text-left">
            <SheetTitle className="text-base">Navigation</SheetTitle>
            <div className="text-sm text-muted-foreground">
              {user?.displayId || user?.email || "User"}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-5 px-4 py-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{user?.displayId || "User ID"}</p>
                    <p className="text-xs capitalize text-gray-500">{effectiveType || "Member"}</p>
                  </div>
                </div>
              </div>

              {user?.userType === "member" && assignments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <SwitchCamera className="h-4 w-4" />
                    Switch View
                  </div>
                  <div className="space-y-2">
                    <SheetClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start border-gray-200 bg-white text-left"
                        onClick={() => handleViewChange("member")}
                      >
                        <span className="flex flex-col items-start">
                          <span>Member View</span>
                          <span className="text-[11px] text-muted-foreground">Your personal dashboard</span>
                        </span>
                      </Button>
                    </SheetClose>
                    {assignments.map((assignment) => (
                      <SheetClose asChild key={assignment.assignmentId}>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start border-gray-200 bg-white text-left"
                          onClick={() => handleViewChange(assignment.assignmentId)}
                        >
                          <span className="flex flex-col items-start">
                            <span>
                              {assignment.representedUserType === "partner" ? "Partner" : "Provider"} View
                            </span>
                            <span className="text-[11px] text-muted-foreground">{assignment.representedName}</span>
                          </span>
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Menu</div>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                      <SheetClose asChild key={item.name}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start text-left font-medium ${
                            isActive ? "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/15" : "text-gray-700"
                          }`}
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Button>
                      </SheetClose>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DashboardMobileNav;

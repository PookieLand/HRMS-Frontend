// Teams & Hierarchy Page
// Displays organizational hierarchy and team structures

import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { Link } from "@tanstack/react-router";
import {
 getTeamMembers,
 type Team,
 type TeamMember,
} from "../../../lib/api/employees";

export default function TeamsView() {
 const { getAccessToken } = useAsgardeo();
 const [teams, setTeams] = useState<Map<number, Team>>(new Map());
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [userRoles, setUserRoles] = useState<string[]>([]);
 const [selectedManagerId, setSelectedManagerId] = useState<number | null>(
  null,
 );
 const [currentUserId, setCurrentUserId] = useState<number | null>(null);

 useEffect(() => {
  loadTeamsData();
 }, []);

 async function loadTeamsData() {
  try {
   setLoading(true);
   setError(null);

   const token = await getAccessToken();

   // Extract roles and user info from token
   const base64Url = token.split(".")[1];
   const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
   const payload = JSON.parse(window.atob(base64));
   const roles = payload.groups || [];
   setUserRoles(roles);

   // Extract user_id from token (might be in 'sub' or 'user_id' claim)
   const userId = payload.user_id || payload.sub;
   if (userId) {
    setCurrentUserId(parseInt(userId));
   }

   // For managers, load their team
   // For HR, we'd need to load all teams (this would require an API endpoint to list all managers)
   // For now, we'll just show a placeholder
  } catch (err) {
   console.error("Failed to load teams:", err);
   setError(err instanceof Error ? err.message : "Failed to load team data");
  } finally {
   setLoading(false);
  }
 }

 async function loadTeam(managerId: number) {
  try {
   const token = await getAccessToken();
   const team = await getTeamMembers(managerId, token);
   setTeams((prev) => new Map(prev).set(managerId, team));
   setSelectedManagerId(managerId);
  } catch (err) {
   console.error("Failed to load team:", err);
   setError(err instanceof Error ? err.message : "Failed to load team");
  }
 }

 const isHR = userRoles.some(
  (r) =>
   r.includes("HR_Admin") ||
   r.includes("HR_Manager") ||
   r.includes("HR_Administrators") ||
   r.includes("HR_Managers"),
 );

 const isManager = userRoles.some((r) => r.includes("Manager"));

 if (loading) {
  return (
   <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
   </div>
  );
 }

 return (
  <div className="p-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="mb-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
     Teams & Hierarchy
    </h1>
    <p className="text-gray-600">
     View organizational structure and team compositions
    </p>
   </div>

   {/* Error State */}
   {error && (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
     <p className="text-red-800">{error}</p>
    </div>
   )}

   {/* Manager Selection (for HR) */}
   {isHR && (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">
      Select Manager to View Team
     </h2>
     <div className="flex items-center gap-4">
      <input
       type="number"
       placeholder="Enter Manager ID"
       className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
       onKeyDown={(e) => {
        if (e.key === "Enter") {
         const input = e.target as HTMLInputElement;
         const managerId = parseInt(input.value);
         if (!isNaN(managerId)) {
          loadTeam(managerId);
         }
        }
       }}
      />
      <button
       onClick={() => {
        const input = document.querySelector(
         'input[type="number"]',
        ) as HTMLInputElement;
        const managerId = parseInt(input.value);
        if (!isNaN(managerId)) {
         loadTeam(managerId);
        }
       }}
       className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
       Load Team
      </button>
     </div>
     <p className="text-sm text-gray-500 mt-2">
      Note: Full hierarchy view will be available once the backend API is
      implemented
     </p>
    </div>
   )}

   {/* My Team (for Managers) */}
   {isManager && currentUserId && (
    <div className="mb-6">
     <button
      onClick={() => loadTeam(currentUserId)}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
     >
      View My Team
     </button>
    </div>
   )}

   {/* Team Display */}
   {selectedManagerId && teams.has(selectedManagerId) ? (
    <div className="bg-white rounded-lg shadow overflow-hidden">
     {/* Manager Card */}
     <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6">
      <div className="flex items-center">
       <div className="flex-shrink-0 h-16 w-16">
        <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl shadow-lg">
         {teams
          .get(selectedManagerId)!
          .manager.full_name.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)}
        </div>
       </div>
       <div className="ml-6">
        <h2 className="text-2xl font-bold text-white">
         {teams.get(selectedManagerId)!.manager.full_name}
        </h2>
        <p className="text-blue-100">
         {teams.get(selectedManagerId)!.manager.job_title}
        </p>
        <p className="text-blue-100 text-sm">
         {teams.get(selectedManagerId)!.manager.email}
        </p>
       </div>
      </div>
     </div>

     {/* Team Members */}
     <div className="p-6">
      <div className="flex items-center justify-between mb-4">
       <h3 className="text-lg font-semibold text-gray-900">
        Team Members ({teams.get(selectedManagerId)!.team_size})
       </h3>
      </div>

      {teams.get(selectedManagerId)!.team_members.length === 0 ? (
       <p className="text-gray-500 text-center py-8">
        No team members found
       </p>
      ) : (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams
         .get(selectedManagerId)!
         .team_members.map((member: TeamMember) => (
          <Link
           key={member.id}
           to="/dashboard/employees/$id"
           params={{ id: member.id.toString() }}
           className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
           <div className="flex items-center mb-3">
            <div className="flex-shrink-0 h-12 w-12">
             <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
              {member.full_name
               .split(" ")
               .map((n) => n[0])
               .join("")
               .toUpperCase()
               .slice(0, 2)}
             </div>
            </div>
            <div className="ml-4 flex-1 min-w-0">
             <h4 className="text-sm font-semibold text-gray-900 truncate">
              {member.full_name}
             </h4>
             <p className="text-xs text-gray-500 truncate">
              {member.email}
             </p>
            </div>
           </div>
           <div className="space-y-1">
            <p className="text-sm text-gray-700">
             {member.job_title}
            </p>
            <p className="text-xs text-gray-500">
             {member.department}
            </p>
            <span
             className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
              member.status === "active"
               ? "bg-green-100 text-green-800"
               : "bg-gray-100 text-gray-800"
             }`}
            >
             {member.status}
            </span>
           </div>
          </Link>
         ))}
       </div>
      )}
     </div>
    </div>
   ) : (
    <div className="bg-white rounded-lg shadow p-12 text-center">
     <div className="text-gray-400 mb-4">
      <svg
       className="mx-auto h-16 w-16"
       fill="none"
       viewBox="0 0 24 24"
       stroke="currentColor"
      >
       <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
       />
      </svg>
     </div>
     <h3 className="text-lg font-medium text-gray-900 mb-2">
      No Team Selected
     </h3>
     <p className="text-gray-500">
      {isHR
       ? "Enter a manager ID above to view their team"
       : isManager
        ? "Click 'View My Team' to see your team members"
        : "You don't have permission to view team hierarchies"}
     </p>
    </div>
   )}

   {/* Info Card */}
   <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex">
     <div className="flex-shrink-0">
      <svg
       className="h-5 w-5 text-blue-400"
       viewBox="0 0 20 20"
       fill="currentColor"
      >
       <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
       />
      </svg>
     </div>
     <div className="ml-3">
      <h3 className="text-sm font-medium text-blue-800">
       Feature In Development
      </h3>
      <div className="mt-2 text-sm text-blue-700">
       <p>
        The full organizational hierarchy view is currently being
        implemented. Once complete, you'll be able to:
       </p>
       <ul className="list-disc list-inside mt-2 space-y-1">
        <li>View the complete organizational chart</li>
        <li>Navigate through different levels of management</li>
        <li>See reporting chains and team structures</li>
        <li>Export hierarchy data</li>
       </ul>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}

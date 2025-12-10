// Employee Detail Page
// Displays detailed employee information including profile, employment history, and actions

import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { useMatch, useNavigate, Link } from "@tanstack/react-router";
import {
 getEmployee,
 getEmploymentHistory,
 calculateEmploymentDuration,
 formatSalary,
 getStatusColor,
 canSeeSalary,
 type Employee,
 type EmploymentHistoryEntry,
} from "../../../lib/api/employees";

export default function EmployeeDetail() {
 const { id } = useMatch({
  from: "/dashboard/employees/$id",
  select: (match) => match.params,
 });
 const { getAccessToken } = useAsgardeo();
 const navigate = useNavigate();

 const [employee, setEmployee] = useState<Employee | null>(null);
 const [history, setHistory] = useState<EmploymentHistoryEntry[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [userRoles, setUserRoles] = useState<string[]>([]);
 const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");

 useEffect(() => {
  if (id) {
   loadEmployeeData();
  }
 }, [id]);

 async function loadEmployeeData() {
  try {
   setLoading(true);
   setError(null);

   const token = await getAccessToken();

   // Extract roles from token
   const base64Url = token.split(".")[1];
   const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
   const payload = JSON.parse(window.atob(base64));
   const roles = payload.groups || [];
   setUserRoles(roles);

   // Load employee data
   const employeeData = await getEmployee(Number(id), token);
   setEmployee(employeeData);

   // Load employment history
   try {
    const historyData = await getEmploymentHistory(Number(id), token);
    setHistory(historyData);
   } catch (err) {
    console.warn("Could not load employment history:", err);
    // History might not be available yet, continue without it
   }
  } catch (err) {
   console.error("Failed to load employee:", err);
   setError(
    err instanceof Error ? err.message : "Failed to load employee data",
   );
  } finally {
   setLoading(false);
  }
 }

 if (loading) {
  return (
   <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
   </div>
  );
 }

 if (error || !employee) {
  return (
   <div className="p-6 max-w-7xl mx-auto">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
     <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
     <p className="text-red-700">{error || "Employee not found"}</p>
     <button
      onClick={() => navigate({ to: "/dashboard/employees" })}
      className="mt-4 text-red-600 hover:text-red-800 font-medium"
     >
      ← Back to Employee Directory
     </button>
    </div>
   </div>
  );
 }

 const showSalary = canSeeSalary(userRoles);
 const statusColor = getStatusColor(employee.status);

 return (
  <div className="p-6 max-w-7xl mx-auto">
   {/* Breadcrumb */}
   <div className="mb-6">
    <Link
     to="/dashboard/employees"
     className="text-blue-600 hover:text-blue-800 text-sm font-medium"
    >
     ← Back to Employees
    </Link>
   </div>

   {/* Header Card */}
   <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
     <div className="flex items-center">
      <div className="flex-shrink-0 h-20 w-20">
       <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg">
        {employee.full_name
         .split(" ")
         .map((n) => n[0])
         .join("")
         .toUpperCase()
         .slice(0, 2)}
       </div>
      </div>
      <div className="ml-6 flex-1">
       <h1 className="text-3xl font-bold text-white mb-1">
        {employee.full_name}
       </h1>
       <p className="text-blue-100 text-lg">{employee.job_title}</p>
       <div className="flex items-center gap-4 mt-2">
        <span className="text-blue-100 text-sm">{employee.email}</span>
        <span
         className={`px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800`}
        >
         {employee.status}
        </span>
       </div>
      </div>
     </div>
    </div>

    {/* Tabs */}
    <div className="border-b border-gray-200">
     <nav className="flex -mb-px">
      <button
       onClick={() => setActiveTab("profile")}
       className={`px-6 py-4 text-sm font-medium border-b-2 ${
        activeTab === "profile"
         ? "border-blue-500 text-blue-600"
         : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
       }`}
      >
       Profile
      </button>
      <button
       onClick={() => setActiveTab("history")}
       className={`px-6 py-4 text-sm font-medium border-b-2 ${
        activeTab === "history"
         ? "border-blue-500 text-blue-600"
         : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
       }`}
      >
       Employment History
      </button>
     </nav>
    </div>
   </div>

   {/* Profile Tab */}
   {activeTab === "profile" && (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     {/* Personal Information */}
     <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
       Personal Information
      </h2>
      <div className="space-y-3">
       <div>
        <label className="text-sm font-medium text-gray-500">
         Full Name
        </label>
        <p className="text-gray-900">{employee.full_name}</p>
       </div>
       <div>
        <label className="text-sm font-medium text-gray-500">
         Email
        </label>
        <p className="text-gray-900">{employee.email}</p>
       </div>
       {employee.phone && (
        <div>
         <label className="text-sm font-medium text-gray-500">
          Phone
         </label>
         <p className="text-gray-900">{employee.phone}</p>
        </div>
       )}
       {employee.date_of_birth && (
        <div>
         <label className="text-sm font-medium text-gray-500">
          Date of Birth
         </label>
         <p className="text-gray-900">
          {new Date(employee.date_of_birth).toLocaleDateString()}
         </p>
        </div>
       )}
       {employee.address && (
        <div>
         <label className="text-sm font-medium text-gray-500">
          Address
         </label>
         <p className="text-gray-900">{employee.address}</p>
        </div>
       )}
      </div>
     </div>

     {/* Employment Information */}
     <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
       Employment Information
      </h2>
      <div className="space-y-3">
       <div>
        <label className="text-sm font-medium text-gray-500">
         Job Title
        </label>
        <p className="text-gray-900">{employee.job_title}</p>
       </div>
       <div>
        <label className="text-sm font-medium text-gray-500">
         Department
        </label>
        <p className="text-gray-900">{employee.department}</p>
       </div>
       {employee.position && (
        <div>
         <label className="text-sm font-medium text-gray-500">
          Position
         </label>
         <p className="text-gray-900">{employee.position}</p>
        </div>
       )}
       <div>
        <label className="text-sm font-medium text-gray-500">
         Employment Type
        </label>
        <p className="text-gray-900 capitalize">
         {employee.employment_type}
        </p>
       </div>
       <div>
        <label className="text-sm font-medium text-gray-500">
         Hire Date
        </label>
        <p className="text-gray-900">
         {new Date(employee.hire_date).toLocaleDateString()}
        </p>
       </div>
       <div>
        <label className="text-sm font-medium text-gray-500">
         Tenure
        </label>
        <p className="text-gray-900">
         {calculateEmploymentDuration(employee.hire_date)}
        </p>
       </div>
       {employee.contract_end_date && (
        <div>
         <label className="text-sm font-medium text-gray-500">
          Contract End Date
         </label>
         <p className="text-gray-900">
          {new Date(employee.contract_end_date).toLocaleDateString()}
         </p>
        </div>
       )}
       {employee.probation_end_date && (
        <div>
         <label className="text-sm font-medium text-gray-500">
          Probation End Date
         </label>
         <p className="text-gray-900">
          {new Date(employee.probation_end_date).toLocaleDateString()}
         </p>
        </div>
       )}
       {showSalary && employee.salary && (
        <div>
         <label className="text-sm font-medium text-gray-500">
          Salary
         </label>
         <p className="text-gray-900 font-semibold">
          {formatSalary(employee.salary)}
         </p>
        </div>
       )}
      </div>
     </div>

     {/* Emergency Contact */}
     {(employee.emergency_contact_name ||
      employee.emergency_contact_phone) && (
      <div className="bg-white rounded-lg shadow p-6">
       <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Emergency Contact
       </h2>
       <div className="space-y-3">
        {employee.emergency_contact_name && (
         <div>
          <label className="text-sm font-medium text-gray-500">
           Name
          </label>
          <p className="text-gray-900">
           {employee.emergency_contact_name}
          </p>
         </div>
        )}
        {employee.emergency_contact_phone && (
         <div>
          <label className="text-sm font-medium text-gray-500">
           Phone
          </label>
          <p className="text-gray-900">
           {employee.emergency_contact_phone}
          </p>
         </div>
        )}
       </div>
      </div>
     )}

     {/* Manager Information */}
     {employee.manager_name && (
      <div className="bg-white rounded-lg shadow p-6">
       <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Reporting Structure
       </h2>
       <div className="space-y-3">
        <div>
         <label className="text-sm font-medium text-gray-500">
          Reports To
         </label>
         <p className="text-gray-900">{employee.manager_name}</p>
        </div>
       </div>
      </div>
     )}
    </div>
   )}

   {/* History Tab */}
   {activeTab === "history" && (
    <div className="bg-white rounded-lg shadow">
     <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">
       Employment History
      </h2>
     </div>
     <div className="p-6">
      {history.length === 0 ? (
       <p className="text-gray-500 text-center py-8">
        No employment history records available
       </p>
      ) : (
       <div className="space-y-4">
        {history.map((entry) => (
         <div
          key={entry.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
         >
          <div className="flex items-start justify-between mb-2">
           <div>
            <h3 className="font-semibold text-gray-900 capitalize">
             {entry.change_type.replace(/_/g, " ")}
            </h3>
            <p className="text-sm text-gray-500">
             {new Date(entry.effective_date).toLocaleDateString()}
            </p>
           </div>
           <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            {entry.change_type}
           </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
           {entry.previous_job_title && (
            <div>
             <p className="text-xs text-gray-500">
              Previous Title
             </p>
             <p className="text-sm text-gray-700">
              {entry.previous_job_title}
             </p>
            </div>
           )}
           {entry.new_job_title && (
            <div>
             <p className="text-xs text-gray-500">New Title</p>
             <p className="text-sm text-gray-900 font-medium">
              {entry.new_job_title}
             </p>
            </div>
           )}
           {entry.previous_department && (
            <div>
             <p className="text-xs text-gray-500">
              Previous Department
             </p>
             <p className="text-sm text-gray-700">
              {entry.previous_department}
             </p>
            </div>
           )}
           {entry.new_department && (
            <div>
             <p className="text-xs text-gray-500">
              New Department
             </p>
             <p className="text-sm text-gray-900 font-medium">
              {entry.new_department}
             </p>
            </div>
           )}
           {showSalary && entry.previous_salary && (
            <div>
             <p className="text-xs text-gray-500">
              Previous Salary
             </p>
             <p className="text-sm text-gray-700">
              {formatSalary(entry.previous_salary)}
             </p>
            </div>
           )}
           {showSalary && entry.new_salary && (
            <div>
             <p className="text-xs text-gray-500">New Salary</p>
             <p className="text-sm text-gray-900 font-medium">
              {formatSalary(entry.new_salary)}
             </p>
            </div>
           )}
          </div>

          {entry.notes && (
           <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Notes</p>
            <p className="text-sm text-gray-700">{entry.notes}</p>
           </div>
          )}

          <div className="mt-3 text-xs text-gray-400">
           Changed on {new Date(entry.changed_at).toLocaleString()}
          </div>
         </div>
        ))}
       </div>
      )}
     </div>
    </div>
   )}

   {/* Actions Card (for HR/Managers) */}
   {userRoles.some(
    (r) =>
     r.includes("HR_Admin") ||
     r.includes("HR_Manager") ||
     r.includes("Manager"),
   ) && (
    <div className="mt-6 bg-white rounded-lg shadow p-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
     <div className="flex flex-wrap gap-3">
      <button
       onClick={() => navigate({ to: "/dashboard/employees" })}
       className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
       Edit Employee
      </button>
      <button
       onClick={() => navigate({ to: "/dashboard/employees" })}
       className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
       Promote
      </button>
      {employee.status === "active" ? (
       <button
        onClick={() => {
         if (
          confirm(
           `Are you sure you want to suspend ${employee.full_name}?`,
          )
         ) {
          // This would call user-service suspend endpoint
          alert("Suspend functionality to be implemented");
         }
        }}
        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
       >
        Suspend
       </button>
      ) : employee.status === "suspended" ? (
       <button
        onClick={() => {
         if (
          confirm(
           `Are you sure you want to activate ${employee.full_name}?`,
          )
         ) {
          // This would call user-service activate endpoint
          alert("Activate functionality to be implemented");
         }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
       >
        Activate
       </button>
      ) : null}
     </div>
    </div>
   )}
  </div>
 );
}
